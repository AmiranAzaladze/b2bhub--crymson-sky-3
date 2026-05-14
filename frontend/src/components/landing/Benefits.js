import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ShieldCheck,
  Globe,
  Headphones,
  Building2,
  FileCheck,
  Banknote,
  Sparkles,
} from "lucide-react";

const items = [
  {
    icon: Clock,
    title: "24-hour formation",
    body: "Most companies registered same-day. Average filing time: 18 minutes after submission.",
    cls: "md:col-span-7",
    stat: { v: "18m", l: "avg filing" },
  },
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "Hide your home address from the public record with our London registered office.",
    cls: "md:col-span-5",
  },
  {
    icon: Globe,
    title: "Open to non-UK residents",
    body: "No UK address or visa required. We serve founders from 80+ countries.",
    cls: "md:col-span-4",
  },
  {
    icon: Headphones,
    title: "UK-based human support",
    body: "Real advisors in London. Email, phone, live chat — for the life of your company.",
    cls: "md:col-span-4",
  },
  {
    icon: FileCheck,
    title: "Always compliant",
    body: "Confirmation Statement reminders, director-change filings, free for the first year.",
    cls: "md:col-span-4",
  },
  {
    icon: Banknote,
    title: "Banking & accounting",
    body: "Free intros to Tide, Wise, Revolut Business + 1 month free FreeAgent accounting.",
    cls: "md:col-span-7",
    stat: { v: "0", l: "monthly fees" },
  },
  {
    icon: Building2,
    title: "Lifetime company support",
    body: "Address changes, share transfers, dormant filings — all in one dashboard.",
    cls: "md:col-span-5",
  },
];

export default function Benefits() {
  return (
    <section id="benefits" className="py-24 md:py-32 border-b border-neutral-200" data-testid="benefits-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8 mb-14">
          <div className="md:col-span-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              Why founders choose us
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
              Built for builders. <br />
              <span className="text-neutral-400">Compliance, on autopilot.</span>
            </h2>
          </div>
          <div className="md:col-span-5 self-end">
            <p className="text-[16px] text-neutral-600 leading-relaxed">
              We're not just a filing service — we're the operational backbone for thousands of
              UK companies. Privacy, compliance, banking and support, in one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {items.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`col-span-1 ${b.cls} rounded-2xl border border-neutral-200 bg-white p-6 md:p-7 flex flex-col group hover:border-neutral-950 transition-colors duration-300`}
              data-testid={`benefit-${i}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="h-9 w-9 rounded-lg bg-neutral-50 border border-neutral-200 grid place-items-center group-hover:bg-[#0A0A0A] group-hover:border-[#0A0A0A] transition-colors duration-300">
                  <b.icon className="h-4 w-4 text-neutral-700 group-hover:text-white transition-colors duration-300" />
                </div>
                {b.stat && (
                  <div className="text-right">
                    <div className="font-display text-[22px] font-bold tracking-tighter text-neutral-950 leading-none">
                      {b.stat.v}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-500 mt-1">
                      {b.stat.l}
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-display text-[19px] font-semibold tracking-tight text-neutral-950 mb-1.5">
                {b.title}
              </h3>
              <p className="text-[14px] text-neutral-600 leading-relaxed">{b.body}</p>
            </motion.div>
          ))}

          {/* CTA bento */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="col-span-1 md:col-span-12 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A] text-white p-7 md:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            data-testid="benefits-cta"
          >
            <div className="flex items-center gap-4">
              <Sparkles className="h-5 w-5 text-white shrink-0" />
              <div>
                <div className="font-display text-[20px] md:text-[24px] font-semibold tracking-tight">
                  Start trading in days, not weeks.
                </div>
                <div className="text-[13.5px] text-neutral-400 mt-1">
                  Join 15,000+ UK companies built on Swift Formations.
                </div>
              </div>
            </div>
            <a
              href="#pricing"
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-white underline underline-offset-4 hover:text-neutral-300"
            >
              See pricing →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
