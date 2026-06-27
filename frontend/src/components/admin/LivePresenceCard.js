import React from "react";
import api from "../../api/client";
import { Radio, Loader2 } from "lucide-react";

/**
 * Live presence card — shows how many visitors are CURRENTLY active across
 * all landings, with breakdown per tenant and per geo-country.
 * Polls /api/admin/analytics/live every 5s.
 */
export default function LivePresenceCard({ countries = [] }) {
  const [data, setData] = React.useState({ total: 0, per_tenant: [], per_country: [] });
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const { data } = await api.get("/admin/analytics/live");
        if (alive) { setData(data); setLoaded(true); }
      } catch { /* swallow */ }
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const countryByName = React.useMemo(() => {
    const m = {};
    countries.forEach((c) => { if (c.slug) m[c.slug] = c; });
    return m;
  }, [countries]);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden" data-testid="live-presence-card">
      <div className="px-5 py-4 flex items-start gap-4 flex-wrap border-b border-zinc-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative h-10 w-10 rounded-full bg-emerald-950/40 border border-emerald-900/60 grid place-items-center shrink-0">
            <Radio className="h-4 w-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-400/80">Live now</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[34px] sm:text-[40px] font-bold tracking-tight text-zinc-50 tabular-nums leading-none">
                {loaded ? data.total : <Loader2 className="h-6 w-6 animate-spin inline" />}
              </span>
              <span className="text-zinc-500 text-[13px]">visitor{data.total === 1 ? "" : "s"} on the landings right now</span>
            </div>
          </div>
        </div>
      </div>

      {loaded && data.total > 0 ? (
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
          <div className="px-5 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Top landings right now</div>
            <ul className="space-y-1.5">
              {data.per_tenant.slice(0, 6).map((t) => {
                const c = countryByName[t.tenant_slug];
                return (
                  <li key={t.tenant_slug} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-zinc-200 truncate">
                      {c?.flag_emoji && <span className="mr-1.5">{c.flag_emoji}</span>}
                      {c?.name || t.tenant_slug}
                    </span>
                    <span className="font-mono tabular-nums text-emerald-300 font-bold">{t.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="px-5 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">Where visitors are from</div>
            <ul className="space-y-1.5">
              {data.per_country.slice(0, 6).map((g) => (
                <li key={`${g.country}-${g.code}`} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-zinc-200 truncate">{g.country}</span>
                  <span className="font-mono tabular-nums text-zinc-300 font-bold">{g.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : loaded ? (
        <div className="px-5 py-6 text-center text-[12.5px] text-zinc-500">
          No active visitors right now. Send some traffic to a landing page and they&apos;ll appear here within 30 seconds.
        </div>
      ) : null}
    </div>
  );
}
