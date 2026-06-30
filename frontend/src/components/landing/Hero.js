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
  Users,
  XCircle,
} from "lucide-react";
import { trackNameCheck } from "../../lib/analytics";

const ICONS = { Star, Shield, Users };
const RESERVED = ["limited", "ltd", "plc", "uk", "test", "demo", "example"];

function checkNameAvailability(name) {
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, "");
  if (cleaned.length < 3) return { ok: false, reason: "Name must be at least 3 characters." };
  if (RESERVED.includes(cleaned)) return { ok: false, reason: "This name is too generic / reserved." };
  const taken = cleaned.length % 7 === 0;
  return taken
    ? { ok: false, reason: "Sorry, this name is already taken." }
    : { ok: true };
}

export default function Hero({ country, hero, b2bhub, onCTAClick }) {
  const [name, setName] = React.useState("");
  const [suffix, setSuffix] = React.useState((b2bhub?.company_types?.[0] || "LTD"));
  const [status, setStatus] = React.useState("idle");
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
        trackNameCheck("available");
      } else {
        setStatus("unavailable");
        setReason(r.reason);
        trackNameCheck("unavailable");
      }
    }, 1100);
  };

  const suffixOptions =
    b2bhub?.company_types && b2bhub.company_types.length
      ? b2bhub.company_types
      : ["LTD", "LIMITED", "PLC"];

  return (
    <section id="top" className="relative overflow-hidden pt-12 md:pt-20 pb-20 md:pb-28">
      <div className="absolute inset-0 bg-grid mask-radial pointer-events-none" aria-hidden="true" />
      <div
        className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: country.accent_color }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display mt-2 text-[40px] leading-[1.02] sm:text-[52px] md:text-[60px] lg:text-[68px] font-bold tracking-[-0.04em] text-neutral-950"
              data-testid="hero-headline"
            >
              {hero.headline_prefix}{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">{hero.headline_highlight}</span>
                <span
                  className="absolute inset-x-0 bottom-1.5 h-3 -z-0"
                  style={{ backgroundColor: `${country.accent_color}26` }}
                  aria-hidden="true"
                />
              </span>
              .
              <br className="hidden sm:block" />
              <span className="text-neutral-400">{hero.headline_suffix}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 max-w-xl text-[16px] md:text-[17px] leading-relaxed text-neutral-600"
              data-testid="hero-subheadline"
            >
              {hero.sub}{" "}
              <span className="font-mono text-[13px] text-neutral-500">{hero.fee_note}</span>
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              onSubmit={handleCheck}
              className="mt-8 max-w-xl"
              data-testid="name-checker-form"
            >
              <div className="flex items-center gap-2 mb-2">
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
                    className="sm:w-[130px] h-11 border-0 bg-neutral-50 rounded-lg font-mono text-[13px]"
                    data-testid="name-checker-suffix"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {suffixOptions.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={status === "loading" || !name.trim()}
                  className="h-11 px-5 text-white rounded-lg font-medium text-[14px] hover:opacity-90"
                  style={{ backgroundColor: country.brand_color }}
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
                    <span className="text-green-800">is available.</span>{" "}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              <Button
                onClick={onCTAClick}
                className="h-12 px-6 text-white rounded-full text-[14px] font-medium hover:opacity-90"
                style={{ backgroundColor: country.brand_color }}
                data-testid="hero-primary-cta"
              >
                {hero.cta_primary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="#pricing"
                className="h-12 px-5 inline-flex items-center text-[14px] font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
                data-testid="hero-secondary-cta"
              >
                {hero.cta_secondary} →
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
              data-testid="hero-trust-signals"
            >
              {(hero.trust_chips || []).map((chip, i) => {
                const Icon = ICONS[chip.icon] || Shield;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="h-3 w-px bg-neutral-300" />}
                    <div className="flex items-center gap-1.5 text-[12px] text-neutral-700">
                      {chip.icon === "Star" ? (
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className="h-3.5 w-3.5 fill-[#00B67A] text-[#00B67A]" />
                          ))}
                        </div>
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                      <span>{chip.text}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)]">
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

              <div className="p-5 space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 mb-1.5">
                    Status
                  </div>
                  <div className="text-[15px] font-semibold text-neutral-950">
                    Filing submitted to {country.authority_name}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(hero.panel_steps || []).map((s) => (
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
                  {(hero.stats || []).map((st) => (
                    <Stat key={st.label} label={st.label} value={st.value} />
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden md:flex absolute -left-6 -bottom-6 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.25)]">
              <div
                className="h-8 w-8 rounded-lg grid place-items-center"
                style={{ backgroundColor: `${country.accent_color}1a` }}
              >
                <Shield className="h-4 w-4" style={{ color: country.accent_color }} />
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
