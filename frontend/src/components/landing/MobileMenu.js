import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, MessageCircle, Send, CalendarCheck2, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/button";
import { BrandMark } from "../../lib/Logo";
import { WHATSAPP_HREF, TELEGRAM_URL, SELF_REGISTRATION_URL } from "../../lib/channels";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Benefits", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export default function MobileMenu({ open, onClose, country, onCTAClick, onAdvisorClick }) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleNavClick = (href) => {
    onClose();
    // Defer to let the menu close animation start before scroll
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  };

  const accent = country?.accent_color || "#C8102E";
  const brand = country?.brand_color || "#0A0A0A";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] md:hidden bg-[#0A0A0A] text-white flex flex-col overflow-hidden"
          data-testid="mobile-menu"
          role="dialog"
          aria-modal="true"
        >
          {/* Ambient accent glow */}
          <div
            className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.07] mask-radial" aria-hidden="true" />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 h-16 shrink-0">
            <a
              href="#top"
              onClick={(e) => { e.preventDefault(); handleNavClick("#top"); }}
              className="flex items-center gap-2"
            >
              <BrandMark
                brandName={country?.brand_name}
                abbreviation={country?.abbreviation}
                color={brand}
                size="sm"
              />
              <span className="font-display font-bold tracking-tight text-[17px] text-white">
                {country?.brand_name}
              </span>
            </a>
            <button
              onClick={onClose}
              aria-label="Close menu"
              data-testid="mobile-menu-close"
              className="h-10 w-10 rounded-full border border-white/15 grid place-items-center hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main nav + content (scrollable if needed) */}
          <div className="relative flex-1 overflow-y-auto px-5 pb-4">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
              }}
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mt-2 mb-3"
              >
                Menu
              </motion.div>

              <nav className="space-y-0">
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-baseline gap-4 py-2.5 border-b border-white/10 hover:border-white/30 transition-colors"
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <span className="font-mono text-[11px] text-white/30 tabular-nums w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-[22px] font-bold tracking-[-0.025em] leading-tight flex-1">
                      {item.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors -translate-y-0.5" />
                  </motion.a>
                ))}
              </nav>

              {/* Primary CTA */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
                className="mt-5"
              >
                <Button
                  onClick={() => { onClose(); onCTAClick?.(); }}
                  className="w-full h-12 rounded-full text-[14px] font-medium hover:opacity-90"
                  style={{ backgroundColor: accent, color: "#fff" }}
                  data-testid="mobile-menu-cta"
                >
                  Start now
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 live-dot" />
                  Live · 1,247 formed this month
                </div>
              </motion.div>

              {/* Advisor + Portal quick actions */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
                className="mt-4 grid grid-cols-2 gap-2.5"
              >
                <button
                  type="button"
                  onClick={() => { onClose(); onAdvisorClick?.(); }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/30 transition-all text-left"
                  data-testid="mobile-menu-advisor"
                >
                  <span className="h-8 w-8 rounded-full grid place-items-center bg-sky-500/90 shrink-0">
                    <CalendarCheck2 className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="font-display font-semibold text-[14px] leading-tight">Talk to<br /><span className="font-mono text-[11px] font-normal text-white/55">Advisor</span></span>
                </button>
                <a
                  href={SELF_REGISTRATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/30 transition-all"
                  data-testid="mobile-menu-portal"
                >
                  <span className="h-8 w-8 rounded-full grid place-items-center bg-white/10 shrink-0">
                    <LayoutDashboard className="h-3.5 w-3.5 text-white" />
                  </span>
                  <span className="font-display font-semibold text-[14px] leading-tight">Self<br /><span className="font-mono text-[11px] font-normal text-white/55">registration</span></span>
                </a>
              </motion.div>

              {/* Contact channels */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
                className="mt-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-2">
                  Talk to us
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/30 transition-all"
                    data-testid="mobile-menu-whatsapp"
                  >
                    <span className="h-8 w-8 rounded-full grid place-items-center bg-[#25D366] shrink-0">
                      <MessageCircle className="h-3.5 w-3.5 text-white" />
                    </span>
                    <span className="font-display font-semibold text-[14px] leading-none">WhatsApp</span>
                  </a>
                  <a
                    href={TELEGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/30 transition-all"
                    data-testid="mobile-menu-telegram"
                  >
                    <span className="h-8 w-8 rounded-full grid place-items-center bg-[#229ED9] shrink-0">
                      <Send className="h-3.5 w-3.5 text-white -ml-0.5" />
                    </span>
                    <span className="font-display font-semibold text-[14px] leading-none">Telegram</span>
                  </a>
                </div>
              </motion.div>

              {/* Trust */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}
                className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-1.5 text-white/55">
                  <div className="flex">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} viewBox="0 0 24 24" className="h-3 w-3 fill-[#00B67A]">
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-mono">4.9/5 · 20,000+ founders</span>
                </div>
                <span className="font-mono text-white/30 uppercase tracking-[0.18em] text-[10px]">
                  © {new Date().getFullYear()} B2B Hub
                </span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
