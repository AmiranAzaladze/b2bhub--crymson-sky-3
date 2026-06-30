import React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, Menu, LayoutDashboard, ChevronRight } from "lucide-react";
import Logo from "../../lib/Logo";
import MobileMenu from "./MobileMenu";
import { SELF_REGISTRATION_URL, ADVISOR_AVATAR, ADVISOR_NAME } from "../../lib/channels";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Benefits", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "#faq" },
];

export default function Header({ country, onCTAClick, onAdvisorClick }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));

  return (
    <>
      <motion.header
        data-testid="site-header"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-white/75 border-b border-neutral-200/70"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
            <Logo
              brandName={country.brand_name}
              abbreviation={country.abbreviation}
              bg={country.brand_color}
              fg="#FFFFFF"
              size="sm"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 transition-colors"
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <a
              href={SELF_REGISTRATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white text-[12.5px] font-medium text-neutral-800 hover:border-neutral-400 hover:text-neutral-950 transition-colors"
              data-testid="header-self-registration"
              title="Open your B2B Hub self-registration portal"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Portal
            </a>

            <button
              type="button"
              onClick={onAdvisorClick}
              className="group relative h-10 pl-1.5 pr-3.5 inline-flex items-center gap-2.5 rounded-full bg-neutral-950 text-white border border-neutral-950 hover:bg-neutral-900 transition-all duration-200 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.55)] hover:-translate-y-0.5"
              data-testid="header-advisor-button"
              aria-label={`Talk to ${ADVISOR_NAME}, our formations advisor`}
            >
              <span className="relative inline-block shrink-0">
                <img
                  src={ADVISOR_AVATAR}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/15 group-hover:ring-white/30 transition-all"
                />
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-neutral-950" />
                </span>
              </span>

              <span className="flex flex-col items-start leading-none">
                <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-white/55 mb-0.5">
                  Free · 30 min
                </span>
                <span className="font-display text-[13px] font-semibold text-white tracking-tight">
                  Talk to {ADVISOR_NAME}
                </span>
              </span>

              <ChevronRight
                className="h-3.5 w-3.5 text-white/55 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
              />
            </button>

            <Button
              onClick={onCTAClick}
              className="h-9 px-4 text-white rounded-full text-[13px] font-medium hover:opacity-90"
              style={{ backgroundColor: country.brand_color }}
              data-testid="header-cta-button"
            >
              Start now
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Mobile-only compact advisor button — sits to the LEFT of the hamburger so
              the avatar is one of the first things a thumb reaches on small screens. */}
          <button
            type="button"
            onClick={onAdvisorClick}
            className="md:hidden ml-auto group relative h-9 pl-1 pr-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-950 text-white shadow-[0_8px_18px_-10px_rgba(0,0,0,0.55)] active:scale-95 transition-transform"
            data-testid="mobile-header-advisor-button"
            aria-label={`Talk to ${ADVISOR_NAME}`}
          >
            <span className="relative inline-block shrink-0">
              <img
                src={ADVISOR_AVATAR}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 ring-2 ring-neutral-950" />
              </span>
            </span>
            <span className="font-display text-[12px] font-semibold tracking-tight">Advisor</span>
          </button>

          <button
            onClick={() => setOpen(true)}
            className="md:hidden h-10 w-10 grid place-items-center rounded-full hover:bg-neutral-100 transition-colors"
            data-testid="mobile-menu-toggle"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-neutral-950" />
          </button>
        </div>
      </motion.header>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        country={country}
        onCTAClick={onCTAClick}
        onAdvisorClick={onAdvisorClick}
      />
    </>
  );
}
