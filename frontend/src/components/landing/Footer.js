import React from "react";
import { Linkedin, Heart, Instagram, Facebook } from "lucide-react";
import { BrandMark } from "../../lib/Logo";

// X (Twitter) icon — official rebrand. Lucide doesn't ship it yet, so inline SVG.
const XIcon = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
    <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.91l-4.91-6.39L5.4 22H2.144l8.01-9.15L1.5 2h7.09l4.43 5.86L18.244 2Zm-1.21 18h1.91L7.06 4H5.04l11.994 16Z" />
  </svg>
);

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
                <BrandMark brandName={country.brand_name} size="sm" />
                <span className="font-display font-bold text-[17px] tracking-tight text-white">
                  {country.brand_name}
                </span>
              </div>
            </div>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-sm">{data.tagline}</p>

            <div className="mt-8 flex items-center gap-3">
              {[
                { Icon: XIcon, key: "x", label: "X (Twitter)", url: data?.social?.x },
                { Icon: Instagram, key: "instagram", label: "Instagram", url: data?.social?.instagram },
                { Icon: Facebook, key: "facebook", label: "Facebook", url: data?.social?.facebook },
                { Icon: Linkedin, key: "linkedin", label: "LinkedIn", url: data?.social?.linkedin },
              ]
                .filter(({ url }) => url && url.trim())
                .map(({ Icon, key, label, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-9 w-9 rounded-full border border-white/15 grid place-items-center hover:border-white hover:bg-white/[0.04] transition-all"
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

        <div
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-8 text-[12px] sm:text-[13px] text-white/55 text-center"
          data-testid="footer-copyright"
        >
          <span>© {year} All rights reserved, B2B Hub Ltd.</span>
          <span className="text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            Made with
            <Heart
              className="h-3.5 w-3.5 fill-[#ff3b5c] text-[#ff3b5c] heartbeat"
              aria-label="love"
              data-testid="footer-heart"
            />
            by
            <a
              href="https://b2bhub.ltd"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:underline underline-offset-2 font-medium"
              data-testid="footer-b2bhub-link"
            >
              b2bhub.ltd
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
