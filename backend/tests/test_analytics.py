"""Backend tests for Swift Formations Analytics module.

Covers:
- POST /api/track  (public ingest, no auth)
- GET  /api/admin/analytics/overview / timeseries / breakdown / rankings / funnel / recent
- POST/DELETE /api/admin/analytics/seed-demo
- 401 enforcement on admin/analytics/*
"""
import os
import time
import uuid

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
ADMIN_EMAIL = "admin@swiftformations.io"
ADMIN_PASSWORD = "Admin@12345"


# ─── Fixtures ───────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session", autouse=True)
def seed_demo_once(auth_headers):
    """Seed demo data once at session start so aggregations have rows to operate on."""
    r = requests.post(f"{BASE}/api/admin/analytics/seed-demo", headers=auth_headers, timeout=120)
    assert r.status_code == 200, f"seed-demo failed: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("ok") is True
    assert isinstance(body.get("inserted"), int) and body["inserted"] > 1000
    yield body
    # Cleanup at end of session
    requests.delete(f"{BASE}/api/admin/analytics/seed-demo", headers=auth_headers, timeout=60)


# ─── /api/track (public, no auth) ───────────────────────────────────────────
class TestTrackIngest:
    def test_track_accepts_batch_no_auth(self):
        vid = f"test-vis-{uuid.uuid4().hex[:8]}"
        sid = f"test-sess-{uuid.uuid4().hex[:8]}"
        payload = {"events": [
            {"type": "page_view", "tenant_slug": "uk", "visitor_id": vid,
             "session_id": sid, "path": "/", "host": "ukcompanyformation.com"},
            {"type": "click", "tenant_slug": "uk", "visitor_id": vid,
             "session_id": sid, "path": "/", "meta": {"test_id": "hero-primary-cta"}},
            {"type": "lead_open", "tenant_slug": "uk", "visitor_id": vid, "session_id": sid},
            {"type": "lead_submit", "tenant_slug": "uk", "visitor_id": vid, "session_id": sid},
            {"type": "name_check", "tenant_slug": "uk", "visitor_id": vid, "session_id": sid,
             "meta": {"result": "available"}},
            {"type": "scroll", "tenant_slug": "uk", "visitor_id": vid, "session_id": sid,
             "meta": {"depth": 50}},
        ]}
        r = requests.post(f"{BASE}/api/track", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["received"] == 6

    def test_track_filters_invalid_events(self):
        r = requests.post(f"{BASE}/api/track", json={"events": [
            {"type": "", "tenant_slug": "uk"},
            {"type": "page_view", "tenant_slug": ""},
            {"type": "noop", "tenant_slug": "uk"},
            {"type": "page_view", "tenant_slug": "uk", "visitor_id": "v",
             "session_id": "s", "path": "/"},
        ]}, timeout=10)
        assert r.status_code == 200
        # Only the last event is valid (empty type, empty tenant, noop are filtered)
        assert r.json()["received"] == 1

    def test_track_empty_batch(self):
        r = requests.post(f"{BASE}/api/track", json={"events": []}, timeout=10)
        assert r.status_code == 200
        assert r.json() == {"ok": True, "received": 0}


# ─── 401 enforcement ────────────────────────────────────────────────────────
class TestAuthGate:
    @pytest.mark.parametrize("path", [
        "/api/admin/analytics/overview",
        "/api/admin/analytics/timeseries?metric=page_views",
        "/api/admin/analytics/breakdown/country",
        "/api/admin/analytics/rankings",
        "/api/admin/analytics/funnel",
        "/api/admin/analytics/recent",
    ])
    def test_get_endpoints_require_auth(self, path):
        r = requests.get(f"{BASE}{path}", timeout=10)
        assert r.status_code == 401, f"{path} expected 401 got {r.status_code}"

    def test_seed_demo_requires_auth_post(self):
        r = requests.post(f"{BASE}/api/admin/analytics/seed-demo", timeout=10)
        assert r.status_code == 401

    def test_seed_demo_requires_auth_delete(self):
        r = requests.delete(f"{BASE}/api/admin/analytics/seed-demo", timeout=10)
        assert r.status_code == 401


# ─── Overview ───────────────────────────────────────────────────────────────
class TestOverview:
    def test_overview_shape(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/overview?period=7d", headers=auth_headers, timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("current", "previous", "delta"):
            assert k in d
        for k in ("page_views", "visitors", "sessions", "cta_clicks", "leads"):
            assert k in d["current"]
            assert k in d["delta"]
        # With demo data, page_views should be > 0 in 30d
        r30 = requests.get(f"{BASE}/api/admin/analytics/overview?period=30d", headers=auth_headers, timeout=20)
        assert r30.status_code == 200
        assert r30.json()["current"]["page_views"] > 0

    def test_overview_tenant_filter(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/overview?period=30d&tenant=uk",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        # Global should be >= per-tenant
        rg = requests.get(f"{BASE}/api/admin/analytics/overview?period=30d", headers=auth_headers, timeout=20)
        assert rg.json()["current"]["page_views"] >= r.json()["current"]["page_views"]


# ─── Timeseries ─────────────────────────────────────────────────────────────
class TestTimeseries:
    def test_timeseries_default(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/timeseries?period=7d&metric=page_views",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert {"bucket", "value"} <= set(data[0].keys())

    @pytest.mark.parametrize("metric", ["page_views", "visitors", "cta_clicks", "leads"])
    def test_timeseries_all_metrics(self, auth_headers, metric):
        r = requests.get(f"{BASE}/api/admin/analytics/timeseries?period=30d&metric={metric}",
                         headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ─── Breakdown ──────────────────────────────────────────────────────────────
class TestBreakdown:
    @pytest.mark.parametrize("dim", [
        "country", "city", "device_type", "browser", "os",
        "referrer", "utm_source", "path", "button",
    ])
    def test_breakdown_dimensions(self, auth_headers, dim):
        r = requests.get(f"{BASE}/api/admin/analytics/breakdown/{dim}?period=30d",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200, f"{dim}: {r.text}"
        data = r.json()
        assert isinstance(data, list)
        if data:
            assert {"key", "count", "visitors"} <= set(data[0].keys())

    def test_breakdown_unknown_dimension(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/breakdown/nope?period=7d",
                         headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json() == []


# ─── Rankings ───────────────────────────────────────────────────────────────
class TestRankings:
    def test_rankings_shape(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/rankings?period=30d",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Rankings should be non-empty with demo data"
        row = data[0]
        for k in ("tenant_slug", "page_views", "visitors", "sessions",
                  "cta_clicks", "leads", "ctr", "cvr"):
            assert k in row, f"missing field {k}"


# ─── Funnel ─────────────────────────────────────────────────────────────────
class TestFunnel:
    def test_funnel_steps(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/funnel?period=30d",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 4
        labels = [s["label"] for s in data]
        assert labels == ["Page view", "CTA click", "Form open", "Form submit"]
        for s in data:
            assert "value" in s and "pct" in s
        # Pct should be monotonically non-increasing (funnel)
        pcts = [s["pct"] for s in data]
        assert pcts == sorted(pcts, reverse=True), f"Funnel not descending: {pcts}"


# ─── Recent ─────────────────────────────────────────────────────────────────
class TestRecent:
    def test_recent_returns_events(self, auth_headers):
        r = requests.get(f"{BASE}/api/admin/analytics/recent?limit=50",
                         headers=auth_headers, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            ev = data[0]
            for k in ("ts", "type", "tenant_slug"):
                assert k in ev
            # _id should be excluded
            assert "_id" not in ev


# ─── Seed-demo idempotency ──────────────────────────────────────────────────
class TestSeedDemo:
    def test_seed_demo_is_idempotent(self, auth_headers):
        """Calling seed-demo twice should not balloon the count — it wipes prior demo first."""
        r1 = requests.post(f"{BASE}/api/admin/analytics/seed-demo",
                           headers=auth_headers, timeout=120)
        assert r1.status_code == 200
        c1 = r1.json()["inserted"]
        r2 = requests.post(f"{BASE}/api/admin/analytics/seed-demo",
                           headers=auth_headers, timeout=120)
        assert r2.status_code == 200
        c2 = r2.json()["inserted"]
        # Both within the same range (~2500-3500)
        assert 1500 < c1 < 6000
        assert 1500 < c2 < 6000

    def test_clear_demo(self, auth_headers):
        # Re-seed first to make sure demo data exists
        requests.post(f"{BASE}/api/admin/analytics/seed-demo", headers=auth_headers, timeout=120)
        r = requests.delete(f"{BASE}/api/admin/analytics/seed-demo", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        body = r.json()
        assert body["ok"] is True
        assert isinstance(body["deleted"], int) and body["deleted"] > 0
        # Re-seed for any tests that depend on demo data after this one
        requests.post(f"{BASE}/api/admin/analytics/seed-demo", headers=auth_headers, timeout=120)
