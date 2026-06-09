import React from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { trackLeadOpen } from "../lib/analytics";
import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import TrustBar from "../components/landing/TrustBar";
import HowItWorks from "../components/landing/HowItWorks";
import Pricing from "../components/landing/Pricing";
import Benefits from "../components/landing/Benefits";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import FinalCTA from "../components/landing/FinalCTA";
import Footer from "../components/landing/Footer";
import LiveChat from "../components/landing/LiveChat";
import TrackingTags from "../components/landing/TrackingTags";
import BlogSection from "../components/landing/BlogSection";

const B2BHUB_URL = "https://b2bhub.ltd";

export default function Landing() {
  const { slug } = useParams();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Resolution priority:
    // 1. Build-time bake (REACT_APP_TENANT)   → for per-site Netlify deploys
    // 2. URL slug                             → /preview/:slug
    // 3. ?tenant= query param                 → manual override
    // 4. Hostname                             → multi-domain single-deploy mode
    const bakedTenant = process.env.REACT_APP_TENANT;
    const tenantParam = bakedTenant || slug || params.get("tenant");
    const host = window.location.hostname;
    const query = tenantParam ? `tenant=${tenantParam}` : `host=${encodeURIComponent(host)}`;
    api
      .get(`/public/landing?${query}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load"));
  }, [slug]);

  // Dynamic per-domain SEO tags (title, description, canonical, OG/Twitter)
  // Must be called before any early returns to respect Rules of Hooks.
  React.useEffect(() => {
    if (!data) return;
    const country = data.country || {};
    const content = data.content || {};
    const seo = content.seo || {};
    const title = seo.title || `${country.brand_name || ""} — Register a ${country.name || ""} company in 24 hours`;
    const description = seo.description || "";
    const domain = country.domain || window.location.hostname;
    const canonical = `https://${domain}/`;

    document.title = title;

    const setMeta = (key, val, attr = "name") => {
      if (!val) return;
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", country.brand_name || "", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
    link.setAttribute("href", canonical);
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-2">
            Error
          </div>
          <h1 className="font-display text-2xl font-bold">{error}</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            Open <code>?tenant=uk</code> to preview a specific country.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFA]">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
          loading…
        </div>
      </div>
    );
  }

  const { country, content, b2bhub } = data;

  const openLead = () => {
    trackLeadOpen("redirect-b2bhub");
    window.open(B2BHUB_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-body" data-testid="landing-page">
      <TrackingTags tracking={content.tracking} scope={country.slug} />
      <Header country={country} onCTAClick={openLead} />
      <main>
        <Hero country={country} hero={content.hero} b2bhub={b2bhub} onCTAClick={openLead} />
        <TrustBar trustBar={content.trust_bar} />
        <HowItWorks data={content.how_it_works} />
        <Pricing data={content.pricing} country={country} onCTAClick={openLead} />
        <Benefits data={content.benefits} />
        <Testimonials data={content.testimonials} />
        <FAQ data={content.faqs} />
        <BlogSection country={country} tenant={slug} />
        <FinalCTA data={content.final_cta} onCTAClick={openLead} />
      </main>
      <Footer country={country} data={content.footer} />
      <LiveChat />
    </div>
  );
}
