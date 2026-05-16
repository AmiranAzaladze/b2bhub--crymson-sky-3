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
 * Logo: a rounded square with the auto abbreviation, followed by the brand name.
 */
export default function Logo({
  brandName = "Swift Formations",
  abbreviation,
  bg = "#0A0A0A",
  fg = "#FFFFFF",
  size = "sm",
  showText = true,
}) {
  const abbr = abbreviation || autoAbbreviation(brandName);
  const dims = {
    sm: { box: "h-7 w-7", text: "text-[13px]", brand: "text-[17px]" },
    md: { box: "h-9 w-9", text: "text-[15px]", brand: "text-[20px]" },
    lg: { box: "h-12 w-12", text: "text-[18px]", brand: "text-[24px]" },
  }[size] || { box: "h-7 w-7", text: "text-[13px]", brand: "text-[17px]" };

  return (
    <div className="flex items-center gap-2" data-testid="brand-logo">
      <div
        className={`${dims.box} rounded-md grid place-items-center shrink-0`}
        style={{ backgroundColor: bg }}
      >
        <span
          className={`font-display font-bold leading-none ${dims.text}`}
          style={{ color: fg }}
        >
          {abbr}
        </span>
      </div>
      {showText && (
        <span className={`font-display font-bold tracking-tight ${dims.brand} text-neutral-950`}>
          {brandName}
        </span>
      )}
    </div>
  );
}
