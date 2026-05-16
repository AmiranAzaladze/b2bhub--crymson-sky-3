import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, Timer } from "lucide-react";

export default function FinalCTA({ data, onCTAClick }) {
  const [t, setT] = React.useState({ h: 23, m: 47, s: 12 });

  React.useEffect(() => {
    const id = setInterval(() => {
      setT((p) => {
        let { h, m, s } = p;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  if (!data) return null;

  return (
    <section className="py-24 md:py-32" data-testid="final-cta-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl bg-[#0A0A0A] text-white overflow-hidden p-10 md:p-16 lg:p-20"
        >
          <div className="absolute inset-0 bg-grid-dark opacity-60 mask-radial pointer-events-none" />
          <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-30 bg-[#C8102E] pointer-events-none" />

          <div className="relative grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur px-3 py-1 text-[11.5px] font-mono uppercase tracking-[0.18em] text-white/70">
                <Timer className="h-3 w-3" />
                {data.eyebrow}
              </div>
              <h2 className="font-display mt-5 text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[1.02]">
                {data.headline} <br />
                <span className="text-white/50">{data.headline_secondary}</span>
              </h2>
              <p className="mt-5 text-[16px] text-white/70 max-w-xl leading-relaxed">{data.sub}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={onCTAClick}
                  className="h-12 px-6 bg-white hover:bg-neutral-200 text-neutral-950 rounded-full text-[14px] font-medium"
                  data-testid="final-cta-button"
                >
                  {data.cta_primary}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <a
                  href="#pricing"
                  className="h-12 px-5 inline-flex items-center text-[14px] font-medium text-white/80 hover:text-white"
                  data-testid="final-cta-secondary"
                >
                  {data.cta_secondary} →
                </a>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 mb-4">
                  Offer ends in
                </div>
                <div className="grid grid-cols-3 gap-3" data-testid="countdown">
                  {[
                    { v: pad(t.h), l: "Hours" },
                    { v: pad(t.m), l: "Minutes" },
                    { v: pad(t.s), l: "Seconds" },
                  ].map((b) => (
                    <div key={b.l} className="rounded-xl border border-white/10 bg-black/40 p-3 text-center">
                      <div className="font-display text-[34px] md:text-[40px] font-bold tracking-tighter leading-none tabular-nums">
                        {b.v}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mt-2">
                        {b.l}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {(data.chips || []).map((c) => (
                    <Mini key={c.l} v={c.v} l={c.l} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const Mini = ({ v, l }) => (
  <div>
    <div className="font-display text-[16px] font-semibold text-white">{v}</div>
    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 mt-1">{l}</div>
  </div>
);
