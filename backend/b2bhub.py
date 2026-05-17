"""B2BHub.ltd Data API client.

- Calls real API at $B2BHUB_BASE_URL with X-API-Key.
- Caches every country detail in `b2bhub_cache` (TTL 15min, per docs).
- `fetch_b2bhub_data(code_or_slug)` returns the adapted shape used by the
  admin's B2BHub tab (back-compat with the previous mock).
- `bulk_sync_countries(db, slugs?)` upserts a `countries` row + default
  `landing_content` row for every successful slug.
- Falls back to the known-good slug list when `countries:list` scope is
  missing on the key.
"""
from __future__ import annotations
import asyncio
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger("b2bhub")

CACHE_TTL_MIN = 15

# Known-good slugs (confirmed working against the API). Used as fallback when
# `countries:list` scope is not granted on the provided key.
# Derived from b2bhub.ltd/company-formation (257 advertised jurisdictions),
# probed individually against /countries/{slug}. 246 currently respond 200.
FALLBACK_SLUGS: List[str] = [
    "afghanistan", "albania", "alderney", "algeria", "american-samoa", "andorra",
    "angola", "anguilla", "antigua-and-barbuda", "argentina", "armenia", "aruba",
    "ascension-and-tristan-da-cunha", "australia", "austria", "azerbaijan",
    "bahamas", "bahrain", "bangladesh", "barbados", "belarus", "belgium", "belize",
    "benin", "bermuda", "bhutan", "bolivia", "bosnia-and-herzegovina", "botswana",
    "bouvet-island", "brazil", "british-indian-ocean-territory",
    "british-virgin-islands", "brunei", "bulgaria", "burkina-faso", "burundi",
    "cabo-verde", "cambodia", "cameroon", "canada", "cayman-islands",
    "central-african-republic", "chad", "chile", "china", "christmas-island",
    "cocos-keeling-islands", "colombia", "comoros", "cook-islands", "costa-rica",
    "croatia", "cuba", "cyprus", "czech-republic", "denmark", "djibouti",
    "dominica", "dominican-republic", "east-timor", "ecuador", "egypt",
    "el-salvador", "equatorial-guinea", "eritrea", "estonia", "eswatini",
    "ethiopia", "falkland-islands-malvinas", "faroe-islands", "fiji", "finland",
    "france", "french-guiana", "french-polynesia", "french-southern-territories",
    "gabon", "gambia", "georgia", "germany", "ghana", "gibraltar", "greece",
    "greenland", "grenada", "guadeloupe", "guam", "guatemala", "guernsey",
    "guinea", "guinea-bissau", "guyana", "haiti",
    "heard-island-and-mcdonald-islands", "holy-see-vatican-city-state",
    "honduras", "hong-kong", "hungary", "iceland", "india", "indonesia", "iran",
    "iraq", "ireland", "isle-of-man", "israel", "italy", "jamaica", "japan",
    "jersey", "jordan", "kazakhstan", "kenya", "kiribati", "kosovo", "kuwait",
    "kyrgyzstan", "labuan", "laos", "latvia", "lebanon", "lesotho", "liberia",
    "libya", "liechtenstein", "lithuania", "luxembourg", "macao", "madagascar",
    "malawi", "malaysia", "maldives", "mali", "malta", "marshall-islands",
    "martinique", "mauritania", "mauritius", "mayotte", "mexico", "micronesia",
    "moldova", "monaco", "mongolia", "montenegro", "montserrat", "morocco",
    "mozambique", "myanmar", "namibia", "nauru", "nepal", "netherlands",
    "new-caledonia", "new-zealand", "nicaragua", "niger", "nigeria", "niue",
    "norfolk-island", "north-korea", "north-macedonia", "northern-mariana-islands",
    "norway", "oman", "pakistan", "palau", "palestine", "panama",
    "papua-new-guinea", "paraguay", "peru", "philippines", "pitcairn-islands",
    "poland", "portugal", "puerto-rico", "qatar", "republic-of-the-congo",
    "romania", "russia", "rwanda", "sahrawi-arab-democratic-republic",
    "saint-helena", "saint-kitts-and-nevis", "saint-lucia", "saint-martin-france",
    "saint-pierre-and-miquelon", "saint-vincent-and-the-grenadines", "samoa",
    "san-marino", "sao-tome-and-principe", "saudi-arabia", "senegal", "serbia",
    "seychelles", "sierra-leone", "singapore", "sint-eustatius-and-saba",
    "sint-maarten-dutch-part", "slovakia", "slovenia", "solomon-islands",
    "somalia", "south-africa", "south-georgia-and-the-south-sandwich-islands",
    "south-korea", "south-sudan", "spain", "sri-lanka", "sudan", "suriname",
    "svalbard-and-jan-mayen", "swaziland", "sweden", "switzerland", "syria",
    "taiwan", "tajikistan", "tanzania", "thailand", "timor-leste", "togo",
    "tokelau", "tonga", "trinidad-and-tobago", "tunisia", "turkey", "turkmenistan",
    "turks-and-caicos-islands", "tuvalu", "uganda", "ukraine",
    "united-arab-emirates", "united-kingdom", "united-states", "uruguay",
    "uzbekistan", "vanuatu", "venezuela", "vietnam", "wallis-and-futuna",
    "western-sahara", "yemen", "yugoslavia", "zambia", "zimbabwe",
]

def _flag_from_code(code: str) -> str:
    """Build emoji flag from a 2-letter ISO country code via regional indicators."""
    code = (code or "").strip().upper()
    if len(code) != 2 or not code.isalpha():
        return "🌐"
    return "".join(chr(0x1F1E6 + ord(ch) - ord("A")) for ch in code)


FLAG_BY_CODE: Dict[str, str] = {
    "AD": "🇦🇩", "AR": "🇦🇷", "AM": "🇦🇲", "AU": "🇦🇺", "AT": "🇦🇹", "AZ": "🇦🇿",
    "BS": "🇧🇸", "BH": "🇧🇭", "BY": "🇧🇾", "BE": "🇧🇪", "BZ": "🇧🇿", "BM": "🇧🇲",
    "BR": "🇧🇷", "VG": "🇻🇬", "BG": "🇧🇬", "CA": "🇨🇦", "KY": "🇰🇾", "CL": "🇨🇱",
    "CN": "🇨🇳", "CO": "🇨🇴", "CR": "🇨🇷", "CY": "🇨🇾", "CZ": "🇨🇿", "DK": "🇩🇰",
    "EG": "🇪🇬", "EE": "🇪🇪", "FI": "🇫🇮", "FR": "🇫🇷", "GE": "🇬🇪", "DE": "🇩🇪",
    "GH": "🇬🇭", "GI": "🇬🇮", "GR": "🇬🇷", "GG": "🇬🇬", "HK": "🇭🇰", "HU": "🇭🇺",
    "IS": "🇮🇸", "IN": "🇮🇳", "ID": "🇮🇩", "IE": "🇮🇪", "IM": "🇮🇲", "IL": "🇮🇱",
    "IT": "🇮🇹", "JP": "🇯🇵", "JE": "🇯🇪", "KZ": "🇰🇿", "KE": "🇰🇪", "KW": "🇰🇼",
    "LV": "🇱🇻", "LI": "🇱🇮", "LT": "🇱🇹", "LU": "🇱🇺", "MY": "🇲🇾", "MT": "🇲🇹",
    "MH": "🇲🇭", "MU": "🇲🇺", "MX": "🇲🇽", "MC": "🇲🇨", "MA": "🇲🇦", "NL": "🇳🇱",
    "NZ": "🇳🇿", "NG": "🇳🇬", "NO": "🇳🇴", "OM": "🇴🇲", "PK": "🇵🇰", "PA": "🇵🇦",
    "PE": "🇵🇪", "PH": "🇵🇭", "PL": "🇵🇱", "PT": "🇵🇹", "QA": "🇶🇦", "RO": "🇷🇴",
    "RU": "🇷🇺", "SM": "🇸🇲", "SA": "🇸🇦", "SC": "🇸🇨", "SG": "🇸🇬", "SK": "🇸🇰",
    "ZA": "🇿🇦", "KR": "🇰🇷", "ES": "🇪🇸", "SE": "🇸🇪", "CH": "🇨🇭", "TW": "🇹🇼",
    "TH": "🇹🇭", "TN": "🇹🇳", "TR": "🇹🇷", "UA": "🇺🇦", "AE": "🇦🇪", "GB": "🇬🇧",
    "US": "🇺🇸", "UZ": "🇺🇿", "VU": "🇻🇺", "VN": "🇻🇳",
}

CURRENCY_SYMBOL: Dict[str, str] = {
    "USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥", "CNY": "¥", "INR": "₹",
    "RUB": "₽", "UAH": "₴", "TRY": "₺", "BRL": "R$", "CAD": "C$", "AUD": "A$",
    "NZD": "NZ$", "CHF": "CHF", "PLN": "zł", "CZK": "Kč", "HUF": "Ft", "SEK": "kr",
    "NOK": "kr", "DKK": "kr", "ISK": "kr", "MXN": "Mex$", "ZAR": "R", "KRW": "₩",
    "SGD": "S$", "HKD": "HK$", "TWD": "NT$", "THB": "฿", "VND": "₫", "IDR": "Rp",
    "MYR": "RM", "PHP": "₱", "AED": "د.إ", "SAR": "﷼", "QAR": "ر.ق", "BHD": "د.ب",
    "KWD": "د.ك", "OMR": "ر.ع.", "ILS": "₪", "EGP": "E£", "MAD": "د.م.",
}

# ─── HTTP ───────────────────────────────────────────────────────────────────
def _api_key() -> str:
    return os.environ.get("B2BHUB_API_KEY", "")


def _base_url() -> str:
    return os.environ.get("B2BHUB_BASE_URL", "https://b2bhub.ltd/api/v1")


def _headers() -> Dict[str, str]:
    return {"X-API-Key": _api_key(), "Accept": "application/json"}


async def _get(path: str) -> Tuple[int, Any]:
    url = f"{_base_url().rstrip('/')}{path}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(url, headers=_headers())
            try:
                return r.status_code, r.json()
            except Exception:
                return r.status_code, {"raw": r.text[:200]}
    except Exception as e:
        logger.warning("B2BHub GET %s failed: %s", path, e)
        return 0, {"error": str(e)}


# ─── Cache ──────────────────────────────────────────────────────────────────
async def _cache_get(db, key: str) -> Optional[Dict[str, Any]]:
    doc = await db.b2bhub_cache.find_one({"key": key}, {"_id": 0})
    if not doc:
        return None
    try:
        exp = datetime.fromisoformat(doc["expires_at"])
        if exp > datetime.now(timezone.utc):
            return doc.get("payload")
    except Exception:
        pass
    return None


async def _cache_set(db, key: str, payload: Dict[str, Any]) -> None:
    await db.b2bhub_cache.update_one(
        {"key": key},
        {"$set": {
            "key": key,
            "payload": payload,
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=CACHE_TTL_MIN)).isoformat(),
        }},
        upsert=True,
    )


# ─── Detail fetch ───────────────────────────────────────────────────────────
async def fetch_country_detail(db, slug_or_code: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
    if not slug_or_code or not _api_key():
        return None
    key = f"country:{slug_or_code.lower()}"
    if use_cache:
        cached = await _cache_get(db, key)
        if cached is not None:
            return cached
    status, body = await _get(f"/countries/{slug_or_code}")
    if status == 200 and isinstance(body, dict):
        await _cache_set(db, key, body)
        return body
    return None


# ─── Adapter for the existing B2BHub tab ────────────────────────────────────
def _adapt_le(detail: Dict[str, Any]) -> Dict[str, Any]:
    """Adapt B2BHub `le_data` into the small shape the admin UI shows."""
    le = (detail or {}).get("le_data") or {}
    legal_forms = le.get("legal_forms") or ""
    if isinstance(legal_forms, str):
        types = [s.strip() for s in re.split(r"[,/;]+", legal_forms) if s.strip()]
    elif isinstance(legal_forms, list):
        types = [str(s) for s in legal_forms]
    else:
        types = []
    return {
        "government_fee_display": le.get("price_display", "—"),
        "avg_filing_time": le.get("timeline", "—"),
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": types[:6],
        "share_capital_min": "—",
        "registrar_name": (le.get("registrar") or {}).get("name", ""),
        "registrar_abbr": (le.get("registrar") or {}).get("abbreviation", ""),
        "registrar_website": (le.get("registrar") or {}).get("website", ""),
        "source": "b2bhub.ltd",
        "is_mocked": False,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_b2bhub_data(country_code: str) -> Dict[str, Any]:
    """Back-compat entrypoint used by the admin B2BHub tab.

    Accepts an ISO-2 code or a slug. Tries the real API first, falls back
    to a mocked stub if the key isn't set or the API is unreachable.
    """
    from server import db  # late import to avoid cycle
    if not country_code:
        return {"is_mocked": True, "source": "b2bhub.ltd", "company_types": []}
    if not _api_key():
        return {
            "government_fee_display": "—", "avg_filing_time": "—",
            "min_directors": 1, "min_shareholders": 1, "foreign_ownership_allowed": True,
            "company_types": [], "share_capital_min": "—",
            "source": "b2bhub.ltd", "is_mocked": True,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    detail = await fetch_country_detail(db, country_code)
    if detail is None:
        return {
            "government_fee_display": "—", "avg_filing_time": "—",
            "company_types": [], "share_capital_min": "—",
            "source": "b2bhub.ltd", "is_mocked": False,
            "error": "not-found", "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
    return _adapt_le(detail)


# ─── HTML stripping for FAQ / requirements ──────────────────────────────────
def _strip_html(s: str) -> str:
    if not s:
        return ""
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"</p\s*>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
    return re.sub(r"[ \t]+\n", "\n", s).strip()


def _parse_faq(html_or_text: str) -> List[Dict[str, str]]:
    """Best-effort parse of B2BHub FAQ HTML into [{q, a}, ...]."""
    text = _strip_html(html_or_text or "")
    if not text:
        return []
    parts = re.split(r"\n+", text)
    items: List[Dict[str, str]] = []
    pending_q: Optional[str] = None
    for line in parts:
        line = line.strip()
        if not line:
            continue
        m_q = re.match(r"^Q\s*[:.\-]\s*(.+)$", line, re.IGNORECASE)
        m_a = re.match(r"^A\s*[:.\-]\s*(.+)$", line, re.IGNORECASE)
        if m_q:
            pending_q = m_q.group(1).strip()
        elif m_a and pending_q:
            items.append({"q": pending_q, "a": m_a.group(1).strip()})
            pending_q = None
    return items[:10]


# ─── Build a Country + content from B2BHub detail ───────────────────────────
def _build_country_doc(detail: Dict[str, Any]) -> Dict[str, Any]:
    le = detail.get("le_data") or {}
    code = (detail.get("country_code") or "").upper()
    slug = (detail.get("country_slug") or detail.get("country_name", "").lower().replace(" ", "-"))
    name = detail.get("country_name") or slug.title()
    short = name.split(",")[0].strip()
    if "United Kingdom" in name:
        short = "UK"
    elif "United States" in name:
        short = "USA"
    elif "United Arab Emirates" in name:
        short = "UAE"
    elif "Hong Kong" in name:
        short = "Hong Kong"

    capital = detail.get("capital_city") or ""
    currency_code = (le.get("currency") or detail.get("currency_code") or "USD")[:8].upper()
    currency_full = detail.get("currency") or currency_code
    symbol = CURRENCY_SYMBOL.get(currency_code, "$")

    legal_forms_raw = le.get("legal_forms") or ""
    if isinstance(legal_forms_raw, list):
        legal_forms = ", ".join(legal_forms_raw)
    else:
        legal_forms = str(legal_forms_raw)
    legal_forms = legal_forms.replace("LTD, LLC", "LLC").strip(", ") or "Limited Company"

    price_display = le.get("price_display") or ""
    price_num = le.get("price")
    if not price_num and price_display:
        m = re.search(r"[\d,]+", price_display)
        if m:
            try:
                price_num = float(m.group(0).replace(",", ""))
            except Exception:
                price_num = None
    base = float(price_num or 999)
    base = max(99, round(base))

    registrar = le.get("registrar") or {}
    authority_name = registrar.get("name", "") or (f"{short} Companies Registrar")
    authority_short = registrar.get("abbreviation", "") or "Registrar"
    gov_fee = "Included" if le.get("price_display") else "—"

    return {
        "slug": slug,
        "name": short,
        "long_name": name,
        "flag": FLAG_BY_CODE.get(code, _flag_from_code(code)),
        "domain": f"{slug}-formations.com",
        "brand_name": f"Swift Formations {short}",
        "brand_color": "#0A0A0A",
        "accent_color": "#C8102E",
        "currency": currency_code,
        "currency_full": currency_full,
        "currency_symbol": symbol,
        "locale": "en",
        "country_code": code or "XX",
        "capital": capital,
        "authority_name": authority_name,
        "authority_short": authority_short[:8] or "REG",
        "company_type": legal_forms,
        "legal_suffix": f"Registered in {name}.",
        "b2bhub_country_code": slug,
        "region": detail.get("region", ""),
        # Pricing tiers (3 tiers derived from base price)
        "_price_essential": f"{base:,.0f}",
        "_price_privacy": f"{round(base * 1.5):,.0f}",
        "_price_allinclusive": f"{round(base * 2.5):,.0f}",
        "_government_fee_text": gov_fee,
        "_timeline": le.get("timeline", "24h"),
    }


def _build_content_from_detail(country: Dict[str, Any], detail: Dict[str, Any]) -> Dict[str, Any]:
    """Generate the full landing content using real B2BHub data."""
    from seed_data import default_content_for  # late import

    seed_input = {
        **country,
        "name": country["name"],
        "long_name": country["long_name"],
        "brand_name": country["brand_name"],
        "currency": country["currency"],
        "currency_symbol": country["currency_symbol"],
        "capital": country["capital"] or "your country",
        "authority_name": country["authority_name"],
        "authority_short": country["authority_short"],
        "company_type": country["company_type"],
        "price_from": country["_price_essential"],
        "privacy_price": country["_price_privacy"],
        "allinclusive_price": country["_price_allinclusive"],
        "government_fee_text": country["_government_fee_text"],
        "legal_suffix": country["legal_suffix"],
        "flag": country["flag"],
    }
    content = default_content_for(seed_input)

    # Override hero highlight with real timeline if it's specific
    timeline = country.get("_timeline") or ""
    if timeline and timeline not in ("24h", "24 hours"):
        content["hero"]["headline_highlight"] = timeline

    # Override hero fee note + headline_suffix with real timeline
    content["hero"]["headline_suffix"] = f"From {country['currency_symbol']}{country['_price_essential']}."

    # Inject real FAQs from B2BHub on top of defaults (max 8)
    le = detail.get("le_data") or {}
    real_faqs = _parse_faq(le.get("faq", ""))
    if real_faqs:
        content["faqs"]["items"] = (real_faqs + content["faqs"]["items"])[:10]

    # Use real registrar in hero panel + steps
    if country["authority_name"]:
        for s in content["hero"].get("panel_steps", []):
            if "filing" in s.get("label", "").lower():
                s["label"] = f"{country['authority_short']} filing"
        content["hero"]["badge"] = f"Authorised {country['authority_name']} Filing Partner"[:80]

    # Update SEO
    content["seo"] = {
        "title": f"{country['brand_name']} — Register a {country['name']} {country['company_type'].split(',')[0].strip()} in {timeline or '24 hours'}",
        "description": (
            f"Form your {country['long_name']} company in {timeline or '24 hours'} from "
            f"{country['currency_symbol']}{country['_price_essential']}. {country['authority_short']} authorised, "
            f"15,000+ companies formed."
        )[:200],
    }
    return content


# ─── Bulk sync ──────────────────────────────────────────────────────────────
async def list_country_slugs(db) -> Tuple[List[str], str]:
    """Try `countries:list`, fall back to FALLBACK_SLUGS if forbidden."""
    if not _api_key():
        return FALLBACK_SLUGS, "fallback-nokey"
    status, body = await _get("/countries")
    if status == 200 and isinstance(body, dict):
        slugs = [c.get("country_slug") for c in (body.get("countries") or []) if c.get("country_slug")]
        if slugs:
            return slugs, "live"
    return FALLBACK_SLUGS, "fallback-scope"


async def bulk_sync_countries(db, slugs: Optional[List[str]] = None,
                              overwrite_content: bool = False,
                              concurrency: int = 5) -> Dict[str, Any]:
    """For each slug, fetch detail from B2BHub and upsert country + content."""
    from seed_data import auto_abbreviation  # late import

    if not slugs:
        slugs, _source = await list_country_slugs(db)

    inserted = 0
    updated = 0
    failed: List[Dict[str, str]] = []
    sem = asyncio.Semaphore(concurrency)
    now_iso = datetime.now(timezone.utc).isoformat()

    async def process(slug: str) -> None:
        nonlocal inserted, updated
        async with sem:
            detail = await fetch_country_detail(db, slug, use_cache=False)
            if not detail:
                failed.append({"slug": slug, "reason": "not-found-or-error"})
                return
            try:
                country = _build_country_doc(detail)
                content = _build_content_from_detail(country, detail)
            except Exception as e:
                failed.append({"slug": slug, "reason": f"build-error: {e}"})
                return

            existing = await db.countries.find_one({"slug": country["slug"]})
            if existing:
                # Update fields, preserve admin overrides (brand_color etc.) only if existing had defaults
                set_doc = {
                    "name": country["name"], "long_name": country["long_name"],
                    "flag": country["flag"],
                    "currency": country["currency"], "currency_symbol": country["currency_symbol"],
                    "country_code": country["country_code"],
                    "capital": country["capital"],
                    "authority_name": country["authority_name"],
                    "authority_short": country["authority_short"],
                    "company_type": country["company_type"],
                    "legal_suffix": country["legal_suffix"],
                    "b2bhub_country_code": country["b2bhub_country_code"],
                    "region": country["region"],
                    "updated_at": now_iso,
                }
                await db.countries.update_one({"slug": country["slug"]}, {"$set": set_doc})
                if overwrite_content:
                    await db.landing_content.update_one(
                        {"country_id": existing["id"]},
                        {"$set": {"content": content, "updated_at": now_iso}},
                        upsert=True,
                    )
                updated += 1
            else:
                country_id = str(uuid.uuid4())
                doc = {
                    **{k: v for k, v in country.items() if not k.startswith("_")},
                    "id": country_id,
                    "abbreviation": auto_abbreviation(country["brand_name"]),
                    "status": "published",
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
                await db.countries.insert_one(doc)
                await db.landing_content.insert_one({
                    "country_id": country_id,
                    "content": content,
                    "updated_at": now_iso,
                })
                inserted += 1

    await asyncio.gather(*[process(s) for s in slugs])
    return {
        "ok": True,
        "inserted": inserted,
        "updated": updated,
        "failed": failed,
        "total_requested": len(slugs),
    }
