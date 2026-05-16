"""Analytics: event ingest, enrichment, aggregations.

Data shape
==========
events           — one document per tracked event
ip_geo           — cache of {ip -> country/region/city}, ttl ~30d
demo_event_tag   — marker on synthetic events so they can be wiped

Public flow:    POST /api/track  →  insert + schedule async geo enrichment
Admin flow :    GET  /api/admin/analytics/*  →  aggregations
"""
from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import asyncio
import logging
import random
import re
import uuid

import httpx

logger = logging.getLogger("analytics")

# ─── Periods ────────────────────────────────────────────────────────────────
PERIODS = {
    "1h": timedelta(hours=1),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
}


def period_window(period: str) -> Tuple[datetime, datetime, datetime]:
    """Return (since, until, prev_since) for a period code."""
    now = datetime.now(timezone.utc)
    if period == "all":
        return datetime(2000, 1, 1, tzinfo=timezone.utc), now, datetime(2000, 1, 1, tzinfo=timezone.utc)
    delta = PERIODS.get(period, PERIODS["7d"])
    since = now - delta
    prev_since = since - delta
    return since, now, prev_since


def group_bucket(period: str) -> Tuple[str, int]:
    """Return ($dateTrunc unit, count) for the timeseries grouping."""
    if period in ("1h",):
        return "minute", 60
    if period in ("24h",):
        return "hour", 24
    if period in ("7d",):
        return "day", 7
    if period in ("30d",):
        return "day", 30
    if period in ("90d",):
        return "day", 90
    return "day", 30


# ─── User-Agent parsing ─────────────────────────────────────────────────────
try:
    from user_agents import parse as _ua_parse  # type: ignore
except Exception:  # pragma: no cover
    _ua_parse = None


def parse_ua(ua: str) -> Dict[str, str]:
    if not ua:
        return {"device_type": "unknown", "os": "unknown", "browser": "unknown", "browser_version": ""}
    if _ua_parse is not None:
        u = _ua_parse(ua)
        if u.is_mobile:
            dev = "mobile"
        elif u.is_tablet:
            dev = "tablet"
        elif u.is_bot:
            dev = "bot"
        else:
            dev = "desktop"
        return {
            "device_type": dev,
            "os": u.os.family or "unknown",
            "browser": u.browser.family or "unknown",
            "browser_version": (u.browser.version_string or "")[:10],
        }
    # Fallback regex-based
    ua_lower = ua.lower()
    dev = "mobile" if any(x in ua_lower for x in ["mobile", "iphone", "android"]) else "desktop"
    if "tablet" in ua_lower or "ipad" in ua_lower:
        dev = "tablet"
    if "bot" in ua_lower or "spider" in ua_lower:
        dev = "bot"
    os_name = "Unknown"
    for needle, label in [
        ("windows", "Windows"), ("mac os", "Mac OS"), ("linux", "Linux"),
        ("android", "Android"), ("iphone", "iOS"), ("ipad", "iOS"),
    ]:
        if needle in ua_lower:
            os_name = label
            break
    browser = "Unknown"
    for needle, label in [
        ("edg/", "Edge"), ("chrome/", "Chrome"), ("firefox/", "Firefox"),
        ("safari/", "Safari"), ("opera", "Opera"),
    ]:
        if needle in ua_lower:
            browser = label
            break
    return {"device_type": dev, "os": os_name, "browser": browser, "browser_version": ""}


# ─── IP geo ─────────────────────────────────────────────────────────────────
_PRIVATE_IP_PREFIXES = ("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
                        "172.20.", "127.", "169.254.", "0.")


def is_private_ip(ip: str) -> bool:
    if not ip or ip == "unknown" or ip.startswith("::"):
        return True
    return any(ip.startswith(p) for p in _PRIVATE_IP_PREFIXES)


async def enrich_ip(db, ip: str) -> Dict[str, Any]:
    """Look up geo for an IP, caching the result. Returns {country, region, city}."""
    if is_private_ip(ip):
        return {"country": "Unknown", "country_code": "XX", "region": "", "city": "Local"}
    cached = await db.ip_geo.find_one({"ip": ip}, {"_id": 0})
    if cached and cached.get("expires_at"):
        try:
            exp = datetime.fromisoformat(cached["expires_at"])
            if exp > datetime.now(timezone.utc):
                return {
                    "country": cached.get("country", "Unknown"),
                    "country_code": cached.get("country_code", "XX"),
                    "region": cached.get("region", ""),
                    "city": cached.get("city", ""),
                }
        except Exception:
            pass
    try:
        async with httpx.AsyncClient(timeout=3.0) as c:
            r = await c.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,country,countryCode,regionName,city"},
            )
            data = r.json() if r.status_code == 200 else {}
    except Exception as e:
        logger.warning("ip-api lookup failed: %s", e)
        data = {}
    if data.get("status") != "success":
        result = {"country": "Unknown", "country_code": "XX", "region": "", "city": ""}
    else:
        result = {
            "country": data.get("country", "Unknown"),
            "country_code": data.get("countryCode", "XX"),
            "region": data.get("regionName", ""),
            "city": data.get("city", ""),
        }
    await db.ip_geo.update_one(
        {"ip": ip},
        {"$set": {**result, "ip": ip, "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()}},
        upsert=True,
    )
    return result


# ─── Insert events ──────────────────────────────────────────────────────────
def _client_ip(headers: Dict[str, str], fallback: str) -> str:
    xff = headers.get("x-forwarded-for", "") if headers else ""
    if xff:
        return xff.split(",")[0].strip()
    real = (headers or {}).get("x-real-ip", "")
    if real:
        return real.strip()
    return fallback or "unknown"


async def ingest_events(db, batch: List[Dict[str, Any]], headers: Dict[str, str], client_host: str) -> int:
    """Insert a batch of events. Returns count inserted."""
    if not batch:
        return 0
    ip = _client_ip(headers, client_host)
    ua = (headers or {}).get("user-agent", "")
    ua_info = parse_ua(ua)
    now_iso = datetime.now(timezone.utc).isoformat()
    docs: List[Dict[str, Any]] = []
    seen_ip_to_enrich = set()
    for ev in batch:
        if not isinstance(ev, dict):
            continue
        t = (ev.get("type") or "").strip()
        tenant = (ev.get("tenant_slug") or "").strip().lower()
        if not t or not tenant or t == "noop":
            continue
        doc = {
            "id": str(uuid.uuid4()),
            "type": t[:48],
            "tenant_slug": tenant[:32],
            "visitor_id": (ev.get("visitor_id") or "")[:64],
            "session_id": (ev.get("session_id") or "")[:64],
            "path": (ev.get("path") or "")[:200],
            "referrer": (ev.get("referrer") or "")[:300],
            "host": (ev.get("host") or "")[:120],
            "screen": (ev.get("screen") or "")[:20],
            "language": (ev.get("language") or "")[:12],
            "utm_source": (ev.get("utm_source") or "")[:64],
            "utm_medium": (ev.get("utm_medium") or "")[:64],
            "utm_campaign": (ev.get("utm_campaign") or "")[:120],
            "utm_term": (ev.get("utm_term") or "")[:120],
            "utm_content": (ev.get("utm_content") or "")[:120],
            "ip": ip,
            "user_agent": ua[:300],
            "device_type": ua_info["device_type"],
            "os": ua_info["os"],
            "browser": ua_info["browser"],
            "browser_version": ua_info["browser_version"],
            "meta": _clean_meta(ev.get("meta")),
            "ts": now_iso,
        }
        # Apply cached geo if available (fast path)
        docs.append(doc)
        seen_ip_to_enrich.add(ip)
    if not docs:
        return 0
    # First-pass: stamp geo from cache (sync), schedule async enrichment for misses
    if seen_ip_to_enrich:
        cached_map = {}
        async for c in db.ip_geo.find({"ip": {"$in": list(seen_ip_to_enrich)}}, {"_id": 0}):
            cached_map[c["ip"]] = c
        for d in docs:
            cg = cached_map.get(d["ip"])
            if cg:
                d["country"] = cg.get("country", "Unknown")
                d["country_code"] = cg.get("country_code", "XX")
                d["region"] = cg.get("region", "")
                d["city"] = cg.get("city", "")
            elif is_private_ip(d["ip"]):
                d["country"] = "Unknown"
                d["country_code"] = "XX"
                d["region"] = ""
                d["city"] = "Local"
            else:
                d["country"] = "Pending"
                d["country_code"] = "XX"
                d["region"] = ""
                d["city"] = ""
    await db.events.insert_many(docs)
    # Schedule async enrichment for new IPs (don't await)
    missing = [ip for ip in seen_ip_to_enrich if ip not in cached_map and not is_private_ip(ip)]
    if missing:
        asyncio.create_task(_async_enrich(db, missing))
    return len(docs)


async def _async_enrich(db, ips: List[str]) -> None:
    for ip in ips:
        try:
            geo = await enrich_ip(db, ip)
            await db.events.update_many(
                {"ip": ip, "country": "Pending"},
                {"$set": {
                    "country": geo["country"],
                    "country_code": geo["country_code"],
                    "region": geo["region"],
                    "city": geo["city"],
                }},
            )
        except Exception as e:
            logger.warning("enrich failed for %s: %s", ip, e)


def _clean_meta(meta: Any) -> Dict[str, Any]:
    if not isinstance(meta, dict):
        return {}
    out: Dict[str, Any] = {}
    for k, v in list(meta.items())[:20]:
        ks = str(k)[:48]
        if isinstance(v, (str, int, float, bool)) or v is None:
            out[ks] = (v[:200] if isinstance(v, str) else v)
        else:
            out[ks] = str(v)[:200]
    return out


# ─── Aggregations ───────────────────────────────────────────────────────────
def _build_match(tenant: Optional[str], since: datetime, until: datetime,
                 type_in: Optional[List[str]] = None) -> Dict[str, Any]:
    match: Dict[str, Any] = {"ts": {"$gte": since.isoformat(), "$lt": until.isoformat()}}
    if tenant and tenant != "all":
        match["tenant_slug"] = tenant
    if type_in:
        match["type"] = {"$in": type_in}
    return match


async def overview(db, tenant: Optional[str], period: str) -> Dict[str, Any]:
    since, until, prev_since = period_window(period)
    cur_match = _build_match(tenant, since, until)
    prev_match = _build_match(tenant, prev_since, since)

    async def metric_for(match):
        pipeline = [
            {"$match": match},
            {"$group": {
                "_id": None,
                "page_views": {"$sum": {"$cond": [{"$eq": ["$type", "page_view"]}, 1, 0]}},
                "cta_clicks": {"$sum": {"$cond": [{"$eq": ["$type", "click"]}, 1, 0]}},
                "leads": {"$sum": {"$cond": [{"$eq": ["$type", "lead_submit"]}, 1, 0]}},
                "lead_opens": {"$sum": {"$cond": [{"$eq": ["$type", "lead_open"]}, 1, 0]}},
                "name_checks": {"$sum": {"$cond": [{"$eq": ["$type", "name_check"]}, 1, 0]}},
                "visitors_set": {"$addToSet": "$visitor_id"},
                "sessions_set": {"$addToSet": "$session_id"},
            }},
            {"$project": {
                "_id": 0,
                "page_views": 1,
                "cta_clicks": 1,
                "leads": 1,
                "lead_opens": 1,
                "name_checks": 1,
                "visitors": {"$size": "$visitors_set"},
                "sessions": {"$size": "$sessions_set"},
            }},
        ]
        async for d in db.events.aggregate(pipeline):
            return d
        return {"page_views": 0, "cta_clicks": 0, "leads": 0, "lead_opens": 0,
                "name_checks": 0, "visitors": 0, "sessions": 0}

    cur = await metric_for(cur_match)
    prev = await metric_for(prev_match)

    def delta(a: int, b: int) -> Optional[float]:
        if b == 0:
            return None if a == 0 else 100.0
        return round((a - b) / b * 100, 1)

    return {
        "current": cur,
        "previous": prev,
        "delta": {
            "page_views": delta(cur["page_views"], prev["page_views"]),
            "visitors": delta(cur["visitors"], prev["visitors"]),
            "sessions": delta(cur["sessions"], prev["sessions"]),
            "cta_clicks": delta(cur["cta_clicks"], prev["cta_clicks"]),
            "leads": delta(cur["leads"], prev["leads"]),
        },
    }


async def timeseries(db, tenant: Optional[str], period: str, metric: str) -> List[Dict[str, Any]]:
    since, until, _ = period_window(period)
    unit, _ = group_bucket(period)
    match = _build_match(tenant, since, until)
    if metric == "page_views":
        match["type"] = "page_view"
    elif metric == "cta_clicks":
        match["type"] = "click"
    elif metric == "leads":
        match["type"] = "lead_submit"
    pipeline = [
        {"$match": match},
        {"$addFields": {"ts_date": {"$dateFromString": {"dateString": "$ts"}}}},
        {"$group": {
            "_id": {"$dateTrunc": {"date": "$ts_date", "unit": unit}},
            "count": {"$sum": 1},
            "visitors_set": {"$addToSet": "$visitor_id"},
        }},
        {"$project": {
            "_id": 0,
            "bucket": {"$dateToString": {"format": "%Y-%m-%dT%H:%M:%S", "date": "$_id"}},
            "value": "$count" if metric != "visitors" else {"$size": "$visitors_set"},
        }},
        {"$sort": {"bucket": 1}},
    ]
    return [d async for d in db.events.aggregate(pipeline)]


async def breakdown(db, tenant: Optional[str], period: str, dimension: str, limit: int = 12) -> List[Dict[str, Any]]:
    """Group events by a dimension (country, city, device_type, browser, os, referrer, utm_source, path, button)."""
    since, until, _ = period_window(period)
    match = _build_match(tenant, since, until)

    if dimension == "button":
        match["type"] = "click"
        group_field = "$meta.test_id"
    elif dimension == "referrer":
        group_field = {"$cond": [{"$eq": ["$referrer", ""]}, "(direct)", "$referrer"]}
    elif dimension == "utm_source":
        group_field = {"$cond": [{"$eq": ["$utm_source", ""]}, "(none)", "$utm_source"]}
    elif dimension == "path":
        match["type"] = "page_view"
        group_field = "$path"
    elif dimension == "country":
        group_field = "$country"
    elif dimension == "country_code":
        group_field = "$country_code"
    elif dimension == "city":
        group_field = "$city"
    elif dimension == "device_type":
        group_field = "$device_type"
    elif dimension == "browser":
        group_field = "$browser"
    elif dimension == "os":
        group_field = "$os"
    elif dimension == "language":
        group_field = "$language"
    else:
        return []

    pipeline = [
        {"$match": match},
        {"$group": {"_id": group_field, "count": {"$sum": 1},
                    "visitors_set": {"$addToSet": "$visitor_id"}}},
        {"$project": {"_id": 0, "key": "$_id", "count": 1, "visitors": {"$size": "$visitors_set"}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    out = []
    async for d in db.events.aggregate(pipeline):
        if d.get("key") in (None, ""):
            d["key"] = "(unknown)"
        out.append(d)
    return out


async def rankings(db, period: str) -> List[Dict[str, Any]]:
    """Per-tenant rankings for the period: pv, visitors, sessions, clicks, leads, conv rate."""
    since, until, _ = period_window(period)
    match = {"ts": {"$gte": since.isoformat(), "$lt": until.isoformat()}}
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$tenant_slug",
            "page_views": {"$sum": {"$cond": [{"$eq": ["$type", "page_view"]}, 1, 0]}},
            "cta_clicks": {"$sum": {"$cond": [{"$eq": ["$type", "click"]}, 1, 0]}},
            "leads": {"$sum": {"$cond": [{"$eq": ["$type", "lead_submit"]}, 1, 0]}},
            "visitors_set": {"$addToSet": "$visitor_id"},
            "sessions_set": {"$addToSet": "$session_id"},
        }},
        {"$project": {
            "_id": 0,
            "tenant_slug": "$_id",
            "page_views": 1,
            "cta_clicks": 1,
            "leads": 1,
            "visitors": {"$size": "$visitors_set"},
            "sessions": {"$size": "$sessions_set"},
            "ctr": {"$cond": [{"$eq": ["$page_views", 0]}, 0,
                              {"$multiply": [{"$divide": ["$cta_clicks", "$page_views"]}, 100]}]},
            "cvr": {"$cond": [{"$eq": ["$page_views", 0]}, 0,
                              {"$multiply": [{"$divide": ["$leads", "$page_views"]}, 100]}]},
        }},
        {"$sort": {"page_views": -1}},
    ]
    return [d async for d in db.events.aggregate(pipeline)]


async def funnel(db, tenant: Optional[str], period: str) -> List[Dict[str, Any]]:
    since, until, _ = period_window(period)
    match = _build_match(tenant, since, until)
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": None,
            "page_view": {"$sum": {"$cond": [{"$eq": ["$type", "page_view"]}, 1, 0]}},
            "click": {"$sum": {"$cond": [{"$eq": ["$type", "click"]}, 1, 0]}},
            "lead_open": {"$sum": {"$cond": [{"$eq": ["$type", "lead_open"]}, 1, 0]}},
            "lead_submit": {"$sum": {"$cond": [{"$eq": ["$type", "lead_submit"]}, 1, 0]}},
        }},
    ]
    row = {"page_view": 0, "click": 0, "lead_open": 0, "lead_submit": 0}
    async for d in db.events.aggregate(pipeline):
        row = d
    steps = [
        ("Page view", row.get("page_view", 0)),
        ("CTA click", row.get("click", 0)),
        ("Form open", row.get("lead_open", 0)),
        ("Form submit", row.get("lead_submit", 0)),
    ]
    top = max(1, steps[0][1])
    return [{"label": l, "value": v, "pct": round(v / top * 100, 1)} for l, v in steps]


async def recent_events(db, tenant: Optional[str], limit: int = 100) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if tenant and tenant != "all":
        query["tenant_slug"] = tenant
    cur = db.events.find(query, {"_id": 0}).sort("ts", -1).limit(limit)
    return [d async for d in cur]


# ─── Demo seeding ───────────────────────────────────────────────────────────
DEMO_COUNTRIES = [
    {"country": "United Kingdom", "country_code": "GB", "city": "London"},
    {"country": "Germany", "country_code": "DE", "city": "Berlin"},
    {"country": "France", "country_code": "FR", "city": "Paris"},
    {"country": "United States", "country_code": "US", "city": "New York"},
    {"country": "United States", "country_code": "US", "city": "San Francisco"},
    {"country": "Ukraine", "country_code": "UA", "city": "Kyiv"},
    {"country": "Spain", "country_code": "ES", "city": "Madrid"},
    {"country": "Netherlands", "country_code": "NL", "city": "Amsterdam"},
    {"country": "Italy", "country_code": "IT", "city": "Milan"},
    {"country": "Canada", "country_code": "CA", "city": "Toronto"},
    {"country": "India", "country_code": "IN", "city": "Bangalore"},
    {"country": "Australia", "country_code": "AU", "city": "Sydney"},
]
DEMO_BROWSERS = [("Chrome", "desktop", "Windows"), ("Chrome", "mobile", "Android"),
                 ("Safari", "desktop", "Mac OS"), ("Safari", "mobile", "iOS"),
                 ("Firefox", "desktop", "Windows"), ("Edge", "desktop", "Windows")]
DEMO_REFERRERS = ["", "https://google.com/", "https://twitter.com/", "https://producthunt.com/",
                  "https://reddit.com/r/startups", "https://linkedin.com/", ""]
DEMO_UTM = [("", "", ""), ("google", "cpc", "uk-formation"), ("twitter", "social", "launch"),
            ("newsletter", "email", "weekly"), ("producthunt", "referral", "launch")]
DEMO_BUTTONS = ["hero-primary-cta", "header-cta-button", "pricing-cta-essential",
                "pricing-cta-privacy", "pricing-cta-all-inclusive", "final-cta-button",
                "name-checker-submit"]


async def seed_demo_events(db, tenants: List[str], n_days: int = 30) -> int:
    """Generate ~n_days * traffic synthetic events. Idempotent: clears prior demo data first."""
    await db.events.delete_many({"is_demo": True})
    weights = {"uk": 0.45, "us": 0.20, "de": 0.13, "fr": 0.10, "ua": 0.08}
    total_visitors = max(400, n_days * 60)
    now = datetime.now(timezone.utc)
    docs: List[Dict[str, Any]] = []
    for i in range(total_visitors):
        tenant = random.choices(tenants, weights=[weights.get(t, 0.05) for t in tenants], k=1)[0]
        geo = random.choice(DEMO_COUNTRIES)
        browser, dev, os_name = random.choice(DEMO_BROWSERS)
        ref = random.choice(DEMO_REFERRERS)
        utm_s, utm_m, utm_c = random.choice(DEMO_UTM)
        visitor_id = f"demo-{uuid.uuid4().hex[:12]}"
        session_id = f"sess-{uuid.uuid4().hex[:12]}"
        # Distribute timestamps with bias toward recent
        days_ago = random.choices(range(n_days), weights=[(n_days - d) ** 1.4 for d in range(n_days)], k=1)[0]
        ts = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        ip = f"203.0.{random.randint(1, 200)}.{random.randint(1, 200)}"
        base = {
            "tenant_slug": tenant, "visitor_id": visitor_id, "session_id": session_id,
            "path": "/", "host": "", "referrer": ref,
            "screen": random.choice(["1920x1080", "1366x768", "390x844", "375x667"]),
            "language": random.choice(["en-GB", "en-US", "de-DE", "fr-FR", "uk-UA"]),
            "utm_source": utm_s, "utm_medium": utm_m, "utm_campaign": utm_c,
            "utm_term": "", "utm_content": "",
            "ip": ip, "user_agent": f"demo/{browser}",
            "device_type": dev, "os": os_name, "browser": browser, "browser_version": "",
            "country": geo["country"], "country_code": geo["country_code"],
            "region": "", "city": geo["city"],
            "is_demo": True,
        }
        # Funnel realism: 100% pv → 35% click → 12% lead_open → 4% lead_submit
        docs.append({**base, "id": str(uuid.uuid4()), "type": "page_view", "ts": ts.isoformat(), "meta": {}})
        if random.random() < 0.35:
            btn = random.choice(DEMO_BUTTONS)
            docs.append({**base, "id": str(uuid.uuid4()), "type": "click",
                         "ts": (ts + timedelta(seconds=random.randint(8, 90))).isoformat(),
                         "meta": {"test_id": btn}})
            if "cta" in btn or "name-checker" not in btn:
                if random.random() < 0.34:
                    docs.append({**base, "id": str(uuid.uuid4()), "type": "lead_open",
                                 "ts": (ts + timedelta(seconds=random.randint(20, 130))).isoformat(),
                                 "meta": {"test_id": btn}})
                    if random.random() < 0.33:
                        docs.append({**base, "id": str(uuid.uuid4()), "type": "lead_submit",
                                     "ts": (ts + timedelta(seconds=random.randint(35, 200))).isoformat(),
                                     "meta": {}})
    if docs:
        # Insert in chunks of 1000
        for i in range(0, len(docs), 1000):
            await db.events.insert_many(docs[i:i + 1000])
    return len(docs)
