#!/usr/bin/env node
/**
 * deploy-landings.mjs
 *
 * Bulk-create / sync one Netlify site **per country** in your CMS.
 * Every site shares the SAME GitHub repo and the SAME build, but differs
 * by ONE env var: REACT_APP_TENANT=<slug>.
 *
 * Idempotent: re-running won't create duplicates. It updates env vars
 * and triggers a rebuild for existing sites.
 *
 * Required env vars:
 *   NETLIFY_AUTH_TOKEN   personal access token from https://app.netlify.com/user/applications
 *   API_URL              your Railway backend URL (e.g. https://b2bhub-api.up.railway.app)
 *   ADMIN_EMAIL          admin login
 *   ADMIN_PASSWORD       admin password
 *   GITHUB_REPO          "owner/repo" — the GitHub repo the sites pull from
 *   SITE_NAME_PREFIX     (optional) defaults to "lg-" → sites become lg-uk, lg-singapore, …
 *   ONLY_SLUGS           (optional) comma-separated subset to deploy (uk,singapore)
 *
 * Usage:
 *   node deploy-landings.mjs
 *   ONLY_SLUGS=uk,singapore node deploy-landings.mjs
 */

const NETLIFY_API = "https://api.netlify.com/api/v1";

const required = ["NETLIFY_AUTH_TOKEN", "API_URL", "ADMIN_EMAIL", "ADMIN_PASSWORD", "GITHUB_REPO"];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`✗ missing env var: ${k}`);
    process.exit(1);
  }
}

const {
  NETLIFY_AUTH_TOKEN,
  API_URL,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  GITHUB_REPO,
  SITE_NAME_PREFIX = "lg-",
  ONLY_SLUGS = "",
} = process.env;

const allowedSlugs = ONLY_SLUGS
  ? ONLY_SLUGS.split(",").map((s) => s.trim()).filter(Boolean)
  : null;

async function http(method, url, opts = {}) {
  const r = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`${method} ${url} → ${r.status}: ${text.substring(0, 240)}`);
  }
  return r.status === 204 ? null : r.json();
}

async function netlify(method, path, body) {
  return http(method, `${NETLIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${NETLIFY_AUTH_TOKEN}` },
    body,
  });
}

async function loginAdmin() {
  const r = await http("POST", `${API_URL}/api/auth/login`, {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  return r.token;
}

async function listCountries(token) {
  return http("GET", `${API_URL}/api/admin/countries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function listExistingSites() {
  const out = [];
  let page = 1;
  while (true) {
    const sites = await netlify("GET", `/sites?page=${page}&per_page=100`);
    if (!sites.length) break;
    out.push(...sites);
    if (sites.length < 100) break;
    page += 1;
  }
  return new Map(out.map((s) => [s.name, s]));
}

async function ensureSite(slug, country, existing) {
  const name = `${SITE_NAME_PREFIX}${slug}`;
  const envVars = [
    { key: "REACT_APP_TENANT", values: [{ value: slug, context: "all" }] },
    { key: "REACT_APP_BACKEND_URL", values: [{ value: API_URL, context: "all" }] },
    { key: "CI", values: [{ value: "false", context: "all" }] },
  ];

  let site = existing.get(name);
  if (!site) {
    console.log(`→ creating site ${name}`);
    site = await netlify("POST", "/sites", {
      name,
      repo: {
        provider: "github",
        repo: GITHUB_REPO,
        branch: "main",
        cmd: "yarn install --frozen-lockfile && yarn build",
        dir: "frontend/build",
        base: "frontend",
      },
    });
  } else {
    console.log(`✓ site exists ${name} (${site.url})`);
  }

  // Always (re)sync env vars to keep tenant baked correctly
  await netlify("PUT", `/accounts/${site.account_slug}/env`, undefined).catch(() => {});
  for (const v of envVars) {
    await netlify("POST", `/accounts/${site.account_slug}/env?site_id=${site.id}`, v).catch(
      async (e) => {
        // If key exists, PATCH it instead
        if (String(e.message).includes("422") || String(e.message).includes("409")) {
          await netlify(
            "PATCH",
            `/accounts/${site.account_slug}/env/${v.key}?site_id=${site.id}`,
            v,
          ).catch(() => {});
        }
      },
    );
  }

  // Trigger a fresh build so env vars take effect
  await netlify("POST", `/sites/${site.id}/builds`, {}).catch(() => {});

  console.log(`  ${country.flag} ${country.name.padEnd(20)} → ${site.ssl_url || site.url}`);
  return site;
}

async function main() {
  console.log("🔐 authenticating with backend…");
  const token = await loginAdmin();

  console.log("🌍 fetching countries…");
  let countries = await listCountries(token);
  if (allowedSlugs) {
    countries = countries.filter((c) => allowedSlugs.includes(c.slug));
  }
  console.log(`  → ${countries.length} countries to sync`);

  console.log("📋 listing existing Netlify sites…");
  const existing = await listExistingSites();
  console.log(`  → ${existing.size} sites currently on Netlify`);

  let ok = 0;
  let fail = 0;
  for (const c of countries) {
    try {
      await ensureSite(c.slug, c, existing);
      ok += 1;
    } catch (e) {
      console.error(`  ✗ ${c.slug}: ${e.message.substring(0, 200)}`);
      fail += 1;
    }
  }
  console.log(`\n✅ done — ${ok} ok / ${fail} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
