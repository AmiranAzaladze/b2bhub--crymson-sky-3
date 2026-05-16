import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Check, ArrowRight, Star } from "lucide-react";

export default function Pricing({ data, country, onCTAClick }) {
  if (!data) return null;
  return (
    <section
      id="pricing"
      className="py-24 md:py-32 border-b border-neutral-200"
      data-testid="pricing-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8 mb-14">
          <div className="md:col-span-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              {data.eyebrow}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
              {data.title} <br />
              <span className="text-neutral-400">{data.title_secondary}</span>
            </h2>
          </div>
          <div className="md:col-span-5 self-end">
            <p className="text-[16px] text-neutral-600 leading-relaxed">{data.lead}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {(data.tiers || []).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl border p-7 md:p-8 flex flex-col ${
                t.inverse
                  ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                  : "bg-white border-neutral-200 text-neutral-950"
              }`}
              data-testid={`pricing-tier-${t.id}`}
            >
              {t.popular && (
                <div
                  className="absolute -top-3 left-7 inline-flex items-center gap-1 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight"
                  style={{ backgroundColor: country.accent_color }}
                >
                  <Star className="h-3 w-3 fill-white" />
                  Most popular
                </div>
              )}

              <div>
                <h3 className="font-display text-[22px] font-semibold tracking-tight">{t.name}</h3>
                <p className={`text-[13px] mt-1 ${t.inverse ? "text-neutral-400" : "text-neutral-500"}`}>
                  {t.tagline}
                </p>
              </div>

              <div className="mt-6 mb-6">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-display text-[14px] ${t.inverse ? "text-neutral-400" : "text-neutral-500"}`}
                  >
                    {country.currency_symbol}
                  </span>
                  <span className="font-display text-[48px] font-bold tracking-tighter leading-none">
                    {t.price}
                  </span>
                  <span className={`font-mono text-[11px] ml-1 ${t.inverse ? "text-neutral-500" : "text-neutral-400"}`}>
                    one-off
                  </span>
                </div>
                <div className={`font-mono text-[11px] mt-1.5 ${t.inverse ? "text-neutral-500" : "text-neutral-500"}`}>
                  {t.fee}
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {(t.features || []).map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13.5px]">
                    <Check
                      className={`h-4 w-4 mt-0.5 shrink-0 ${t.inverse ? "text-white" : "text-neutral-950"}`}
                    />
                    <span className={t.inverse ? "text-neutral-200" : "text-neutral-700"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={onCTAClick}
                className={`h-11 rounded-full text-[13.5px] font-medium w-full ${
                  t.inverse
                    ? "bg-white hover:bg-neutral-200 text-neutral-950"
                    : "text-white hover:opacity-90"
                }`}
                style={t.inverse ? {} : { backgroundColor: country.brand_color }}
                data-testid={`pricing-cta-${t.id}`}
              >
                {t.cta}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
          {data.footnote}
        </div>
      </div>
    </section>
  );
}
