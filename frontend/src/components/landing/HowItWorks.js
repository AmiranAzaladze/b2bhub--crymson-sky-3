import React from "react";
import { motion } from "framer-motion";
import { Search, FileText, CreditCard, Mail } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Check your name",
    body: "Search & reserve your company name with our live Companies House lookup.",
    tag: "00:30s",
  },
  {
    n: "02",
    icon: FileText,
    title: "Add your details",
    body: "Directors, shareholders, registered office — a guided form in plain English.",
    tag: "~6 min",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Pay securely",
    body: "From £12.99 + Companies House fee. Stripe-secure. No hidden extras.",
    tag: "Instant",
  },
  {
    n: "04",
    icon: Mail,
    title: "Receive documents",
    body: "Certificate of incorporation, share certificates, statutory book — by email.",
    tag: "< 24h",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 border-b border-neutral-200" data-testid="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-8 md:gap-12 mb-16">
          <div className="md:col-span-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
              How it works
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] text-neutral-950">
              Four steps. <br />
              <span className="text-neutral-400">Under twenty minutes.</span>
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 self-end">
            <p className="text-[16px] text-neutral-600 leading-relaxed">
              No paperwork. No solicitor. No jargon. Our guided journey replaces a week of admin
              with a 20-minute online form — submitted directly to Companies House.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
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
                <s.icon className="h-4.5 w-4.5 text-neutral-700 group-hover:text-white transition-colors duration-300" />
              </div>

              <h3 className="font-display text-[20px] font-semibold text-neutral-950 mb-2 tracking-tight">
                {s.title}
              </h3>
              <p className="text-[14px] text-neutral-600 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
