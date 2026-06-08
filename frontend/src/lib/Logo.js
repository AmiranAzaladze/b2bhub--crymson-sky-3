import React from "react";

/**
 * Kept for backward compatibility with any callers that still want an
 * auto-generated 2-letter abbreviation from a brand name.
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
 * Brand mark = the official SF pink-ball logo (frontend/public/logo.png).
 * Same image is used everywhere — admin and all 253 country landings.
 */
export function BrandMark({ brandName = "Swift Formations", size = "sm" }) {
  const dim = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }[size] || "h-8 w-8";

  return (
    <img
      src="/logo.png"
      alt={brandName}
      className={`${dim} shrink-0 select-none object-contain`}
      draggable={false}
      data-testid="brand-mark"
    />
  );
}

/**
 * Logo = BrandMark + brand name text. Default export — keeps existing call sites working.
 * The `bg`, `fg`, `abbreviation` props are accepted but ignored: the logo is now an
 * image asset, not a generated badge.
 */
// eslint-disable-next-line no-unused-vars
export default function Logo({ brandName = "Swift Formations", abbreviation, bg, fg, size = "sm", showText = true, textColor }) {
  const brandSize = { xs: "text-[14px]", sm: "text-[17px]", md: "text-[20px]", lg: "text-[24px]", xl: "text-[28px]" }[size] || "text-[17px]";
  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <BrandMark brandName={brandName} size={size} />
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
