# Swift Formations — Multi-Tenant CMS + Analytics

## Original Problem
Single admin panel managing landing pages for many countries (own domain each), shared template, auto-generated logo, B2BHub.ltd data, deploy GitHub → Railway. Plus a full analytics dashboard.

## Stack
- React SPA (CRA) + FastAPI + MongoDB
- Auth: JWT (Bearer + cookie), proxy-aware brute-force lockout
- Analytics: in-house event tracking (no Google Analytics dependency)

## What's Implemented (Dec 2025)
### CMS
- 253 country landings seeded via B2BHub bulk sync (248 from B2BHub catalog + 5 originals), each with own branding/currency/authority/copy
- Admin (dark mode): login, sidebar w/ country list + status, edit page (General / Content / SEO / B2BHub / Danger), add/delete/publish/reset, auto-logo
- Public landing resolves tenant by hostname or ?tenant=/preview/:slug
- B2BHub: REAL API (`/app/backend/b2bhub.py`) — 248 confirmed slugs, ISO-2-derived flag emojis, dynamic registrar/timeline/pricing pulled per country
- Bulk sync endpoint `POST /api/admin/b2bhub/sync` + Admin UI dialog in `AdminCountries.js`

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
- P1 ip-api rate-limit semaphore (45/min free tier)
- P1 Next.js port for SSR/per-domain SEO
- P2 Coalesce admin analytics into single `/dashboard` endpoint (currently 13 parallel calls per refresh)
- P2 CSV/JSON export from analytics
- P2 Localized content per country (multi-language)
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

## SEO Phase 2 — DOM + Redirect Fixes (Feb 2026)
Addresses the SEOptimer/Seobility To-Do list reported by the user.
- **`public/index.html`**: added bot-visible `<h1>` ("Register your company online in 24 hours"),
  `<p>` description, and 6 primary `<nav>` links inside `#root`. Visible to non-JS crawlers
  (SEOptimer, Seobility, Ahrefs site audit) and replaced by React on hydration. Static `<title>`
  updated to match the new H1 verbatim for title-content relevance.
- **`netlify.toml`**: added two global 301 redirects (`https://www.* → https://:splat` and
  `http://www.* → https://:splat`) — a single rule that strips `www.` across **all 253**
  attached custom domains. Force=true overrides Netlify's per-domain primary setting.
- **`src/pages/Landing.js`**: when admins leave the `seo.title` field blank, the runtime
  `document.title` now auto-derives from the hero headline (`prefix + highlight + suffix`),
  guaranteeing title↔H1 keyword overlap on every country page.
- Heading hierarchy audited across `Hero`, `HowItWorks`, `Pricing`, `Benefits`, `Testimonials`,
  `FAQ`, `BlogSection`, `FinalCTA`, `Footer`: 1×h1, 6×h2, 22×h3, no skipped levels.
- Smoke-tested via curl + Playwright on `/preview/uk` — confirmed 1 h1, correct title match,
  and 6 internal nav links present in raw HTML.

## Pending (P1)
- SEO Audit lead-magnet tool at `/tools/seo-audit` + user-facing SaaS dashboard (separate user auth)
- Lead gen: exit-intent popup, sticky mobile CTA bar, WhatsApp deep-link
- Live visitor count widget on hero ("🟢 X founders viewing right now")

## Blocked
- Netlify SSL provisioning deadlock for newly attached domains — awaiting Netlify Support ticket.
