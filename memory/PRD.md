# Swift Formations — Multi-Tenant CMS PRD

## Original Problem Statement
Single admin panel managing landing pages for many countries. Each country has its own domain
(ukcompanyformation.com, ukraineformations.com, …). One shared template — design changes
propagate to all sites; content is per-country. Logo abbreviation auto-generated from brand
name. Company-formation data from b2bhub.ltd. Deploy via GitHub → Railway.

## User Choices
- Stack: React SPA + FastAPI + MongoDB (Next.js port deferred)
- Admin: `admin@swiftformations.io` / `Admin@12345`
- B2BHub: **MOCKED** (real key + endpoint to be plugged in later)
- Seeded countries: UK, Ukraine, Germany, France, USA
- Deployment target: GitHub → Railway, multi-domain on one service

## Architecture (current)
- `/api/auth/*` JWT (Bearer header + cookie); brute-force lockout (email + ip), proxy-aware via X-Forwarded-For
- `/api/admin/countries` full CRUD, `/content`, `/publish`, `/unpublish`, `/reset-content`
- `/api/public/landing?host=…&tenant=…` resolves tenant from domain or slug
- `/api/admin/b2bhub/:code` proxies MOCKED data (`/app/backend/b2bhub.py`)
- 5 countries + admin seeded idempotently on startup
- Frontend resolves tenant from `window.location.hostname` (with `?tenant=` and `/preview/:slug` fallbacks)
- Auto-logo: `autoAbbreviation(brandName)` shared client+server

## What's Implemented (2025-12)
- [x] Auth (login, /me, JWT, lockout)
- [x] Multi-tenant landing template (Hero / TrustBar / How / Pricing / Benefits / Testimonials / FAQ / Final CTA / Footer / Lead form) — all content-driven
- [x] Per-country branding (brand color, accent color, currency, authority, logo abbreviation)
- [x] Admin panel: sidebar country list, dashboard with stats, country edit page
- [x] Country edit tabs: General · Content · SEO · B2BHub · Danger
- [x] Section editors for Hero, Trust, How, Pricing tiers (w/ features), Benefits, Testimonials, FAQs, Final CTA, Footer columns
- [x] Add / delete / publish / unpublish / reset-content
- [x] B2BHub MOCKED panel with refresh + visible MOCKED tag
- [x] 5 countries pre-seeded
- [x] SEO: per-country `<title>` and `<meta description>` rewritten at runtime

## Test Status
- Iteration 2: backend 25/26 pytest pass, frontend 100% of critical flows.
- Fixed: proxy-aware brute-force lockout (verified 6th attempt now returns 429).
- Fixed: Radix Dialog a11y description added.

## Backlog
- P1: Real B2BHub.ltd API integration (replace MOCK in `b2bhub.py`)
- P1: Migrate to Next.js for SSR per-domain SEO (one-day port)
- P1: Lead form persistence + admin "Leads" tab
- P2: Field-level "synced from B2BHub" override indicator with one-click sync
- P2: Revision history + rollback per country
- P2: Per-country language (multi-language inside a country)
- P2: JSON-LD schema injection (FAQPage, Organization, Service)
- P3: Bulk CSV import "Create 20 countries"
- P3: Audit log of admin edits

## Next Tasks
1. Push to GitHub (instructions: see support_agent output earlier)
2. Deploy on Railway with web + api + mongo services
3. Attach `ukcompanyformation.com` (and others) as custom domains
4. Provide real B2BHub credentials → drop into `b2bhub.py` `fetch_b2bhub_data`
