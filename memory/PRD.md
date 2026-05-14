# Swift Formations — PRD

## Original Problem Statement
High-converting single-page landing for a UK company formation service.
Target: first-time entrepreneurs, non-UK residents, freelancers, small business owners.
Selling points: 24-hour formation, low price (£12.99+), full compliance, privacy, ongoing support.

## User Choices
- Company name: **Swift Formations**
- Backend: **None** (frontend-only static form)
- Name Checker: **Mock** (client-side)
- Design: **Modern minimal, design agent decided** → Swiss/High-Contrast Linear-style
- Pricing tiers: Essential £12.99 · Privacy £39.99 (popular) · All-Inclusive £89.99

## Architecture
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion + lucide-react
- Fonts: Outfit (display) · Manrope (body) · JetBrains Mono (mono)
- Backend: untouched (template /api remains for future)
- Single route: `/` renders `pages/Landing.js`

## Sections Implemented (2025-12)
- [x] Sticky glass header with anchor nav + mobile menu
- [x] Hero with grid background, headline, mock company-name checker (with suffix select), dual CTA, trust signals, live formation panel
- [x] Marquee trust bar with partner logos (Companies House, Tide, Wise, FreeAgent, ACSP, Stripe, B Corp)
- [x] How It Works (4 step bento grid: Name Check → Details → Payment → Documents)
- [x] Pricing 3 tiers — Privacy is inverse black w/ red "Most popular" badge
- [x] Benefits bento (asymmetric 12-col grid + dark CTA strip)
- [x] Testimonials (3 cards w/ provided portraits)
- [x] FAQ shadcn accordion (8 questions)
- [x] Final CTA with 24h countdown + offer chips
- [x] Dark footer with mega brand mark + 4 link columns
- [x] Lead capture modal (frontend-only, validates and shows success state)

## Test Status
- Iteration 1: 23/24 PASS. Fixed medium bug (`noValidate` on lead form so custom email-validation message displays).

## Backlog
- P1: Real Companies House API integration for name checker (currently mocked)
- P1: Wire lead form to backend + admin view (Mongo)
- P2: Add live chat widget (Intercom/Crisp placeholder shown)
- P2: SEO structured data (FAQ, Organization, Service schema in `<head>`)
- P2: A/B test variant for hero headline
- P3: Blog/Resources section
- P3: Add cookie consent banner

## Next Tasks
1. Decide on real Companies House API integration vs. keep mock
2. Add lead persistence + simple admin route (if user wants)
3. SEO: inject JSON-LD schema in `index.html`
