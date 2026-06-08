import React from "react";

/**
 * Sleek progress bar with gradient fill, label, and big score number.
 * Used in the country edit top bar to monitor Content + SEO quality.
 */
export function QualityBar({ label, value = 0, testid }) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v >= 80 ? { bar: "from-emerald-400 to-emerald-500", text: "text-emerald-300", chip: "bg-emerald-950/50 border-emerald-900/60 text-emerald-300" } :
    v >= 50 ? { bar: "from-amber-400 to-amber-500", text: "text-amber-300", chip: "bg-amber-950/40 border-amber-900/60 text-amber-300" } :
              { bar: "from-rose-400 to-rose-500", text: "text-rose-300", chip: "bg-rose-950/40 border-rose-900/60 text-rose-300" };

  const status = v >= 80 ? "Strong" : v >= 50 ? "Needs work" : "Weak";

  return (
    <div
      className="flex-1 min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5 flex items-center gap-3"
      data-testid={testid}
    >
      <div className="flex flex-col items-start min-w-0">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-zinc-500 leading-none">
          {label}
        </span>
        <span className={`mt-1 font-display text-[15px] font-bold leading-none ${tone.text} tabular-nums`}>
          {v}<span className="text-[10px] opacity-60 ml-0.5">/100</span>
        </span>
      </div>
      <div className="flex-1 min-w-[80px]">
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-500 ease-out`}
            style={{ width: `${v}%` }}
          />
        </div>
      </div>
      <span className={`shrink-0 hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${tone.chip}`}>
        {status}
      </span>
    </div>
  );
}
