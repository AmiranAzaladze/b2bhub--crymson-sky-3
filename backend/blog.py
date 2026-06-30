"""Blog module — fully tenant-scoped articles with rich text + covers + tags.

Database collections:
- blog_posts: { id, country_id, slug, title, excerpt, body_html, cover_url,
                gallery[], tags[], author{name,avatar,bio}, links[],
                status, published_at, created_at, updated_at, read_time }

File uploads land in BLOG_UPLOAD_DIR and are served from /uploads via the
StaticFiles mount registered in server.py.
"""

from __future__ import annotations

import os
import re
import uuid
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

# Where uploaded media is stored on disk (mounted as /uploads in server.py).
BLOG_UPLOAD_DIR = Path(os.environ.get("BLOG_UPLOAD_DIR", "/app/backend/uploads"))
BLOG_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(BLOG_UPLOAD_DIR / "blog").mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB

SLUG_RE = re.compile(r"[^a-z0-9-]+")


def slugify(s: str) -> str:
    s = (s or "").lower().strip()
    s = SLUG_RE.sub("-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or uuid.uuid4().hex[:8]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def estimate_read_time(html: str) -> int:
    """Rough words-per-minute calc on the plain-text version of HTML."""
    text = re.sub(r"<[^>]+>", " ", html or "")
    words = len(re.findall(r"\w+", text))
    return max(1, round(words / 220))


# ────────────────────────────── Pydantic models ─────────────────────────────


class Author(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None


class BlogLink(BaseModel):
    label: str
    url: str


class BlogPostIn(BaseModel):
    country_id: Optional[str] = None  # if None → "global" post available on all tenants
    title: str
    slug: Optional[str] = None  # auto from title if missing
    excerpt: Optional[str] = ""
    body_html: Optional[str] = ""
    cover_url: Optional[str] = None
    gallery: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    author: Optional[Author] = None
    links: List[BlogLink] = Field(default_factory=list)
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "draft"  # draft | published


class BlogPostOut(BlogPostIn):
    id: str
    read_time: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None


# ────────────────────────────── Helpers ─────────────────────────────


def _strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    if doc and "_id" in doc:
        doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    doc = _strip_id(dict(doc))
    for k in ("created_at", "updated_at", "published_at"):
        v = doc.get(k)
        if isinstance(v, datetime):
            doc[k] = v.isoformat()
    return doc


async def _unique_slug(db: AsyncIOMotorDatabase, country_id: Optional[str], slug: str,
                      ignore_id: Optional[str] = None) -> str:
    base = slug
    n = 0
    while True:
        candidate = base if n == 0 else f"{base}-{n}"
        q = {"slug": candidate, "country_id": country_id}
        if ignore_id:
            q["id"] = {"$ne": ignore_id}
        existing = await db.blog_posts.find_one(q)
        if not existing:
            return candidate
        n += 1


# ────────────────────────────── Router factory ─────────────────────────────


def create_blog_router(
    db: AsyncIOMotorDatabase,
    get_current_user,  # auth dependency injected from server.py
    country_from_host,  # async function (Request) -> country dict
):
    """Build the blog router. We accept dependencies so the module stays
    decoupled from server.py."""

    router = APIRouter()

    # ───────── Admin: list ─────────
    @router.get("/admin/blog")
    async def admin_list(
        country_id: Optional[str] = None,
        status_filter: Optional[str] = Query(None, alias="status"),
        user: Dict[str, Any] = Depends(get_current_user),
    ):
        q: Dict[str, Any] = {}
        if country_id:
            q["country_id"] = country_id
        if status_filter:
            q["status"] = status_filter
        cursor = db.blog_posts.find(q).sort("created_at", -1)
        out = [_serialize(d) async for d in cursor]
        return out

    # ───────── Admin: create ─────────
    @router.post("/admin/blog")
    async def admin_create(payload: BlogPostIn, user: Dict[str, Any] = Depends(get_current_user)):
        slug = slugify(payload.slug or payload.title)
        slug = await _unique_slug(db, payload.country_id, slug)
        now = now_utc()
        doc = {
            "id": str(uuid.uuid4()),
            "country_id": payload.country_id,
            "title": payload.title,
            "slug": slug,
            "excerpt": payload.excerpt or "",
            "body_html": payload.body_html or "",
            "cover_url": payload.cover_url,
            "gallery": payload.gallery,
            "tags": [t.strip() for t in payload.tags if t and t.strip()],
            "author": payload.author.dict() if payload.author else None,
            "links": [link.dict() for link in payload.links],
            "seo_title": payload.seo_title,
            "seo_description": payload.seo_description,
            "status": payload.status,
            "read_time": estimate_read_time(payload.body_html or ""),
            "created_at": now,
            "updated_at": now,
            "published_at": now if payload.status == "published" else None,
        }
        await db.blog_posts.insert_one(doc)
        return _serialize(doc)

    # ───────── Admin: read one ─────────
    @router.get("/admin/blog/{post_id}")
    async def admin_get(post_id: str, user: Dict[str, Any] = Depends(get_current_user)):
        doc = await db.blog_posts.find_one({"id": post_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Post not found")
        return _serialize(doc)

    # ───────── Admin: update ─────────
    @router.patch("/admin/blog/{post_id}")
    async def admin_update(post_id: str, payload: Dict[str, Any],
                            user: Dict[str, Any] = Depends(get_current_user)):
        existing = await db.blog_posts.find_one({"id": post_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Post not found")

        update: Dict[str, Any] = {}
        for key in ("title", "excerpt", "body_html", "cover_url", "tags",
                    "links", "author", "seo_title", "seo_description",
                    "country_id", "gallery"):
            if key in payload:
                update[key] = payload[key]

        if "slug" in payload and payload["slug"]:
            update["slug"] = await _unique_slug(
                db, update.get("country_id", existing.get("country_id")),
                slugify(payload["slug"]), ignore_id=post_id,
            )

        if "body_html" in update:
            update["read_time"] = estimate_read_time(update["body_html"])

        new_status = payload.get("status")
        if new_status and new_status in ("draft", "published"):
            update["status"] = new_status
            if new_status == "published" and not existing.get("published_at"):
                update["published_at"] = now_utc()

        update["updated_at"] = now_utc()
        await db.blog_posts.update_one({"id": post_id}, {"$set": update})
        merged = {**existing, **update}
        return _serialize(merged)

    # ───────── Admin: delete ─────────
    @router.delete("/admin/blog/{post_id}")
    async def admin_delete(post_id: str, user: Dict[str, Any] = Depends(get_current_user)):
        res = await db.blog_posts.delete_one({"id": post_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")
        return {"ok": True}

    # ───────── Admin: image upload ─────────
    @router.post("/admin/blog/upload")
    async def admin_upload(file: UploadFile = File(...),
                            user: Dict[str, Any] = Depends(get_current_user)):
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

        # Read into memory with size guard (small images, ≤5MB cap)
        size = 0
        chunks = []
        while True:
            chunk = await file.read(1024 * 64)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="File too large (max 5MB)")
            chunks.append(chunk)
        data = b"".join(chunks)

        # Persist in MongoDB (survives Railway redeploys, unlike local disk)
        media_id = uuid.uuid4().hex
        await db.blog_media.insert_one({
            "id": media_id,
            "content_type": file.content_type,
            "size": size,
            "data": data,
            "created_at": now_utc(),
        })
        return {"url": f"/api/media/{media_id}", "size": size, "filename": file.filename}

    # ───────── Public: serve uploaded image ─────────
    @router.get("/media/{media_id}")
    async def public_media(media_id: str):
        doc = await db.blog_media.find_one({"id": media_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Not found")
        from fastapi import Response
        return Response(
            content=doc["data"],
            media_type=doc.get("content_type", "application/octet-stream"),
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )

    # ───────── Public: list posts for current tenant ─────────
    @router.get("/public/blog")
    async def public_list(
        request: Request,
        tenant: Optional[str] = None,
        limit: int = 20,
        tag: Optional[str] = None,
    ):
        country = await country_from_host(request, tenant)
        # Strict per-country: only return posts bound to THIS country.
        if not (country and country.get("id")):
            return {"posts": []}
        q: Dict[str, Any] = {"status": "published", "country_id": country["id"]}
        if tag:
            q["tags"] = tag
        cursor = db.blog_posts.find(q).sort("published_at", -1).limit(max(1, min(limit, 50)))
        out = [_serialize(d) async for d in cursor]
        return {"posts": out}

    # ───────── Public: single post ─────────
    @router.get("/public/blog/{slug}")
    async def public_get(slug: str, request: Request,
                          tenant: Optional[str] = None,
                          preview: Optional[str] = None):
        country = await country_from_host(request, tenant)
        if not (country and country.get("id")):
            raise HTTPException(status_code=404, detail="Post not found")
        q: Dict[str, Any] = {"slug": slug, "country_id": country["id"]}
        doc = await db.blog_posts.find_one(q)
        if not doc:
            raise HTTPException(status_code=404, detail="Post not found")
        # Only allow draft posts when a matching preview token (= post id) is given.
        if doc.get("status") != "published" and (not preview or preview != doc.get("id")):
            raise HTTPException(status_code=404, detail="Post not found")
        return _serialize(doc)

    return router


async def ensure_blog_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.blog_posts.create_index("id", unique=True)
    await db.blog_posts.create_index([("country_id", 1), ("slug", 1)])
    await db.blog_posts.create_index("status")
    await db.blog_posts.create_index([("published_at", -1)])
    await db.blog_posts.create_index("tags")
