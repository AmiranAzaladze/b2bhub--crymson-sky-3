import React from "react";
import { Twitter, Linkedin, Github, ShieldCheck } from "lucide-react";

const cols = [
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Partners", "Contact"],
  },
  {
    title: "Services",
    links: [
      "Company Formation",
      "Registered Office",
      "Service Address",
      "Confirmation Statement",
      "Dormant Company",
    ],
  },
  {
    title: "Resources",
    links: ["Founder Guide", "Tax Basics", "Companies House FAQ", "Director's duties", "Blog"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Cookies", "AML policy", "Refund policy"],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-[#FAFAFA] pt-24 md:pt-32 pb-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-7 w-7 rounded-md bg-white grid place-items-center">
                <span className="text-[#0A0A0A] font-display font-bold text-[13px] leading-none">
                  SF
                </span>
              </div>
              <span className="font-display font-bold text-[17px] tracking-tight text-white">
                Swift Formations
              </span>
            </div>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-sm">
              The fastest, most trusted way to form a UK Limited Company. ACSP authorised.
              Companies House filing partner.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-white/70">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              ACSP · ICO Registered
            </div>

            <div className="mt-8 flex items-center gap-3">
              <a
                href="#twitter"
                aria-label="Twitter"
                className="h-9 w-9 rounded-full border border-white/15 grid place-items-center hover:border-white transition-colors"
                data-testid="social-twitter"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="h-9 w-9 rounded-full border border-white/15 grid place-items-center hover:border-white transition-colors"
                data-testid="social-linkedin"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a
                href="#github"
                aria-label="GitHub"
                className="h-9 w-9 rounded-full border border-white/15 grid place-items-center hover:border-white transition-colors"
                data-testid="social-github"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {cols.map((c) => (
              <div key={c.title}>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-4">
                  {c.title}
                </div>
                <ul className="space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l}>
                      <a
                        href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-[13.5px] text-white/70 hover:text-white transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Massive brand */}
        <div className="pt-10 border-t border-white/10">
          <div
            className="font-display font-bold tracking-[-0.06em] text-white/[0.06] leading-[0.85] select-none"
            style={{ fontSize: "clamp(64px, 16vw, 240px)" }}
            aria-hidden="true"
          >
            SWIFT FORMATIONS
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-4">
          <div className="font-mono text-[11px] text-white/40 tracking-wider">
            © {new Date().getFullYear()} Swift Formations Ltd. Registered in England & Wales.
            Company No. 12345678. VAT GB123 4567 89.
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            Made in London 🇬🇧
          </div>
        </div>
      </div>
    </footer>
  );
}
