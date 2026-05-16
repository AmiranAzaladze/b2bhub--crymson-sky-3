import React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "../ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "../../lib/Logo";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Benefits", href: "#benefits" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
];

export default function Header({ country, onCTAClick }) {
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
          <Logo
            brandName={country.brand_name}
            abbreviation={country.abbreviation}
            bg={country.brand_color}
            fg="#FFFFFF"
            size="sm"
          />
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
              className="w-full mt-2 text-white rounded-full"
              style={{ backgroundColor: country.brand_color }}
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
