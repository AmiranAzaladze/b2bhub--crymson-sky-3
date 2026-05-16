import React from "react";
import { Twitter, Linkedin, Github, ShieldCheck } from "lucide-react";
import Logo from "../../lib/Logo";

export default function Footer({ country, data }) {
  if (!data) return null;
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0A0A0A] text-[#FAFAFA] pt-24 md:pt-32 pb-10" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-4">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-md grid place-items-center"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <span
                    className="font-display font-bold text-[13px] leading-none"
                    style={{ color: country.brand_color }}
                  >
                    {country.abbreviation}
                  </span>
                </div>
                <span className="font-display font-bold text-[17px] tracking-tight text-white">
                  {country.brand_name}
                </span>
              </div>
            </div>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-sm">{data.tagline}</p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-white/70">
              <ShieldCheck className="h-3 w-3 text-green-400" />
              {data.badge_text}
            </div>

            <div className="mt-8 flex items-center gap-3">
              {[
                { Icon: Twitter, key: "twitter" },
                { Icon: Linkedin, key: "linkedin" },
                { Icon: Github, key: "github" },
              ].map(({ Icon, key }) => (
                <a
                  key={key}
                  href={`#${key}`}
                  aria-label={key}
                  className="h-9 w-9 rounded-full border border-white/15 grid place-items-center hover:border-white transition-colors"
                  data-testid={`social-${key}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {(data.columns || []).map((c) => (
              <div key={c.title}>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 mb-4">
                  {c.title}
                </div>
                <ul className="space-y-2.5">
                  {(c.links || []).map((l) => (
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

        <div className="pt-10 border-t border-white/10">
          <div
            className="font-display font-bold tracking-[-0.06em] text-white/[0.06] leading-[0.85] select-none break-all"
            style={{ fontSize: "clamp(64px, 14vw, 200px)" }}
            aria-hidden="true"
          >
            {country.brand_name.toUpperCase()}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 gap-4">
          <div className="font-mono text-[11px] text-white/40 tracking-wider">
            {(data.legal || "").replace("{year}", year)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
            {data.made_in}
          </div>
        </div>
      </div>
    </footer>
  );
}
