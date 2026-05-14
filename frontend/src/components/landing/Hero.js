import React from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  Loader2,
  Shield,
  XCircle,
  Sparkles,
} from "lucide-react";

const RESERVED = ["limited", "ltd", "plc", "uk", "test", "demo", "example"];

function checkNameAvailability(name) {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, "");
  if (cleaned.length < 3) return { ok: false, reason: "Name must be at least 3 characters." };
  if (RESERVED.includes(cleaned)) return { ok: false, reason: "This name is too generic / reserved." };
  // deterministic-ish mock: if length is even -> available
  const taken = cleaned.length % 7 === 0;
  return taken
    ? { ok: false, reason: "Sorry, this name is already taken at Companies House." }
    : { ok: true };
}

export default function Hero({ onCTAClick }) {
  const [name, setName] = React.useState("");
  const [suffix, setSuffix] = React.useState("LTD");
  const [status, setStatus] = React.useState("idle"); // idle | loading | available | unavailable
  const [reason, setReason] = React.useState("");

  const handleCheck = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    setStatus("loading");
    setReason("");
    setTimeout(() => {
      const r = checkNameAvailability(name);
      if (r.ok) {
        setStatus("available");
      } else {
        setStatus("unavailable");
        setReason(r.reason);
      }
    }, 1200);
  };

  return (
    <section id="top" className="relative overflow-hidden pt-12 md:pt-20 pb-20 md:pb-28">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid mask-radial pointer-events-none" aria-hidden="true" />
      {/* subtle red accent */}
      <div
        className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-[0.07] bg-[#C8102E] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left: copy + checker */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 backdrop-blur px-3 py-1 text-[12px] font-medium text-neutral-700"
              data-testid="hero-badge"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 live-dot" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
              </span>
              ACSP Authorised · Companies House Filing Partner
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display mt-6 text-[44px] leading-[1.02] sm:text-[56px] md:text-[64px] lg:text-[72px] font-bold tracking-[-0.04em] text-neutral-950"
              data-testid="hero-headline"
            >
              Form your UK Limited Company in{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">24 hours</span>
                <span className="absolute inset-x-0 bottom-1.5 h-3 bg-[#C8102E]/15 -z-0" aria-hidden="true" />
              </span>
              .
              <br className="hidden sm:block" />
              <span className="text-neutral-400">From</span>{" "}
              <span className="font-mono align-middle">£12.99</span>
              <span className="text-neutral-400 font-display">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-xl text-[16px] md:text-[17px] leading-relaxed text-neutral-600"
              data-testid="hero-subheadline"
            >
              Fast, compliant, and fully protected. 100% online. Expert UK support
              included. Over <span className="text-neutral-950 font-semibold">15,000+ companies</span> formed.{" "}
              <span className="font-mono text-[13px] text-neutral-500"> + £50 Companies House fee.</span>
            </motion.p>

            {/* Name checker */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              onSubmit={handleCheck}
              className="mt-8 max-w-xl"
              data-testid="name-checker-form"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-neutral-500" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Free company name check
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-white border border-neutral-200 rounded-xl shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setStatus("idle");
                  }}
                  placeholder="Your company name"
                  className="flex-1 h-11 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] placeholder:text-neutral-400"
                  data-testid="name-checker-input"
                />
                <Select value={suffix} onValueChange={setSuffix}>
                  <SelectTrigger
                    className="sm:w-[120px] h-11 border-0 bg-neutral-50 rounded-lg font-mono text-[13px]"
                    data-testid="name-checker-suffix"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LTD">LTD</SelectItem>
                    <SelectItem value="LIMITED">LIMITED</SelectItem>
                    <SelectItem value="PLC">PLC</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={status === "loading" || !name.trim()}
                  className="h-11 px-5 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-lg font-medium text-[14px]"
                  data-testid="name-checker-submit"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Checking
                    </>
                  ) : (
                    <>
                      Check name
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>

              {/* Result */}
              {status === "available" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-start gap-2.5 p-3 rounded-lg border border-green-200 bg-green-50/70"
                  data-testid="name-checker-result-available"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
                  <div className="text-[13px]">
                    <span className="font-semibold text-green-900">
                      "{name.trim()} {suffix}"
                    </span>{" "}
                    <span className="text-green-800">is available at Companies House.</span>{" "}
                    <button
                      type="button"
                      onClick={onCTAClick}
                      className="font-semibold text-green-900 underline underline-offset-2"
                    >
                      Claim it now →
                    </button>
                  </div>
                </motion.div>
              )}
              {status === "unavailable" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-start gap-2.5 p-3 rounded-lg border border-neutral-200 bg-neutral-50"
                  data-testid="name-checker-result-unavailable"
                >
                  <XCircle className="h-4 w-4 text-neutral-700 mt-0.5 shrink-0" />
                  <div className="text-[13px] text-neutral-700">{reason}</div>
                </motion.div>
              )}
            </motion.form>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Button
                onClick={onCTAClick}
                className="h-12 px-6 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full text-[14px] font-medium"
                data-testid="hero-primary-cta"
              >
                Start your company now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="#pricing"
                className="h-12 px-5 inline-flex items-center text-[14px] font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
                data-testid="hero-secondary-cta"
              >
                See pricing →
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
              data-testid="hero-trust-signals"
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#00B67A] text-[#00B67A]" />
                  ))}
                </div>
                <span className="text-[12px] text-neutral-700">
                  <span className="font-semibold text-neutral-950">4.9/5</span> · Trustpilot (20,000+)
                </span>
              </div>
              <div className="h-3 w-px bg-neutral-300" />
              <div className="flex items-center gap-1.5 text-[12px] text-neutral-700">
                <Shield className="h-3.5 w-3.5" />
                <span>ACSP authorised</span>
              </div>
              <div className="h-3 w-px bg-neutral-300" />
              <span className="text-[12px] text-neutral-700">
                <span className="font-semibold text-neutral-950">1,247</span> companies formed this month
              </span>
            </motion.div>
          </div>

          {/* Right: Technical panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)]">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50/60">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  formation.live
                </span>
                <span className="font-mono text-[10px] text-green-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-dot" />
                  LIVE
                </span>
              </div>

              {/* Panel body */}
              <div className="p-5 space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                    Status
                  </div>
                  <div className="text-[15px] font-semibold text-neutral-950">
                    Filing submitted to Companies House
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "Name reservation", t: "00:01:24", done: true },
                    { label: "Director details", t: "00:03:12", done: true },
                    { label: "Share allotment", t: "00:04:30", done: true },
                    { label: "Companies House filing", t: "00:11:08", done: true },
                    { label: "Certificate of Incorporation", t: "ETA 6h", done: false },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between text-[13px] py-2 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        {s.done ? (
                          <CheckCircle2 className="h-4 w-4 text-neutral-950" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-neutral-300 grid place-items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 live-dot" />
                          </div>
                        )}
                        <span className={s.done ? "text-neutral-950" : "text-neutral-500"}>
                          {s.label}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-neutral-500">{s.t}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100">
                  <Stat label="Filings / mo" value="3,200" />
                  <Stat label="Avg. time" value="18 min" />
                  <Stat label="Success" value="99.8%" />
                </div>
              </div>
            </div>

            {/* Floating chip */}
            <div className="hidden md:flex absolute -left-6 -bottom-6 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.25)]">
              <div className="h-8 w-8 rounded-lg bg-[#C8102E]/10 grid place-items-center">
                <Shield className="h-4 w-4 text-[#C8102E]" />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  Privacy
                </div>
                <div className="text-[12px] font-semibold text-neutral-950">
                  Home address hidden
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
      {label}
    </div>
    <div className="font-display text-[18px] font-semibold text-neutral-950 mt-0.5">
      {value}
    </div>
  </div>
);
