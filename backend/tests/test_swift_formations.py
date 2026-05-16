"""Backend tests for Swift Formations multi-tenant CMS.

Covers: auth, country CRUD, content, publish/unpublish, reset, public landing,
B2BHub mock, and brute-force lockout.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fall back to reading frontend env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@swiftformations.io"
ADMIN_PASSWORD = "Admin@12345"

EXPECTED_SLUGS = {"uk", "ua", "de", "fr", "us"}


# ──────────────── Fixtures ────────────────
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ──────────────── Auth ────────────────
class TestAuth:
    def test_login_success(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 20
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "super_admin"

    def test_login_wrong_password(self, session):
        # Use unique email-ish identifier (different from admin) to avoid lockout on admin
        r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-pass-XYZ"})
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "super_admin"

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ──────────────── Countries listing & defaults ────────────────
class TestCountries:
    def test_list_requires_auth(self):
        r = requests.get(f"{API}/admin/countries")
        assert r.status_code == 401

    def test_list_returns_5_seeded(self, session, auth_headers):
        r = session.get(f"{API}/admin/countries", headers=auth_headers)
        assert r.status_code == 200
        countries = r.json()
        slugs = {c["slug"] for c in countries}
        assert EXPECTED_SLUGS.issubset(slugs), f"Missing seeds. Got: {slugs}"

    def test_get_country_returns_country_and_content(self, session, auth_headers):
        countries = session.get(f"{API}/admin/countries", headers=auth_headers).json()
        uk = next(c for c in countries if c["slug"] == "uk")
        r = session.get(f"{API}/admin/countries/{uk['id']}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "country" in data and "content" in data
        assert data["country"]["slug"] == "uk"
        assert "hero" in data["content"]

    def test_patch_country_updates_name_and_updated_at(self, session, auth_headers):
        countries = session.get(f"{API}/admin/countries", headers=auth_headers).json()
        de = next(c for c in countries if c["slug"] == "de")
        old_updated = de["updated_at"]
        new_name = de["name"]  # keep value to not break visual tests
        r = session.patch(
            f"{API}/admin/countries/{de['id']}",
            headers=auth_headers,
            json={"name": new_name, "brand_name": de["brand_name"]},
        )
        assert r.status_code == 200
        updated = r.json()
        assert updated["updated_at"] != old_updated

    def test_patch_content(self, session, auth_headers):
        countries = session.get(f"{API}/admin/countries", headers=auth_headers).json()
        uk = next(c for c in countries if c["slug"] == "uk")
        # Fetch current content first
        cur = session.get(f"{API}/admin/countries/{uk['id']}", headers=auth_headers).json()
        content = cur["content"]
        content["hero"]["headline_highlight"] = "24 hours"  # idempotent
        r = session.patch(
            f"{API}/admin/countries/{uk['id']}/content",
            headers=auth_headers,
            json={"content": content},
        )
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Verify persisted
        get_r = session.get(f"{API}/admin/countries/{uk['id']}", headers=auth_headers)
        assert get_r.json()["content"]["hero"]["headline_highlight"] == "24 hours"


# ──────────────── Create / Delete / Publish ────────────────
class TestCountryLifecycle:
    @pytest.fixture(scope="class")
    def created_country(self, auth_headers):
        slug = f"test{uuid.uuid4().hex[:6]}"
        payload = {
            "slug": slug,
            "name": "Testland",
            "long_name": "Test Land",
            "flag": "🏳️",
            "domain": f"{slug}.example.com",
            "brand_name": "Acme Forge",
            "currency": "USD",
            "currency_symbol": "$",
            "locale": "en",
            "country_code": "TL",
            "capital": "Test City",
            "authority_name": "Test Authority",
            "authority_short": "TA",
            "company_type": "LLC",
            "legal_suffix": "Registered Testland.",
            "b2bhub_country_code": "US",
        }
        r = requests.post(f"{API}/admin/countries", headers=auth_headers, json=payload)
        assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
        data = r.json()
        yield data
        # Cleanup
        requests.delete(f"{API}/admin/countries/{data['id']}", headers=auth_headers)

    def test_create_sets_abbreviation_and_default_content(self, auth_headers, created_country):
        # 'Acme Forge' -> 'AF'
        assert created_country["abbreviation"] == "AF"
        assert created_country["status"] == "draft"
        # Verify default content was generated
        r = requests.get(f"{API}/admin/countries/{created_country['id']}", headers=auth_headers)
        assert r.status_code == 200
        assert "hero" in r.json()["content"]

    def test_create_duplicate_slug_409(self, auth_headers, created_country):
        payload = {
            "slug": created_country["slug"],
            "name": "Dup",
            "domain": "dup.example.com",
            "brand_name": "Dup",
        }
        r = requests.post(f"{API}/admin/countries", headers=auth_headers, json=payload)
        assert r.status_code == 409

    def test_publish_unpublish_toggle(self, auth_headers, created_country):
        cid = created_country["id"]
        r1 = requests.post(f"{API}/admin/countries/{cid}/publish", headers=auth_headers)
        assert r1.status_code == 200
        assert r1.json()["status"] == "published"

        r2 = requests.post(f"{API}/admin/countries/{cid}/unpublish", headers=auth_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "draft"

    def test_reset_content(self, auth_headers, created_country):
        cid = created_country["id"]
        # Mutate content
        requests.patch(
            f"{API}/admin/countries/{cid}/content",
            headers=auth_headers,
            json={"content": {"hero": {"headline_highlight": "MUTATED"}}},
        )
        # Reset
        r = requests.post(f"{API}/admin/countries/{cid}/reset-content", headers=auth_headers)
        assert r.status_code == 200
        get_r = requests.get(f"{API}/admin/countries/{cid}", headers=auth_headers)
        # default contains hero.headline_highlight = "24 hours"
        assert get_r.json()["content"]["hero"]["headline_highlight"] == "24 hours"

    def test_delete_removes_country_and_content(self, auth_headers):
        # Create separate one to delete
        slug = f"del{uuid.uuid4().hex[:6]}"
        r = requests.post(
            f"{API}/admin/countries",
            headers=auth_headers,
            json={
                "slug": slug, "name": "ToDel", "domain": f"{slug}.ex.com",
                "brand_name": "ToDel", "country_code": "ZZ",
                "authority_name": "Z", "authority_short": "Z",
                "company_type": "X", "legal_suffix": "X", "b2bhub_country_code": "GB",
            },
        )
        cid = r.json()["id"]
        d = requests.delete(f"{API}/admin/countries/{cid}", headers=auth_headers)
        assert d.status_code == 200
        # Verify gone
        g = requests.get(f"{API}/admin/countries/{cid}", headers=auth_headers)
        assert g.status_code == 404


# ──────────────── Public landing ────────────────
class TestPublicLanding:
    @pytest.mark.parametrize("tenant", ["uk", "ua", "de", "fr", "us"])
    def test_by_tenant(self, tenant):
        r = requests.get(f"{API}/public/landing", params={"tenant": tenant})
        assert r.status_code == 200, f"Failed for tenant {tenant}: {r.text}"
        data = r.json()
        assert data["country"]["slug"] == tenant
        assert "hero" in data["content"]
        assert "b2bhub" in data and data["b2bhub"]["is_mocked"] is True

    @pytest.mark.parametrize("host,expected_slug", [
        ("ukcompanyformation.com", "uk"),
        ("ukraineformations.com", "ua"),
        ("germanyformations.com", "de"),
    ])
    def test_by_host(self, host, expected_slug):
        r = requests.get(f"{API}/public/landing", params={"host": host})
        assert r.status_code == 200
        assert r.json()["country"]["slug"] == expected_slug

    def test_fallback_to_first_published(self):
        # No host/tenant resolved
        r = requests.get(f"{API}/public/landing", params={"host": "unknown.example.com"})
        assert r.status_code == 200
        # Should resolve to some published country
        assert r.json()["country"]["status"] == "published"


# ──────────────── B2BHub mock ────────────────
class TestB2BHub:
    def test_admin_b2bhub_returns_mock(self, auth_headers):
        r = requests.get(f"{API}/admin/b2bhub/GB", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["is_mocked"] is True
        assert data["government_fee_display"] == "£50"
        assert "LTD" in data["company_types"]

    def test_admin_b2bhub_requires_auth(self):
        r = requests.get(f"{API}/admin/b2bhub/GB")
        assert r.status_code == 401


# ──────────────── Brute-force lockout ────────────────
class TestBruteForce:
    def test_lockout_after_5_failures(self):
        """Use a never-existing email so we don't lock the real admin."""
        email = f"bf-{uuid.uuid4().hex[:8]}@nope.example"
        for i in range(5):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
            assert r.status_code == 401, f"attempt {i}: {r.status_code}"
        # 6th attempt should be 429
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
        assert r.status_code == 429, f"Expected lockout 429, got {r.status_code} {r.text}"
