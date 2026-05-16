import React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

export default function HowItWorks({ data }) {
  if (!data) return null;
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 border-b border-neutral-200"
      data-testid="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              {data.eyebrow}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
              {data.title} <br />
              <span className="text-neutral-400">{data.title_secondary}</span>
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 self-end">
            <p className="text-[16px] text-neutral-600 leading-relaxed">{data.lead}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
          {(data.steps || []).map((s, i) => {
            const Icon = LucideIcons[s.icon] || LucideIcons.Sparkles;
            return (
              <motion.div
                key={s.n + s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-white p-7 md:p-8 flex flex-col group"
                data-testid={`step-${s.n}`}
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-neutral-400">
                    {s.n}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] text-neutral-500 px-2 py-1 border border-neutral-200 rounded-full">
                    {s.tag}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-lg bg-neutral-50 border border-neutral-200 grid place-items-center mb-5 group-hover:bg-[#0A0A0A] group-hover:border-[#0A0A0A] transition-colors duration-300">
                  <Icon className="h-4 w-4 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-display text-[20px] font-semibold text-neutral-950 mb-2 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-[14px] text-neutral-600 leading-relaxed">{s.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
