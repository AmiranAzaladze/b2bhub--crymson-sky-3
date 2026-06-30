"""B2B Hub CRM client.

Two public-facing flows for the multi-tenant landing pages:

1. ``submit_inquiry`` — POSTs an anonymous lead to ``/api/contact/submit``
   (no auth required). Used by every "Start now" CTA.

2. ``book_advisor`` — POSTs an advisor video-meeting booking to
   ``/api/video-meetings/advisor-booking`` using the service Bearer token
   stored in ``HUB_CRM_API_TOKEN``. Used by the new "Advisor" header button.
"""
from __future__ import annotations

import os
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("swift.hubcrm")

BASE_URL = os.environ.get("HUB_CRM_BASE_URL", "https://b2bhub.ltd/api").rstrip("/")
SERVICE_TOKEN = os.environ.get("HUB_CRM_API_TOKEN", "")
TIMEOUT = httpx.Timeout(15.0, connect=8.0)


async def submit_inquiry(
    *,
    name: str,
    email: str,
    phone: Optional[str] = None,
    company: Optional[str] = None,
    message: Optional[str] = None,
    tenant_slug: Optional[str] = None,
    tenant_brand: Optional[str] = None,
    tenant_domain: Optional[str] = None,
) -> Dict[str, Any]:
    """Send a public landing-page inquiry to Hub CRM's contact inbox.

    Endpoint: ``POST {HUB_CRM_BASE_URL}/contact/submit`` — no auth required.
    """
    url = f"{BASE_URL}/contact/submit"
    subject = f"New lead from {tenant_brand or tenant_slug or 'Swift Formations'}"
    body_lines = [
        message.strip() if message else "Website inquiry — please follow up.",
        "",
        "──────────────",
        f"Source: {tenant_brand or tenant_slug or 'landing'}",
    ]
    if tenant_domain:
        body_lines.append(f"Domain: https://{tenant_domain}/")
    if phone:
        body_lines.append(f"Phone: {phone}")
    if company:
        body_lines.append(f"Company: {company}")
    payload = {
        "name": name,
        "email": email,
        "category": "company-formation",
        "subject": subject,
        "message": "\n".join(body_lines),
        "priority": "normal",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        return r.json()


async def book_advisor(
    *,
    name: str,
    email: str,
    phone: Optional[str] = None,
    preferred_at: str,
    duration_minutes: int = 30,
    note: Optional[str] = None,
    tenant_slug: Optional[str] = None,
    tenant_brand: Optional[str] = None,
) -> Dict[str, Any]:
    """Book a video meeting with B2B Hub advisor Anna.

    Tries the real ``/video-meetings/advisor-booking`` endpoint first (which
    requires a USER-level JWT). If the service token isn't accepted (401/403),
    falls back to ``/contact/submit`` with ``category="advisor-meeting"`` so the
    booking still reaches the CRM inbox and the advisor team can confirm
    manually with a forum meeting link.

    Returns the upstream response. On fallback, the response dict contains
    ``fallback=True`` and ``ticket_id`` instead of ``meeting_link``.
    """
    pretty_when = preferred_at.replace("T", " ").replace("Z", " UTC")
    visitor_note_lines = []
    if note:
        visitor_note_lines.append(note.strip())
        visitor_note_lines.append("")
    visitor_note_lines.append(f"Visitor: {name} · {email}" + (f" · {phone}" if phone else ""))
    visitor_note_lines.append(f"Source: {tenant_brand or tenant_slug or 'Swift Formations landing'}")

    if SERVICE_TOKEN:
        try:
            url = f"{BASE_URL}/video-meetings/advisor-booking"
            payload = {
                "preferred_at": preferred_at,
                "duration_minutes": duration_minutes,
                "note": "\n".join(visitor_note_lines),
            }
            headers = {
                "Authorization": f"Bearer {SERVICE_TOKEN}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                r = await client.post(url, json=payload, headers=headers)
                if r.status_code in (401, 403):
                    logger.info(
                        "Advisor-booking returned %s — falling back to /contact/submit (service "
                        "token isn't user-scoped). Provide a user JWT in HUB_CRM_API_TOKEN to "
                        "enable native forum meeting links.", r.status_code,
                    )
                else:
                    r.raise_for_status()
                    return r.json()
        except httpx.HTTPStatusError:
            raise
        except Exception as e:
            logger.warning("Advisor-booking native call errored, falling back: %s", e)

    # Fallback: submit as a contact inquiry tagged advisor-meeting.
    fallback_body = [
        f"Preferred slot: {pretty_when}",
        f"Duration: {duration_minutes} min",
        "",
        *visitor_note_lines,
    ]
    fallback_payload = {
        "name": name,
        "email": email,
        "category": "advisor-meeting",
        "subject": f"Advisor call booking — {tenant_brand or tenant_slug or 'Swift Formations'}",
        "message": "\n".join(fallback_body),
        "priority": "high",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(f"{BASE_URL}/contact/submit", json=fallback_payload)
        r.raise_for_status()
        data = r.json()
        return {"fallback": True, "ticket_id": data.get("ticket_id"), "raw": data}
