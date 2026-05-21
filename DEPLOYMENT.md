# Deployment Architecture

```
                     ┌────────────────────────────────────┐
                     │       YOUR MONGODB                 │
                     │   (Atlas / self-hosted)            │
                     └──────────────┬─────────────────────┘
                                    │ MONGO_URL
                                    ▼
                     ┌────────────────────────────────────┐
                     │     RAILWAY  (FastAPI backend)     │
                     │     api.yourdomain.com             │
                     └──────────────▲─────────────────────┘
                                    │ same REACT_APP_BACKEND_URL on every site
        ┌───────────────────────────┴────────────────────────────┐
        │                                                        │
┌───────▼──────────┐  ┌───────────────────┐  ┌──────────────────▼┐
│  ADMIN site      │  │  lg-uk            │  │  lg-singapore     │
│                  │  │                   │  │                   │
│  admin.b2b.com   │  │ companyform…org   │  │ singapore-form…   │
│                  │  │                   │  │                   │
│  no TENANT var   │  │ TENANT=uk         │  │ TENANT=singapore  │
└──────────────────┘  └───────────────────┘  └───────────────────┘
        ▲                     ▲                       ▲
        │                     │                       │
        └────────────── one GitHub repo, one template ┘
              (push code → all 251+ sites rebuild)
```

## How content updates flow

| You do this                       | What happens                                              |
| --------------------------------- | --------------------------------------------------------- |
| Edit copy in Admin UI             | API writes MongoDB → next visitor sees it immediately     |
| Push UI/code change to GitHub     | Netlify rebuilds all per-country sites in parallel        |
| Add a new country in Admin        | Run `node scripts/deploy-landings.mjs` → new site created |
| Add a custom domain to a landing  | Done in Netlify dashboard for that one site (~5 min)      |

## One-time setup

### 1. Backend on Railway
- Push `/app/backend` to GitHub (separate repo or same monorepo)
- Railway → New project → Deploy from GitHub
- Add env vars:
  - `MONGO_URL`
  - `DB_NAME=swiftformations`
  - `JWT_SECRET` (any long random string)
  - `B2BHUB_API_KEY`
  - `B2BHUB_BASE_URL=https://b2bhub.ltd/api/v1`
- Note the Railway URL (e.g. `https://b2bhub-api.up.railway.app`)
- Optional: attach `api.yourdomain.com`

### 2. Frontend repo prep
- Push `/app/frontend` to GitHub
- The `netlify.toml` at `frontend/netlify.toml` is already configured
- Add this in your `frontend/package.json` if you want a custom build script (optional)

### 3. Admin site
- Netlify → New site → connect repo
- Env vars on this site only:
  - `REACT_APP_BACKEND_URL=https://b2bhub-api.up.railway.app`
  - **Do NOT set `REACT_APP_TENANT`** — admin shouldn't have one
- Attach `admin.yourdomain.com`
- Admin login URL becomes `https://admin.yourdomain.com/admin/login`

### 4. Bulk-create per-country landing sites
From your local machine:
```bash
cd /app/scripts
NETLIFY_AUTH_TOKEN=nfp_xxx \
API_URL=https://b2bhub-api.up.railway.app \
ADMIN_EMAIL=admin@swiftformations.io \
ADMIN_PASSWORD=Admin@12345 \
GITHUB_REPO=youruser/your-repo \
node deploy-landings.mjs
```

Get `NETLIFY_AUTH_TOKEN` from https://app.netlify.com/user/applications/personal

This creates one site per country: `lg-uk`, `lg-singapore`, etc., each with:
- The same GitHub repo & build command
- `REACT_APP_TENANT=<slug>` baked in at build time
- `REACT_APP_BACKEND_URL` pointing to Railway

Run for a subset first:
```bash
ONLY_SLUGS=uk,singapore node deploy-landings.mjs
```

### 5. Attach custom domains
For each landing you want public, in the Netlify dashboard for that site:
- Site settings → Domain management → Add custom domain
- Paste DNS records into your registrar
- After propagation (5–30 min) the country's landing serves on that domain

### 6. Keep CMS `domain` field in sync
For each country in Admin, set the `domain` field to the live custom domain — that's not required for routing (REACT_APP_TENANT handles it), but it's used by analytics and "view live" links inside admin.

## Tenant resolution priority

The frontend resolves which country to render in this order:

1. **`process.env.REACT_APP_TENANT`** — build-time bake (per-site Netlify)
2. `/preview/:slug` route param — for previews
3. `?tenant=` query param — manual override
4. `window.location.hostname` — multi-domain fallback

So Pattern B (per-site) and Pattern A (multi-domain) both work from the same code.
