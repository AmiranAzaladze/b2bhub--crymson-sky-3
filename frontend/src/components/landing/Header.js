import React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, Menu, X } from "lucide-react";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Benefits", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export default function Header({ onCTAClick }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));

  return (
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2" data-testid="logo-link">
          <div className="h-7 w-7 rounded-md bg-[#0A0A0A] grid place-items-center">
            <span className="text-white font-display font-bold text-[13px] leading-none">SF</span>
          </div>
          <span className="font-display font-bold text-[17px] tracking-tight text-neutral-950">
            Swift Formations
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
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

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#login"
            className="text-[13px] font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
            data-testid="login-link"
          >
            Sign in
          </a>
          <Button
            onClick={onCTAClick}
            className="h-9 px-4 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full text-[13px] font-medium"
            data-testid="header-cta-button"
          >
            Start now
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-neutral-950"
          data-testid="mobile-menu-toggle"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-200 bg-white" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-neutral-700 py-1.5"
              >
                {item.label}
              </a>
            ))}
            <Button
              onClick={() => {
                setOpen(false);
                onCTAClick();
              }}
              className="w-full mt-2 bg-[#0A0A0A] hover:bg-neutral-800 text-white rounded-full"
              data-testid="mobile-cta-button"
            >
              Start now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.header>
  );
}
