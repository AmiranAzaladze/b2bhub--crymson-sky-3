// Quality scoring + SEO test utilities used by the country edit page.
// All checks are pure functions of (country, content). No network/IO.

function len(s) { return (s || "").trim().length; }
function isFilled(s) { return len(s) > 0; }
function nonEmptyArray(a) { return Array.isArray(a) && a.length > 0; }

/* ------------------------------------------------------------------ */
/* CONTENT SCORE — completeness of every editable section              */
/* ------------------------------------------------------------------ */
export function contentScore(content = {}) {
  const hero = content?.hero || {};
  const heroHeadline = [hero.headline_prefix, hero.headline_highlight, hero.headline_suffix]
    .filter(Boolean).join(" ").trim();
  const checks = [
    { weight: 8,  ok: isFilled(heroHeadline), label: "Hero headline" },
    { weight: 4,  ok: isFilled(hero.sub), label: "Hero subheadline" },
    { weight: 3,  ok: isFilled(hero.cta_primary?.label) || isFilled(hero.cta_primary), label: "Hero CTA label" },
    { weight: 6,  ok: nonEmptyArray(content?.benefits?.items), label: "Benefits" },
    { weight: 6,  ok: nonEmptyArray(content?.how_it_works?.items) || nonEmptyArray(content?.steps), label: "How it works steps" },
    { weight: 8,  ok: nonEmptyArray(content?.pricing?.tiers), label: "Pricing tiers" },
    { weight: 4,  ok: nonEmptyArray(content?.trust_bar?.items), label: "Trust bar logos" },
    { weight: 6,  ok: nonEmptyArray(content?.testimonials?.items), label: "Testimonials" },
    { weight: 8,  ok: nonEmptyArray(content?.faqs?.items), label: "FAQs" },
    { weight: 4,  ok: isFilled(content?.final_cta?.title) || isFilled(content?.final_cta?.cta), label: "Final CTA" },
    { weight: 3,  ok: isFilled(content?.footer?.tagline) || nonEmptyArray(content?.footer?.links), label: "Footer content" },
  ];
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

/* ------------------------------------------------------------------ */
/* SEO SCORE — practical signals across meta, schema, verification     */
/* ------------------------------------------------------------------ */
export function seoScore(country = {}, content = {}) {
  const t = content?.seo?.title || "";
  const d = content?.seo?.description || "";
  const tracking = content?.tracking || {};
  const hero = content?.hero || {};
  const heroHeadline = [hero.headline_prefix, hero.headline_highlight, hero.headline_suffix].filter(Boolean).join(" ").trim();

  const checks = [
    { weight: 10, ok: isFilled(country.domain), label: "Custom domain set" },
    { weight: 5,  ok: isFilled(country.slug), label: "Slug set" },
    { weight: 12, ok: len(t) >= 30 && len(t) <= 60, label: "Title length 30–60" },
    { weight: 12, ok: len(d) >= 110 && len(d) <= 160, label: "Description length 110–160" },
    { weight: 6,  ok: isFilled(country.brand_name), label: "Brand name (Organization schema)" },
    { weight: 5,  ok: nonEmptyArray(content?.faqs?.items), label: "FAQ content (FAQPage schema)" },
    { weight: 5,  ok: isFilled(country.authority_name), label: "Authority info (E-E-A-T)" },
    { weight: 5,  ok: isFilled(country.capital), label: "Address / locality" },
    { weight: 5,  ok: isFilled(tracking.ga4_id) || isFilled(tracking.gtm_id), label: "Analytics installed (GA4 / GTM)" },
    { weight: 5,  ok: isFilled(tracking.google_site_verification), label: "Google Search Console verified" },
    { weight: 3,  ok: isFilled(tracking.bing_site_verification), label: "Bing Webmaster verified" },
    { weight: 4,  ok: isFilled(heroHeadline), label: "Hero H1 present" },
    { weight: 3,  ok: isFilled(country.currency), label: "Currency (Offer schema)" },
    { weight: 3,  ok: isFilled(country.locale), label: "Locale set" },
  ];
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

/* ------------------------------------------------------------------ */
/* SEO TESTS — structured tests with pass/warn/fail per schema family  */
/* ------------------------------------------------------------------ */
const PASS = "pass", WARN = "warn", FAIL = "fail";

function test(status, label, details) { return { status, label, details }; }

export function seoTests(country = {}, content = {}) {
  const t = content?.seo?.title || "";
  const d = content?.seo?.description || "";
  const tracking = content?.tracking || {};
  const faqs = content?.faqs?.items || [];
  const pricingTiers = content?.pricing?.tiers || [];
  const supportEmail = content?.footer?.contact_email || content?.support?.email;

  const META = {
    name: "Meta tags",
    description: "Core <title> and meta description quality.",
    tests: [
      isFilled(t)
        ? (len(t) > 60 ? test(WARN, "Title length", `${len(t)} chars — Google truncates after ~60.`)
          : len(t) < 30 ? test(WARN, "Title length", `${len(t)} chars — usually 30–60 is ideal.`)
          : test(PASS, "Title length", `${len(t)} chars.`))
        : test(FAIL, "Title set", "Empty — set a unique <title>."),
      isFilled(d)
        ? (len(d) > 160 ? test(WARN, "Description length", `${len(d)} chars — Google truncates after ~160.`)
          : len(d) < 110 ? test(WARN, "Description length", `${len(d)} chars — aim for 110–160.`)
          : test(PASS, "Description length", `${len(d)} chars.`))
        : test(FAIL, "Description set", "Empty — set a unique meta description."),
      country.domain
        ? test(PASS, "Canonical domain", country.domain)
        : test(FAIL, "Canonical domain", "Set a custom domain so each landing has a stable canonical."),
    ],
  };

  const ORG = {
    name: "Organization schema",
    description: "schema.org/Organization injected for the tenant.",
    tests: [
      country.brand_name ? test(PASS, "name", country.brand_name) : test(FAIL, "name", "Brand name missing"),
      country.domain ? test(PASS, "url", `https://${country.domain}/`) : test(FAIL, "url", "Domain missing → no canonical URL"),
      test(PASS, "logo", "Pink-ball SF logo served at /logo.png"),
      country.capital
        ? test(PASS, "address.addressLocality", country.capital)
        : test(WARN, "address.addressLocality", "Add a capital/registered-office city for richer schema."),
      country.country_code
        ? test(PASS, "address.addressCountry", country.country_code)
        : test(FAIL, "address.addressCountry", "Set the ISO country code."),
      isFilled(supportEmail)
        ? test(PASS, "contactPoint.email", supportEmail)
        : test(WARN, "contactPoint.email", "Add a support email in Content → Footer."),
    ],
  };

  const FAQ = {
    name: "FAQPage schema",
    description: "schema.org/FAQPage generated from your FAQs.",
    tests: nonEmptyArray(faqs)
      ? [
          test(faqs.length >= 4 ? PASS : WARN, "FAQ count",
            `${faqs.length} questions — Google likes 4+ for rich result eligibility.`),
          faqs.every((f) => isFilled(f.q) && isFilled(f.a))
            ? test(PASS, "All FAQs complete", "Every Q + A is filled.")
            : test(FAIL, "FAQ completeness", "Some FAQs have empty question or answer."),
          test(faqs.some((f) => len(f.a) > 50) ? PASS : WARN, "Answer depth",
            "Answers should be at least one full sentence to qualify for rich results."),
        ]
      : [test(FAIL, "FAQs defined", "Add at least 1 FAQ to enable FAQPage schema.")],
  };  const BREADCRUMB = {
    name: "BreadcrumbList schema",
    description: "Single-level breadcrumb (Home → Country).",
    tests: [
      country.name
        ? test(PASS, "Item.name", country.name)
        : test(FAIL, "Item.name", "Set country name"),
      country.domain
        ? test(PASS, "Item.url", `https://${country.domain}/`)
        : test(FAIL, "Item.url", "Set domain"),
    ],
  };

  const OFFER = {
    name: "Service / Offer schema",
    description: "schema.org/Service with offers built from pricing tiers.",
    tests: nonEmptyArray(pricingTiers)
      ? [
          test(PASS, "Offer count", `${pricingTiers.length} pricing tier(s)`),
          pricingTiers.every((p) => isFilled(p.price))
            ? test(PASS, "Prices set", "All tiers have a price.")
            : test(WARN, "Prices set", "Some pricing tiers have no price."),
          country.currency
            ? test(PASS, "priceCurrency", country.currency)
            : test(FAIL, "priceCurrency", "Set currency code (e.g. GBP, RON, USD)."),
        ]
      : [test(FAIL, "Pricing set", "Add at least one pricing tier.")],
  };

  const TRACK = {
    name: "Search consoles & analytics",
    description: "Verification + measurement coverage.",
    tests: [
      isFilled(tracking.ga4_id) || isFilled(tracking.gtm_id)
        ? test(PASS, "Analytics installed", isFilled(tracking.gtm_id) ? `GTM ${tracking.gtm_id}` : `GA4 ${tracking.ga4_id}`)
        : test(FAIL, "Analytics installed", "Add GA4 ID or GTM container."),
      isFilled(tracking.google_site_verification)
        ? test(PASS, "Google Search Console", "Verification token set.")
        : test(WARN, "Google Search Console", "Add the meta token from GSC for site verification."),
      isFilled(tracking.bing_site_verification)
        ? test(PASS, "Bing Webmaster", "Verification token set.")
        : test(WARN, "Bing Webmaster", "Optional, but boosts indexing on Bing/DuckDuckGo."),
      isFilled(tracking.facebook_pixel)
        ? test(PASS, "Meta Pixel", "Installed.")
        : test(WARN, "Meta Pixel", "Optional — add if you run Facebook/Instagram ads."),
    ],
  };

  return [META, ORG, FAQ, BREADCRUMB, OFFER, TRACK];
}

/* Aggregate test stats — used in summary card. */
export function summarizeTests(groups) {
  let pass = 0, warn = 0, fail = 0, total = 0;
  groups.forEach((g) => g.tests.forEach((t) => {
    total += 1;
    if (t.status === PASS) pass += 1;
    else if (t.status === WARN) warn += 1;
    else fail += 1;
  }));
  return { pass, warn, fail, total };
}
