"""Swift Formations multi-tenant CMS backend.

Single-file FastAPI app: auth (JWT), country & content CRUD, public landing
endpoint (resolved by host or tenant slug), and a B2BHub proxy.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import bcrypt
import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from b2bhub import fetch_b2bhub_data
from seed_data import SEED_COUNTRIES, auto_abbreviation, default_content_for
import analytics

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("swift")

# ─────────────────────────────────────────────────────────────────────────────
# DB
# ─────────────────────────────────────────────────────────────────────────────
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ─────────────────────────────────────────────────────────────────────────────
# Auth helpers
# ─────────────────────────────────────────────────────────────────────────────
JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24 * 7  # 7 days


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _client_ip(request: Request) -> str:
    """Resolve real client IP, respecting common proxy headers."""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    real = request.headers.get("x-real-ip", "")
    if real:
        return real.strip()
    return request.client.host if request.client else "unknown"


# Brute force guard
async def check_login_lockout(identifier: str) -> None:
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("locked_until"):
        if datetime.fromisoformat(rec["locked_until"]) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")


async def record_failed_login(identifier: str) -> None:
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec.get("count", 0) if rec else 0) + 1
    update: Dict[str, Any] = {"count": count, "last_failed_at": now.isoformat()}
    if count >= 5:
        update["locked_until"] = (now + timedelta(minutes=15)).isoformat()
        update["count"] = 0
    await db.login_attempts.update_one(
        {"identifier": identifier}, {"$set": update}, upsert=True
    )


async def clear_failed_login(identifier: str) -> None:
    await db.login_attempts.delete_one({"identifier": identifier})


# ─────────────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class MeOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str


class CountryIn(BaseModel):
    slug: str = Field(..., min_length=2, max_length=10)
    name: str
    long_name: Optional[str] = None
    flag: str = ""
    domain: str
    brand_name: str
    brand_color: str = "#0A0A0A"
    accent_color: str = "#C8102E"
    currency: str = "USD"
    currency_symbol: str = "$"
    locale: str = "en"
    country_code: str = ""
    capital: str = ""
    authority_name: str = ""
    authority_short: str = ""
    company_type: str = "Limited Company"
    legal_suffix: str = ""
    b2bhub_country_code: str = ""
    abbreviation: Optional[str] = None


class CountryOut(CountryIn):
    id: str
    status: str = "draft"
    created_at: str
    updated_at: str


class ContentPatch(BaseModel):
    content: Dict[str, Any]


# ─────────────────────────────────────────────────────────────────────────────
# Seeding
# ─────────────────────────────────────────────────────────────────────────────
async def seed_admin() -> None:
    email = os.environ.get("ADMIN_EMAIL", "admin@swiftformations.io").lower()
    password = os.environ.get("ADMIN_PASSWORD", "Admin@12345")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Admin",
            "role": "super_admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        logger.info("Seeded admin user: %s", email)
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one(
            {"email": email}, {"$set": {"password_hash": hash_password(password)}}
        )
        logger.info("Updated admin password hash for: %s", email)


async def seed_countries() -> None:
    """Idempotent: only seeds countries that don't exist yet."""
    for c in SEED_COUNTRIES:
        existing = await db.countries.find_one({"slug": c["slug"]})
        if existing:
            continue
        now = datetime.now(timezone.utc).isoformat()
        country_id = str(uuid.uuid4())
        doc = {
            "id": country_id,
            "slug": c["slug"],
            "name": c["name"],
            "long_name": c.get("long_name", c["name"]),
            "flag": c["flag"],
            "domain": c["domain"],
            "brand_name": c["brand_name"],
            "abbreviation": auto_abbreviation(c["brand_name"]),
            "brand_color": c["brand_color"],
            "accent_color": c["accent_color"],
            "currency": c["currency"],
            "currency_symbol": c["currency_symbol"],
            "locale": c["locale"],
            "country_code": c["country_code"],
            "capital": c["capital"],
            "authority_name": c["authority_name"],
            "authority_short": c["authority_short"],
            "company_type": c["company_type"],
            "legal_suffix": c["legal_suffix"],
            "b2bhub_country_code": c["b2bhub_country_code"],
            "status": "published",
            "created_at": now,
            "updated_at": now,
        }
        await db.countries.insert_one(doc)
        content_doc = {
            "country_id": country_id,
            "content": default_content_for(c),
            "updated_at": now,
        }
        await db.landing_content.insert_one(content_doc)
        logger.info("Seeded country: %s", c["slug"])


async def ensure_indexes() -> None:
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.countries.create_index("slug", unique=True)
    await db.countries.create_index("domain")
    await db.countries.create_index("id", unique=True)
    await db.landing_content.create_index("country_id", unique=True)
    await db.login_attempts.create_index("identifier")
    # Analytics
    await db.events.create_index([("tenant_slug", 1), ("ts", -1)])
    await db.events.create_index([("tenant_slug", 1), ("type", 1), ("ts", -1)])
    await db.events.create_index("visitor_id")
    await db.events.create_index("session_id")
    await db.events.create_index("is_demo")
    await db.ip_geo.create_index("ip", unique=True)


# ─────────────────────────────────────────────────────────────────────────────
# App + routers
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Swift Formations API")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"service": "swift-formations", "status": "ok"}


# ─── Auth ───
@api.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    email = payload.email.lower()
    ip = _client_ip(request)
    # Two-pronged lockout: primarily by email (guarantees the threshold
    # is reachable behind reverse proxies), secondarily by ip+email.
    email_key = f"email:{email}"
    pair_key = f"{ip}:{email}"
    await check_login_lockout(email_key)
    await check_login_lockout(pair_key)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_login(email_key)
        await record_failed_login(pair_key)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await clear_failed_login(email_key)
    await clear_failed_login(pair_key)
    token = create_access_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        },
    }


@api.get("/auth/me", response_model=MeOut)
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return MeOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"])


# ─── Public landing endpoint ───
def _resolve_tenant(host: Optional[str], tenant: Optional[str]) -> Optional[str]:
    """Return a Mongo filter for the country, or None."""
    if tenant:
        return tenant
    if not host:
        return None
    # Strip port + www.
    host = host.split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


@api.get("/public/landing")
async def public_landing(host: Optional[str] = None, tenant: Optional[str] = None):
    # Try by domain first, then by slug
    country = None
    if tenant:
        country = await db.countries.find_one({"slug": tenant.lower()}, {"_id": 0})
    if country is None and host:
        host_clean = _resolve_tenant(host, None)
        country = await db.countries.find_one({"domain": host_clean}, {"_id": 0})
    if country is None:
        # Fallback: first published country (so previews never 404)
        country = await db.countries.find_one(
            {"status": "published"}, {"_id": 0}, sort=[("created_at", 1)]
        )
    if country is None:
        raise HTTPException(status_code=404, detail="No countries configured")

    content_doc = await db.landing_content.find_one(
        {"country_id": country["id"]}, {"_id": 0}
    )
    if not content_doc:
        content_doc = {"content": default_content_for(_country_to_seed_format(country))}

    b2bhub = await fetch_b2bhub_data(country.get("b2bhub_country_code") or country.get("country_code", ""))
    return {"country": country, "content": content_doc["content"], "b2bhub": b2bhub}


def _country_to_seed_format(c: Dict[str, Any]) -> Dict[str, Any]:
    """Adapt a stored country doc back into the seed-template shape."""
    return {
        "name": c.get("name", ""),
        "long_name": c.get("long_name", c.get("name", "")),
        "flag": c.get("flag", ""),
        "brand_name": c.get("brand_name", ""),
        "currency": c.get("currency", "USD"),
        "currency_symbol": c.get("currency_symbol", "$"),
        "capital": c.get("capital", ""),
        "authority_name": c.get("authority_name", ""),
        "authority_short": c.get("authority_short", ""),
        "company_type": c.get("company_type", "Limited Company"),
        "price_from": "0",
        "privacy_price": "0",
        "allinclusive_price": "0",
        "government_fee_text": "—",
        "legal_suffix": c.get("legal_suffix", ""),
    }


# ─── Admin: countries CRUD ───
@api.get("/admin/countries")
async def list_countries(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.countries.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return docs


@api.get("/admin/countries/{country_id}")
async def get_country(country_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    c = await db.countries.find_one({"id": country_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    content_doc = await db.landing_content.find_one({"country_id": country_id}, {"_id": 0})
    return {"country": c, "content": (content_doc or {}).get("content", {})}


@api.post("/admin/countries", response_model=CountryOut)
async def create_country(body: CountryIn, user: Dict[str, Any] = Depends(get_current_user)):
    slug = body.slug.lower()
    if await db.countries.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="Slug already exists")
    now = datetime.now(timezone.utc).isoformat()
    country_id = str(uuid.uuid4())
    doc = body.model_dump()
    doc.update({
        "id": country_id,
        "slug": slug,
        "abbreviation": body.abbreviation or auto_abbreviation(body.brand_name),
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    })
    await db.countries.insert_one(doc)
    # Seed default content based on inferred values
    seed_input = {
        **doc,
        "price_from": "49",
        "privacy_price": "149",
        "allinclusive_price": "299",
        "government_fee_text": "—",
    }
    await db.landing_content.insert_one({
        "country_id": country_id,
        "content": default_content_for(seed_input),
        "updated_at": now,
    })
    doc.pop("_id", None)
    return CountryOut(**doc)


@api.patch("/admin/countries/{country_id}")
async def update_country(
    country_id: str, body: Dict[str, Any], user: Dict[str, Any] = Depends(get_current_user)
):
    c = await db.countries.find_one({"id": country_id})
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    body.pop("id", None)
    body.pop("created_at", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "brand_name" in body and not body.get("abbreviation"):
        body["abbreviation"] = auto_abbreviation(body["brand_name"])
    await db.countries.update_one({"id": country_id}, {"$set": body})
    updated = await db.countries.find_one({"id": country_id}, {"_id": 0})
    return updated


@api.delete("/admin/countries/{country_id}")
async def delete_country(country_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.countries.delete_one({"id": country_id})
    await db.landing_content.delete_one({"country_id": country_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Country not found")
    return {"ok": True}


@api.patch("/admin/countries/{country_id}/content")
async def update_content(
    country_id: str, body: ContentPatch, user: Dict[str, Any] = Depends(get_current_user)
):
    c = await db.countries.find_one({"id": country_id})
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.landing_content.update_one(
        {"country_id": country_id},
        {"$set": {"content": body.content, "updated_at": now}},
        upsert=True,
    )
    await db.countries.update_one({"id": country_id}, {"$set": {"updated_at": now}})
    return {"ok": True, "updated_at": now}


@api.post("/admin/countries/{country_id}/publish")
async def publish_country(country_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    c = await db.countries.find_one({"id": country_id})
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    await db.countries.update_one(
        {"id": country_id},
        {"$set": {"status": "published", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "status": "published"}


@api.post("/admin/countries/{country_id}/unpublish")
async def unpublish_country(country_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.countries.update_one(
        {"id": country_id},
        {"$set": {"status": "draft", "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "status": "draft"}


@api.post("/admin/countries/{country_id}/reset-content")
async def reset_content(country_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    c = await db.countries.find_one({"id": country_id})
    if not c:
        raise HTTPException(status_code=404, detail="Country not found")
    seed_input = {
        **c,
        "price_from": "49",
        "privacy_price": "149",
        "allinclusive_price": "299",
        "government_fee_text": "—",
    }
    now = datetime.now(timezone.utc).isoformat()
    await db.landing_content.update_one(
        {"country_id": country_id},
        {"$set": {"content": default_content_for(seed_input), "updated_at": now}},
        upsert=True,
    )
    return {"ok": True}


# ─── B2BHub proxy ───
@api.get("/admin/b2bhub/{country_code}")
async def admin_b2bhub(country_code: str, user: Dict[str, Any] = Depends(get_current_user)):
    return await fetch_b2bhub_data(country_code)


# ─── Analytics: public ingest ───
class TrackBatch(BaseModel):
    events: List[Dict[str, Any]] = Field(default_factory=list)


@api.post("/track")
async def track(payload: TrackBatch, request: Request):
    inserted = await analytics.ingest_events(
        db,
        payload.events or [],
        dict(request.headers),
        request.client.host if request.client else "unknown",
    )
    return {"ok": True, "received": inserted}


# ─── Analytics: admin ───
@api.get("/admin/analytics/overview")
async def analytics_overview(
    period: str = "7d", tenant: Optional[str] = None,
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.overview(db, tenant, period)


@api.get("/admin/analytics/timeseries")
async def analytics_timeseries(
    period: str = "7d", tenant: Optional[str] = None,
    metric: str = "page_views",
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.timeseries(db, tenant, period, metric)


@api.get("/admin/analytics/breakdown/{dimension}")
async def analytics_breakdown(
    dimension: str, period: str = "7d", tenant: Optional[str] = None,
    limit: int = 12,
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.breakdown(db, tenant, period, dimension, limit)


@api.get("/admin/analytics/rankings")
async def analytics_rankings(
    period: str = "7d",
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.rankings(db, period)


@api.get("/admin/analytics/funnel")
async def analytics_funnel(
    period: str = "7d", tenant: Optional[str] = None,
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.funnel(db, tenant, period)


@api.get("/admin/analytics/recent")
async def analytics_recent(
    tenant: Optional[str] = None, limit: int = 100,
    user: Dict[str, Any] = Depends(get_current_user),
):
    return await analytics.recent_events(db, tenant, limit)


@api.post("/admin/analytics/seed-demo")
async def analytics_seed_demo(user: Dict[str, Any] = Depends(get_current_user)):
    slugs = [c["slug"] async for c in db.countries.find({}, {"slug": 1, "_id": 0})]
    count = await analytics.seed_demo_events(db, slugs or ["uk"], n_days=30)
    return {"ok": True, "inserted": count}


@api.delete("/admin/analytics/seed-demo")
async def analytics_clear_demo(user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.events.delete_many({"is_demo": True})
    return {"ok": True, "deleted": res.deleted_count}


# ─────────────────────────────────────────────────────────────────────────────
# Startup / shutdown
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    await ensure_indexes()
    await seed_admin()
    await seed_countries()
    logger.info("Startup complete.")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
