import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";
import { seoTests, summarizeTests } from "../../lib/seoQuality";

const ICONS = {
  pass: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  fail: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
};
const STATUS_LABEL = { pass: "Pass", warn: "Warn", fail: "Fail" };
const STATUS_CHIP = {
  pass: "border-emerald-900/60 bg-emerald-950/40 text-emerald-300",
  warn: "border-amber-900/60 bg-amber-950/40 text-amber-300",
  fail: "border-rose-900/60 bg-rose-950/40 text-rose-300",
};

/**
 * SEO Tests tab — runs deterministic, schema-focused checks on the country + content.
 * Tests update LIVE as the admin edits other tabs (because state is held in parent).
 */
export default function SeoTestsPanel({ country, content }) {
  const groups = React.useMemo(() => seoTests(country, content), [country, content]);
  const stats = React.useMemo(() => summarizeTests(groups), [groups]);

  return (
    <div className="space-y-5" data-testid="seo-tests-panel">
      {/* Summary card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-zinc-950 border border-zinc-800 grid place-items-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-zinc-300" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[15px] font-bold tracking-tight text-zinc-50">
                Live SEO test suite
              </div>
              <div className="text-[12px] text-zinc-400 mt-0.5">
                {stats.pass} of {stats.total} checks passing — tests update as you edit other tabs.
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill tone="pass" count={stats.pass} label="Pass" />
            <Pill tone="warn" count={stats.warn} label="Warn" />
            <Pill tone="fail" count={stats.fail} label="Fail" />
          </div>
        </div>
      </div>

      {/* Test groups */}
      {groups.map((g) => (
        <div
          key={g.name}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
          data-testid={`seo-test-group-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/60">
            <div className="font-display text-[14px] font-bold tracking-tight text-zinc-50">
              {g.name}
            </div>
            <div className="text-[11.5px] text-zinc-500 mt-0.5">{g.description}</div>
          </div>
          <ul className="divide-y divide-zinc-800/80">
            {g.tests.map((t, i) => (
              <li
                key={i}
                className="px-5 py-2.5 flex items-start gap-3 hover:bg-zinc-900/50 transition-colors"
                data-testid={`seo-test-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`}
              >
                <span className="mt-0.5 shrink-0">{ICONS[t.status]}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-zinc-100">{t.label}</span>
                    <span className={`shrink-0 inline-flex text-[9.5px] font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded border ${STATUS_CHIP[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  {t.details && (
                    <div className="text-[12px] text-zinc-400 mt-0.5 break-words">{t.details}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="text-[11.5px] text-zinc-500 px-1 pt-1">
        These checks are deterministic and run on every keystroke. They cover Organization,
        FAQPage, BreadcrumbList and Service/Offer schemas plus the core meta tags Google
        actually reads.
      </div>
    </div>
  );
}

function Pill({ tone, count, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_CHIP[tone]}`}
    >
      <span className="tabular-nums font-bold">{count}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}
