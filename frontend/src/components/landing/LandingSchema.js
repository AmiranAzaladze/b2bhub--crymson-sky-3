import React from "react";

/**
 * Injects all SEO schema + hreflang link tags for the current landing.
 * Renders nothing visible — just side-effects in <head>.
 *
 * Adds:
 *  • Organization JSON-LD (entity identity)
 *  • LocalBusiness JSON-LD (address + geo + currency + phone)
 *  • BreadcrumbList JSON-LD (Home → Country)
 *  • Service JSON-LD with Offer per pricing tier
 *  • FAQPage JSON-LD if FAQs exist
 *  • hreflang link tags for every sibling-country domain
 */
export default function LandingSchema({ country, content, siblings = [] }) {
  React.useEffect(() => {
    if (!country) return;
    const url = country.domain ? `https://${country.domain}/` : window.location.origin + "/";
    const supportEmail = content?.footer?.contact_email || content?.support?.email;
    const phone = country.phone || content?.footer?.phone || null;
    const addressLine = country.address || content?.footer?.address || null;
    const faqs = (content?.faqs?.items || []).filter((f) => f.q && f.a);
    const tiers = (content?.pricing?.tiers || []).filter((t) => t.name);

    const blocks = [];

    // Organization
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: country.brand_name,
      url,
      logo: `${url}logo.png`,
      sameAs: [
        content?.footer?.social?.x,
        content?.footer?.social?.instagram,
        content?.footer?.social?.facebook,
        content?.footer?.social?.linkedin,
      ].filter(Boolean),
      contactPoint: (phone || supportEmail) ? {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: phone || undefined,
        email: supportEmail || undefined,
        areaServed: country.country_code || undefined,
        availableLanguage: [country.locale?.split("-")[0] || "en"],
      } : undefined,
    });

    // LocalBusiness — the SEOptimer killer item
    blocks.push({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${url}#localbusiness`,
      name: country.brand_name,
      url,
      image: `${url}logo.png`,
      priceRange: country.currency_symbol ? `${country.currency_symbol}${country.currency_symbol}` : "$$",
      telephone: phone || undefined,
      currenciesAccepted: country.currency || undefined,
      paymentAccepted: "Credit Card, Bank Transfer",
      address: {
        "@type": "PostalAddress",
        streetAddress: addressLine || undefined,
        addressLocality: country.capital || undefined,
        addressCountry: country.country_code || undefined,
      },
      openingHoursSpecification: [{
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      }],
    });

    // BreadcrumbList
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: country.name || country.brand_name, item: url },
      ],
    });

    // Service + Offers
    if (tiers.length) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "Service",
        name: `Company formation in ${country.name || ""}`.trim(),
        provider: { "@type": "Organization", name: country.brand_name },
        areaServed: country.country_code || country.name,
        offers: tiers.map((t) => ({
          "@type": "Offer",
          name: t.name,
          price: (t.price || "").replace(/[^0-9.]/g, "") || undefined,
          priceCurrency: country.currency || undefined,
          description: t.description || undefined,
        })),
      });
    }

    // FAQPage
    if (faqs.length) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }

    // Strip undefined values for clean JSON
    const stripped = blocks.map((b) =>
      JSON.parse(JSON.stringify(b, (_, v) => (v === undefined ? undefined : v)))
    );

    // Inject as one <script> per block
    const inserted = stripped.map((block, i) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = `seo-ld-${i}`;
      el.textContent = JSON.stringify(block);
      document.head.appendChild(el);
      return el;
    });

    // Hreflang link tags for every sibling domain
    const hreflangs = siblings.map((s) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.id = `hreflang-${s.country_code || s.slug}`;
      link.hreflang = (s.locale || "en").toLowerCase();
      link.href = `https://${s.domain}/`;
      document.head.appendChild(link);
      return link;
    });
    // x-default fallback
    if (siblings.length) {
      const xd = document.createElement("link");
      xd.rel = "alternate";
      xd.id = "hreflang-xdefault";
      xd.hreflang = "x-default";
      xd.href = url;
      document.head.appendChild(xd);
      hreflangs.push(xd);
    }

    return () => {
      inserted.forEach((el) => el.remove());
      hreflangs.forEach((el) => el.remove());
    };
  }, [country, content, siblings]);

  return null;
}
