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
/* SEO TESTS — structured tests with pass/warn/fail + "Fix this" jump  */
/* ------------------------------------------------------------------ */
const PASS = "pass", WARN = "warn", FAIL = "fail";
const t_ = (status, label, details, fix) => ({ status, label, details, fix });

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
        ? (len(t) > 60 ? t_(WARN, "Title length", `${len(t)} chars — Google truncates after ~60.`, { tab: "seo" })
          : len(t) < 30 ? t_(WARN, "Title length", `${len(t)} chars — usually 30–60 is ideal.`, { tab: "seo" })
          : t_(PASS, "Title length", `${len(t)} chars.`))
        : t_(FAIL, "Title set", "Empty — set a unique <title>.", { tab: "seo" }),
      isFilled(d)
        ? (len(d) > 160 ? t_(WARN, "Description length", `${len(d)} chars — Google truncates after ~160.`, { tab: "seo" })
          : len(d) < 110 ? t_(WARN, "Description length", `${len(d)} chars — aim for 110–160.`, { tab: "seo" })
          : t_(PASS, "Description length", `${len(d)} chars.`))
        : t_(FAIL, "Description set", "Empty — set a unique meta description.", { tab: "seo" }),
      country.domain
        ? t_(PASS, "Canonical domain", country.domain)
        : t_(FAIL, "Canonical domain", "Set a custom domain so each landing has a stable canonical.", { tab: "general" }),
    ],
  };

  const ORG = {
    name: "Organization schema",
    description: "schema.org/Organization injected for the tenant.",
    tests: [
      country.brand_name ? t_(PASS, "name", country.brand_name) : t_(FAIL, "name", "Brand name missing", { tab: "general" }),
      country.domain ? t_(PASS, "url", `https://${country.domain}/`) : t_(FAIL, "url", "Domain missing → no canonical URL", { tab: "general" }),
      t_(PASS, "logo", "Pink-ball SF logo served at /logo.png"),
      country.capital
        ? t_(PASS, "address.addressLocality", country.capital)
        : t_(WARN, "address.addressLocality", "Add a capital/registered-office city for richer schema.", { tab: "general" }),
      country.country_code
        ? t_(PASS, "address.addressCountry", country.country_code)
        : t_(FAIL, "address.addressCountry", "Set the ISO country code.", { tab: "general" }),
      isFilled(supportEmail)
        ? t_(PASS, "contactPoint.email", supportEmail)
        : t_(WARN, "contactPoint.email", "Add a support email in Content → Footer.", { tab: "content" }),
    ],
  };

  const FAQ = {
    name: "FAQPage schema",
    description: "schema.org/FAQPage generated from your FAQs.",
    tests: nonEmptyArray(faqs)
      ? [
          t_(faqs.length >= 4 ? PASS : WARN, "FAQ count",
            `${faqs.length} questions — Google likes 4+ for rich result eligibility.`,
            faqs.length < 4 ? { tab: "content" } : undefined),
          faqs.every((f) => isFilled(f.q) && isFilled(f.a))
            ? t_(PASS, "All FAQs complete", "Every Q + A is filled.")
            : t_(FAIL, "FAQ completeness", "Some FAQs have empty question or answer.", { tab: "content" }),
          t_(faqs.some((f) => len(f.a) > 50) ? PASS : WARN, "Answer depth",
            "Answers should be at least one full sentence to qualify for rich results.",
            faqs.some((f) => len(f.a) > 50) ? undefined : { tab: "content" }),
        ]
      : [t_(FAIL, "FAQs defined", "Add at least 1 FAQ to enable FAQPage schema.", { tab: "content" })],
  };

  const BREADCRUMB = {
    name: "BreadcrumbList schema",
    description: "Single-level breadcrumb (Home → Country).",
    tests: [
      country.name ? t_(PASS, "Item.name", country.name) : t_(FAIL, "Item.name", "Set country name", { tab: "general" }),
      country.domain ? t_(PASS, "Item.url", `https://${country.domain}/`) : t_(FAIL, "Item.url", "Set domain", { tab: "general" }),
    ],
  };

  const OFFER = {
    name: "Service / Offer schema",
    description: "schema.org/Service with offers built from pricing tiers.",
    tests: nonEmptyArray(pricingTiers)
      ? [
          t_(PASS, "Offer count", `${pricingTiers.length} pricing tier(s)`),
          pricingTiers.every((p) => isFilled(p.price))
            ? t_(PASS, "Prices set", "All tiers have a price.")
            : t_(WARN, "Prices set", "Some pricing tiers have no price.", { tab: "content" }),
          country.currency
            ? t_(PASS, "priceCurrency", country.currency)
            : t_(FAIL, "priceCurrency", "Set currency code (e.g. GBP, RON, USD).", { tab: "general" }),
        ]
      : [t_(FAIL, "Pricing set", "Add at least one pricing tier.", { tab: "content" })],
  };

  const TRACK = {
    name: "Search consoles & analytics",
    description: "Verification + measurement coverage.",
    tests: [
      isFilled(tracking.ga4_id) || isFilled(tracking.gtm_id)
        ? t_(PASS, "Analytics installed", isFilled(tracking.gtm_id) ? `GTM ${tracking.gtm_id}` : `GA4 ${tracking.ga4_id}`)
        : t_(FAIL, "Analytics installed", "Add GA4 ID or GTM container.", { tab: "tracking" }),
      isFilled(tracking.google_site_verification)
        ? t_(PASS, "Google Search Console", "Verification token set.")
        : t_(WARN, "Google Search Console", "Add the meta token from GSC for site verification.", { tab: "tracking" }),
      isFilled(tracking.bing_site_verification)
        ? t_(PASS, "Bing Webmaster", "Verification token set.")
        : t_(WARN, "Bing Webmaster", "Optional, but boosts indexing on Bing/DuckDuckGo.", { tab: "tracking" }),
      isFilled(tracking.facebook_pixel)
        ? t_(PASS, "Meta Pixel", "Installed.")
        : t_(WARN, "Meta Pixel", "Optional — add if you run Facebook/Instagram ads.", { tab: "tracking" }),
    ],
  };

  return [META, ORG, FAQ, BREADCRUMB, OFFER, TRACK];
}

/* Aggregate test stats — used in summary card. */
export function summarizeTests(groups) {
  let pass = 0, warn = 0, fail = 0, total = 0;
  groups.forEach((g) => g.tests.forEach((tt) => {
    total += 1;
    if (tt.status === PASS) pass += 1;
    else if (tt.status === WARN) warn += 1;
    else fail += 1;
  }));
  return { pass, warn, fail, total };
}

/* ------------------------------------------------------------------ */
/* JSON-LD GENERATORS — exactly what Google will see                   */
/* ------------------------------------------------------------------ */
export function buildJsonLd(country = {}, content = {}) {
  const url = country.domain ? `https://${country.domain}/` : null;
  const faqs = (content?.faqs?.items || []).filter((f) => isFilled(f.q) && isFilled(f.a));
  const tiers = (content?.pricing?.tiers || []).filter((p) => isFilled(p.name));
  const supportEmail = content?.footer?.contact_email || content?.support?.email;

  const blocks = [];

  blocks.push({
    name: "Organization",
    json: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: country.brand_name || undefined,
      url: url || undefined,
      logo: url ? `${url}logo.png` : undefined,
      address: (country.capital || country.country_code) ? {
        "@type": "PostalAddress",
        addressLocality: country.capital || undefined,
        addressCountry: country.country_code || undefined,
      } : undefined,
      contactPoint: supportEmail ? {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: supportEmail,
      } : undefined,
    },
  });

  blocks.push({
    name: "BreadcrumbList",
    json: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url || undefined },
        { "@type": "ListItem", position: 2, name: country.name || country.brand_name || "Country", item: url || undefined },
      ],
    },
  });

  if (faqs.length) {
    blocks.push({
      name: "FAQPage",
      json: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    });
  }

  if (tiers.length) {
    blocks.push({
      name: "Service",
      json: {
        "@context": "https://schema.org",
        "@type": "Service",
        name: `Company formation in ${country.name || country.brand_name || ""}`.trim(),
        provider: country.brand_name ? { "@type": "Organization", name: country.brand_name } : undefined,
        areaServed: country.country_code || country.name || undefined,
        offers: tiers.map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: (p.price || "").replace(/[^0-9.]/g, "") || undefined,
          priceCurrency: country.currency || undefined,
          description: p.description || undefined,
        })),
      },
    });
  }

  // Strip undefined keys recursively for clean output
  return blocks.map((b) => ({ ...b, json: stripUndefined(b.json) }));
}

function stripUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj && typeof obj === "object") {
    const out = {};
    Object.keys(obj).forEach((k) => {
      const v = stripUndefined(obj[k]);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }
  return obj;
}

/* ------------------------------------------------------------------ */
/* SERP snippet — what Google would actually display                   */
/* ------------------------------------------------------------------ */
export function buildSerpPreview(country = {}, content = {}) {
  const hero = content?.hero || {};
  const heroHeadline = [hero.headline_prefix, hero.headline_highlight, hero.headline_suffix].filter(Boolean).join(" ").trim();
  const title = (content?.seo?.title || heroHeadline || country.brand_name || "Untitled page").slice(0, 65);
  const description = (content?.seo?.description || hero.sub || "").slice(0, 165);
  const domain = country.domain || "yourdomain.com";
  return { title, description, domain, url: `https://${domain}/` };
}
