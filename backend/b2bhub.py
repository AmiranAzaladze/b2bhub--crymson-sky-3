"""Mocked B2BHub API client.

When the real B2BHub.ltd API key + docs are provided, replace the body of
`fetch_b2bhub_data` with a real HTTP call. Everything else (caching,
admin override merge logic, refresh endpoint) stays the same.

MOCKED: returned values are deterministic per country code.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict
import os


_MOCK_DATA: Dict[str, Dict[str, Any]] = {
    "GB": {
        "government_fee_minor": 5000,
        "government_fee_display": "£50",
        "avg_filing_time": "24h",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": ["LTD", "PLC", "LLP"],
        "share_capital_min": "£1",
    },
    "UA": {
        "government_fee_minor": 0,
        "government_fee_display": "Free",
        "avg_filing_time": "3 days",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": ["TOV", "FOP", "PrAT"],
        "share_capital_min": "$0",
    },
    "DE": {
        "government_fee_minor": 15000,
        "government_fee_display": "€150",
        "avg_filing_time": "5–10 days",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": ["UG", "GmbH", "AG"],
        "share_capital_min": "€1 (UG) / €25,000 (GmbH)",
    },
    "FR": {
        "government_fee_minor": 3700,
        "government_fee_display": "€37",
        "avg_filing_time": "2–5 days",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": ["SAS", "SARL", "EURL", "SA"],
        "share_capital_min": "€1",
    },
    "US": {
        "government_fee_minor": 9000,
        "government_fee_display": "$90",
        "avg_filing_time": "1–3 days",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": ["LLC", "C-Corp", "S-Corp"],
        "share_capital_min": "$0",
    },
}


async def fetch_b2bhub_data(country_code: str) -> Dict[str, Any]:
    """Return company-formation metadata for a country.

    MOCKED implementation. Replace with a real HTTP request to
    `${B2BHUB_BASE_URL}/v1/countries/{country_code}` using
    `Authorization: Bearer ${B2BHUB_API_KEY}` once credentials are
    provided.
    """
    api_key = os.environ.get("B2BHUB_API_KEY", "")
    # Note: api_key is intentionally unused in mock mode.
    base = _MOCK_DATA.get(country_code.upper(), {
        "government_fee_display": "—",
        "avg_filing_time": "—",
        "min_directors": 1,
        "min_shareholders": 1,
        "foreign_ownership_allowed": True,
        "company_types": [],
        "share_capital_min": "—",
    })
    return {
        **base,
        "source": "b2bhub.ltd",
        "is_mocked": True if not api_key else False,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
