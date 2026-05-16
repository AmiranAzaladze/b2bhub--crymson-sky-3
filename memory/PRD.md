# Swift Formations — Multi-Tenant CMS + Analytics

## Original Problem
Single admin panel managing landing pages for many countries (own domain each), shared template, auto-generated logo, B2BHub.ltd data, deploy GitHub → Railway. Plus a full analytics dashboard.

## Stack
- React SPA (CRA) + FastAPI + MongoDB
- Auth: JWT (Bearer + cookie), proxy-aware brute-force lockout
- Analytics: in-house event tracking (no Google Analytics dependency)

## What's Implemented (Dec 2025)
### CMS
- 5 country landings seeded (UK, UA, DE, FR, US), each with own branding/currency/authority/copy
- Admin (dark mode): login, sidebar w/ country list + status, edit page (General / Content / SEO / B2BHub / Danger), add/delete/publish/reset, auto-logo
- Public landing resolves tenant by hostname or ?tenant=/preview/:slug
- B2BHub: MOCKED with refresh button + visible tag

### Analytics
- **Backend** (`/app/backend/analytics.py`):
  - `events` collection w/ tenant, visitor_id, session_id, IP, geo, device, OS, browser, UTMs, meta
  - `ip_geo` cache (ip-api.com, 30d TTL)
  - `POST /api/track` (public, batched via sendBeacon, schema-tolerant)
  - `GET /api/admin/analytics/overview|timeseries|breakdown/:dim|rankings|funnel|recent`
  - `POST/DELETE /api/admin/analytics/seed-demo` (2.5-3k synthetic events over 30d, idempotent)
- **Frontend** (`/app/frontend/src/lib/analytics.js`):
  - SDK: visitor_id (forever), session_id (30-min sliding), auto page_view, document-level click delegation on all `data-testid` elements, scroll-depth (25/50/75/100), sendBeacon on visibilitychange/pagehide
  - Skips `/admin/*` automatically
  - Manual hooks: `trackLeadOpen`, `trackLeadSubmit`, `trackNameCheck`
- **Admin Analytics page** (`/admin/analytics`):
  - Tenant + period selectors
  - 5 KPI cards (PV, Visitors, Sessions, CTA clicks, Leads) with vs-previous-period delta
  - Recharts time-series (switchable metric)
  - Sortable rankings table (any column) with progress bars
  - 4-step funnel with drop-off %
  - 8 breakdown panels (countries, cities, device donut, browser, OS, referrers, UTM sources, button clicks)
  - Live event feed (last 50) with country flag, city, device, browser, IP

## Test Status (iter_3)
- Backend: 33/33 pytest pass (100%)
- Frontend: all flows verified visually + DOM
- Applied 2 safety fixes: tolerant `/api/track` schema, defensive `cached_map` init

## Backlog
- P1 Real B2BHub.ltd integration (replace mock)
- P1 ip-api rate-limit semaphore (45/min free tier)
- P2 Coalesce admin analytics into single `/dashboard` endpoint (currently 13 parallel calls per refresh)
- P2 CSV/JSON export from analytics
- P2 Next.js port for SSR/per-domain SEO
- P3 Bot filtering / spam guard on /api/track
- P3 GDPR: IP hashing / last-octet masking toggle

## Credentials & URLs
- Admin: admin@swiftformations.io / Admin@12345
- Public preview: `/preview/{uk|ua|de|fr|us}`
- Analytics: `/admin/analytics`

## Next Actions
1. Push to GitHub & deploy on Railway (support_agent guide provided earlier)
2. Attach country domains
3. Provide real B2BHub credentials when ready
