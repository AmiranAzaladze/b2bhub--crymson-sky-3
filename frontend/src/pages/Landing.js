import React from "react";
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
  const [leadOpen, setLeadOpen] = React.useState(false);

  const openLead = React.useCallback(() => setLeadOpen(true), []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] font-body" data-testid="landing-page">
      <Header onCTAClick={openLead} />
      <main>
        <Hero onCTAClick={openLead} />
        <TrustBar />
        <HowItWorks />
        <Pricing onCTAClick={openLead} />
        <Benefits />
        <Testimonials />
        <FAQ />
        <FinalCTA onCTAClick={openLead} />
      </main>
      <Footer />
      <LeadDialog open={leadOpen} onOpenChange={setLeadOpen} />
    </div>
  );
}
