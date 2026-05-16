import React from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
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
import LeadDialog from "../components/landing/LeadDialog";

export default function Landing() {
  const { slug } = useParams();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [leadOpen, setLeadOpen] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenantParam = slug || params.get("tenant");
    const host = window.location.hostname;
    const query = tenantParam ? `tenant=${tenantParam}` : `host=${encodeURIComponent(host)}`;
    api
      .get(`/public/landing?${query}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load"));
  }, [slug]);

  // Update document title + meta description per-country (basic SEO)
  React.useEffect(() => {
    if (!data) return;
    const t = data?.content?.seo?.title;
    const d = data?.content?.seo?.description;
    if (t) document.title = t;
    if (d) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", d);
    }
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
  const openLead = () => setLeadOpen(true);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-body" data-testid="landing-page">
      <Header country={country} onCTAClick={openLead} />
      <main>
        <Hero country={country} hero={content.hero} b2bhub={b2bhub} onCTAClick={openLead} />
        <TrustBar trustBar={content.trust_bar} />
        <HowItWorks data={content.how_it_works} />
        <Pricing data={content.pricing} country={country} onCTAClick={openLead} />
        <Benefits data={content.benefits} />
        <Testimonials data={content.testimonials} />
        <FAQ data={content.faqs} />
        <FinalCTA data={content.final_cta} onCTAClick={openLead} />
      </main>
      <Footer country={country} data={content.footer} />
      <LeadDialog open={leadOpen} onOpenChange={setLeadOpen} country={country} />
    </div>
  );
}
