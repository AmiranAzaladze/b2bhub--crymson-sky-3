import React from "react";

/**
 * Generates a 2-letter abbreviation from a brand name.
 * Mirrors backend logic for consistency.
 */
const STOP_WORDS = new Set(["the", "of", "and", "ltd", "limited", "inc", "co", "uk"]);

export function autoAbbreviation(name = "") {
  if (!name.trim()) return "SF";
  const tokens = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const significant = tokens.filter((t) => !STOP_WORDS.has(t.toLowerCase()));
  const pool = significant.length ? significant : tokens;
  if (pool.length >= 2) return (pool[0][0] + pool[1][0]).toUpperCase();
  const w = pool[0] || "SF";
  return (w.length >= 2 ? w.slice(0, 2) : w + "X").toUpperCase();
}

/**
 * Brand mark: glossy pink (or tenant-color) circle with white bold abbreviation.
 * Use <BrandMark /> alone, or <Logo /> for mark + brand name text.
 */
export function BrandMark({ brandName = "Swift Formations", abbreviation, color, size = "sm" }) {
  const abbr = abbreviation || autoAbbreviation(brandName);
  const bg = color || "#EE1056"; // brand pink, override per-tenant via country.brand_color
  const dims = {
    xs: { box: "h-6 w-6", text: "text-[10px]" },
    sm: { box: "h-8 w-8", text: "text-[12px]" },
    md: { box: "h-10 w-10", text: "text-[14px]" },
    lg: { box: "h-12 w-12", text: "text-[17px]" },
    xl: { box: "h-16 w-16", text: "text-[22px]" },
  }[size] || { box: "h-8 w-8", text: "text-[12px]" };

  return (
    <span
      className={`${dims.box} relative rounded-full grid place-items-center shrink-0 select-none`}
      style={{
        background: `radial-gradient(circle at 35% 28%, ${lighten(bg, 0.15)} 0%, ${bg} 45%, ${darken(bg, 0.25)} 100%)`,
        boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)`,
      }}
      data-testid="brand-mark"
      aria-hidden="true"
    >
      <span
        className={`font-display font-extrabold leading-none tracking-tight text-white ${dims.text}`}
        style={{ textShadow: "0 1px 1px rgba(0,0,0,0.18)" }}
      >
        {abbr}
      </span>
    </span>
  );
}

/**
 * Logo = BrandMark + brand name text. Default export keeps the existing call sites working.
 */
export default function Logo({
  brandName = "Swift Formations",
  abbreviation,
  bg, // tenant brand color (passed from Header). Kept for API compatibility.
  fg, // unused — kept for API compatibility
  size = "sm",
  showText = true,
  textColor,
}) {
  const brandSize = { xs: "text-[14px]", sm: "text-[17px]", md: "text-[20px]", lg: "text-[24px]", xl: "text-[28px]" }[size] || "text-[17px]";
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <BrandMark brandName={brandName} abbreviation={abbreviation} color={bg} size={size} />
      {showText && (
        <span
          className={`font-display font-bold tracking-tight ${brandSize}`}
          style={{ color: textColor || "currentColor" }}
        >
          {brandName}
        </span>
      )}
    </div>
  );
}

// --- color helpers ---
function clamp(n, lo = 0, hi = 255) { return Math.max(lo, Math.min(hi, n)); }
function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return [238, 16, 86];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  const to = (n) => clamp(Math.round(n)).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
export function lighten(hex, amount = 0.15) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
export function darken(hex, amount = 0.2) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}
