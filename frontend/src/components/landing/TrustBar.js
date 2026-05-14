import React from "react";
import { Landmark, Banknote, FileCheck2, ShieldCheck, Building2, Award } from "lucide-react";

const partners = [
  { icon: Landmark, label: "Companies House" },
  { icon: Banknote, label: "Tide Bank" },
  { icon: Banknote, label: "Wise Business" },
  { icon: FileCheck2, label: "FreeAgent" },
  { icon: ShieldCheck, label: "ACSP Authorised" },
  { icon: Building2, label: "Stripe" },
  { icon: Award, label: "B Corp" },
];

export default function TrustBar() {
  const items = [...partners, ...partners];
  return (
    <section className="border-y border-neutral-200 bg-white" data-testid="trust-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Trusted by founders & partners
          </span>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-400">
            15,247 active companies
          </span>
        </div>

        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="marquee-track flex gap-12 whitespace-nowrap">
            {items.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 shrink-0 text-neutral-500 hover:text-neutral-950 transition-colors"
              >
                <p.icon className="h-4 w-4" />
                <span className="font-display font-semibold text-[15px] tracking-tight">
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
