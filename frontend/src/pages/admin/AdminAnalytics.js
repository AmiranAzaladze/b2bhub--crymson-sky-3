import React from "react";
import api from "../../api/client";
import { CountriesContext } from "./AdminLayout";
import { Button } from "../../components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  Activity, Users, MousePointerClick, FileCheck, Eye, ArrowUpRight, ArrowDownRight,
  Database, Trash2, RefreshCw, ChevronUp, ChevronDown, Globe2, Monitor, Smartphone, Tablet,
} from "lucide-react";
import { toast } from "sonner";
import SeoLeaderboard from "../../components/admin/SeoLeaderboard";

const PERIODS = [
  { v: "1h", l: "Last hour" },
  { v: "24h", l: "Last 24h" },
  { v: "7d", l: "Last 7 days" },
  { v: "30d", l: "Last 30 days" },
  { v: "90d", l: "Last 90 days" },
  { v: "all", l: "All time" },
];

const METRICS = [
  { v: "page_views", l: "Page views" },
  { v: "visitors", l: "Visitors" },
  { v: "cta_clicks", l: "CTA clicks" },
  { v: "leads", l: "Leads" },
];

const FLAG = {
  GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", FR: "🇫🇷", UA: "🇺🇦", ES: "🇪🇸", NL: "🇳🇱",
  IT: "🇮🇹", CA: "🇨🇦", IN: "🇮🇳", AU: "🇦🇺", XX: "🌐",
};

export default function AdminAnalytics() {
  const { countries } = React.useContext(CountriesContext);
  const [period, setPeriod] = React.useState("7d");
  const [tenant, setTenant] = React.useState("all");
  const [metric, setMetric] = React.useState("page_views");

  const [overview, setOverview] = React.useState(null);
  const [series, setSeries] = React.useState([]);
  const [rankings, setRankings] = React.useState([]);
  const [breakdowns, setBreakdowns] = React.useState({});
  const [funnel, setFunnel] = React.useState([]);
  const [recent, setRecent] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const t = tenant && tenant !== "all" ? `&tenant=${tenant}` : "";
      const [ov, ts, rk, fn, rc, d1, d2, d3, d4, d5, d6, d7, d8] = await Promise.all([
        api.get(`/admin/analytics/overview?period=${period}${t}`),
        api.get(`/admin/analytics/timeseries?period=${period}&metric=${metric}${t}`),
        api.get(`/admin/analytics/rankings?period=${period}`),
        api.get(`/admin/analytics/funnel?period=${period}${t}`),
        api.get(`/admin/analytics/recent?limit=50${t}`),
        api.get(`/admin/analytics/breakdown/country?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/city?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/device_type?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/browser?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/os?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/referrer?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/utm_source?period=${period}${t}`),
        api.get(`/admin/analytics/breakdown/button?period=${period}${t}`),
      ]);
      setOverview(ov.data);
      setSeries(ts.data || []);
      setRankings(rk.data || []);
      setFunnel(fn.data || []);
      setRecent(rc.data || []);
      setBreakdowns({
        country: d1.data, city: d2.data, device: d3.data, browser: d4.data,
        os: d5.data, referrer: d6.data, utm: d7.data, button: d8.data,
      });
    } finally {
      setLoading(false);
    }
  }, [period, tenant, metric]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const seedDemo = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/admin/analytics/seed-demo");
      toast.success(`Inserted ${data.inserted.toLocaleString()} demo events`);
      await refresh();
    } catch {
      toast.error("Failed to seed");
    } finally {
      setBusy(false);
    }
  };

  const clearDemo = async () => {
    if (!window.confirm("Clear all demo events?")) return;
    setBusy(true);
    try {
      const { data } = await api.delete("/admin/analytics/seed-demo");
      toast.success(`Deleted ${data.deleted.toLocaleString()} demo events`);
      await refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" data-testid="analytics-page">
      {/* Top bar */}
      <div className="sticky top-14 md:top-0 z-30 bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Analytics</div>
          <div className="font-display text-[20px] sm:text-[22px] font-bold tracking-tight text-zinc-50 truncate">
            {tenant === "all" ? "All landings" : countries.find((c) => c.slug === tenant)?.brand_name || tenant}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={tenant} onValueChange={setTenant}>
            <SelectTrigger className="w-[150px] sm:w-[180px] h-9 bg-zinc-900 border-zinc-700 text-zinc-100 text-[12.5px]" data-testid="tenant-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 All countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.flag} {c.brand_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] sm:w-[150px] h-9 bg-zinc-900 border-zinc-700 text-zinc-100 text-[12.5px]" data-testid="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline" size="sm" onClick={refresh}
            className="h-9 px-3 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50 rounded-full text-[12.5px]"
            data-testid="refresh-button"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={seedDemo}
            disabled={busy}
            className="h-9 px-3 bg-white hover:bg-zinc-200 text-zinc-950 rounded-full text-[12.5px]"
            data-testid="seed-demo-button"
          >
            <Database className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Generate demo data</span>
            <span className="sm:hidden">Demo</span>
          </Button>
          <Button
            variant="outline" size="sm" onClick={clearDemo} disabled={busy}
            className="h-9 px-3 border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50 rounded-full text-[12.5px]"
            data-testid="clear-demo-button"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-8 lg:p-12 max-w-[1400px] w-full mx-auto space-y-6 sm:space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Kpi icon={Eye} label="Page views" value={overview?.current?.page_views} delta={overview?.delta?.page_views} />
          <Kpi icon={Users} label="Visitors" value={overview?.current?.visitors} delta={overview?.delta?.visitors} />
          <Kpi icon={Activity} label="Sessions" value={overview?.current?.sessions} delta={overview?.delta?.sessions} />
          <Kpi icon={MousePointerClick} label="CTA clicks" value={overview?.current?.cta_clicks} delta={overview?.delta?.cta_clicks} />
          <Kpi icon={FileCheck} label="Leads" value={overview?.current?.leads} delta={overview?.delta?.leads} />
        </div>

        {/* Time series */}
        <Card>
          <CardHeader
            eyebrow="Time series"
            title="Traffic over time"
            right={
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-[160px] h-8 bg-zinc-900 border-zinc-700 text-zinc-100 text-[12px]" data-testid="metric-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
          <div className="p-5 h-[280px]">
            {series.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#27272a" vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={fmtBucket} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5", fontSize: 12 }}
                    labelFormatter={fmtBucket}
                  />
                  <Line type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </Card>

        {/* Rankings table */}
        <Card>
          <CardHeader
            eyebrow="Landing rankings"
            title="Performance by country"
          />
          <RankingsTable rows={rankings} countries={countries} />
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader eyebrow="Funnel" title="Page view → Lead submit" />
          <Funnel data={funnel} />
        </Card>

        {/* Breakdowns grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BreakdownCard
            title="Top countries" eyebrow="Geo" icon={Globe2}
            data={breakdowns.country} formatter={(k) => k}
          />
          <BreakdownCard
            title="Top cities" eyebrow="Geo · City" icon={Globe2}
            data={breakdowns.city} formatter={(k) => k}
          />
          <DonutCard
            title="Devices" eyebrow="Device type"
            data={breakdowns.device}
          />
          <BreakdownCard
            title="Browsers" eyebrow="Software" icon={Monitor}
            data={breakdowns.browser}
          />
          <BreakdownCard
            title="Operating systems" eyebrow="Software" icon={Monitor}
            data={breakdowns.os}
          />
          <BreakdownCard
            title="Referrers" eyebrow="Acquisition"
            data={breakdowns.referrer} formatter={(k) => (k === "(direct)" ? "(direct)" : k.replace(/^https?:\/\//, "").replace(/\/$/, ""))}
          />
          <BreakdownCard
            title="UTM sources" eyebrow="Campaigns"
            data={breakdowns.utm}
          />
          <BreakdownCard
            title="Most-clicked elements" eyebrow="Behaviour"
            data={breakdowns.button} formatter={(k) => k}
          />
        </div>

        {/* SEO Leaderboard across all countries */}
        <SeoLeaderboard countries={countries} />

        {/* Live feed */}
        <Card>
          <CardHeader eyebrow="Live feed" title="Recent events" />
          <LiveFeed events={recent} />
        </Card>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const Card = ({ children }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
    {children}
  </div>
);

const CardHeader = ({ eyebrow, title, right }) => (
  <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
    <div>
      {eyebrow && (
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-1">
          {eyebrow}
        </div>
      )}
      <div className="font-display font-semibold text-[16px] tracking-tight text-zinc-50">
        {title}
      </div>
    </div>
    {right}
  </div>
);

const Kpi = ({ icon: Icon, label, value, delta }) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 grid place-items-center">
          <Icon className="h-4 w-4 text-zinc-300" />
        </div>
        {delta !== null && delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono ${
              positive ? "bg-green-950/40 text-green-300 border border-green-900/60"
                       : "bg-red-950/40 text-red-300 border border-red-900/60"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4 font-display text-[28px] font-bold tracking-tighter text-zinc-50 leading-none tabular-nums">
        {(value ?? 0).toLocaleString()}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mt-1.5">{label}</div>
    </div>
  );
};

const EmptyChart = () => (
  <div className="h-full grid place-items-center text-zinc-500 text-[13px]">
    No data in this range — click "Generate demo data" or wait for visitors to arrive.
  </div>
);

const RankingsTable = ({ rows, countries }) => {
  const [sortKey, setSortKey] = React.useState("page_views");
  const [sortDir, setSortDir] = React.useState("desc");
  const sorted = React.useMemo(() => {
    const arr = rows.slice();
    arr.sort((a, b) => {
      const av = a[sortKey] || 0;
      const bv = b[sortKey] || 0;
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const setSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const top = Math.max(...rows.map((r) => r.page_views || 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" data-testid="rankings-table">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500">
            <Th>#</Th>
            <Th>Country</Th>
            <ThSort label="Page views" k="page_views" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="Visitors" k="visitors" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="Sessions" k="sessions" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="Clicks" k="cta_clicks" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="Leads" k="leads" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="CTR" k="ctr" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
            <ThSort label="CVR" k="cvr" sortKey={sortKey} sortDir={sortDir} onClick={setSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-10 text-zinc-500">No data</td></tr>
          ) : sorted.map((r, i) => {
            const c = countries.find((c) => c.slug === r.tenant_slug);
            const barPct = (r.page_views / top) * 100;
            return (
              <tr key={r.tenant_slug} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                <Td><span className="font-mono text-[11px] text-zinc-500">{i + 1}</span></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{c?.flag || "🌐"}</span>
                    <span className="text-zinc-100 font-medium">{c?.brand_name || r.tenant_slug}</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-zinc-100">{(r.page_views || 0).toLocaleString()}</span>
                    <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                </Td>
                <Td>{(r.visitors || 0).toLocaleString()}</Td>
                <Td>{(r.sessions || 0).toLocaleString()}</Td>
                <Td>{(r.cta_clicks || 0).toLocaleString()}</Td>
                <Td>{(r.leads || 0).toLocaleString()}</Td>
                <Td>{(r.ctr || 0).toFixed(1)}%</Td>
                <Td>{(r.cvr || 0).toFixed(2)}%</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Th = ({ children }) => (
  <th className="font-mono text-[10px] uppercase tracking-[0.18em] font-medium text-left px-5 py-3">{children}</th>
);

const Td = ({ children }) => (
  <td className="px-5 py-3 text-zinc-200 tabular-nums">{children}</td>
);

const ThSort = ({ label, k, sortKey, sortDir, onClick }) => {
  const active = k === sortKey;
  return (
    <th className="font-mono text-[10px] uppercase tracking-[0.18em] font-medium text-left px-5 py-3">
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-zinc-100 transition-colors ${active ? "text-zinc-100" : ""}`}
        data-testid={`sort-${k}`}
      >
        {label}
        {active && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    </th>
  );
};

const Funnel = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-10 text-center text-zinc-500 text-[13px]">No data</div>;
  return (
    <div className="p-5 space-y-2.5">
      {data.map((step, i) => {
        const prev = i > 0 ? data[i - 1].value : step.value;
        const drop = prev > 0 ? Math.round(((prev - step.value) / prev) * 100) : 0;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 flex items-center gap-2">
                <span className="text-zinc-600">0{i + 1}</span>
                {step.label}
              </div>
              <div className="flex items-center gap-3 text-[12px]">
                {i > 0 && (
                  <span className="font-mono text-zinc-500">-{drop}%</span>
                )}
                <span className="font-display font-semibold text-zinc-100 tabular-nums">
                  {step.value.toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-zinc-500 w-12 text-right">{step.pct}%</span>
              </div>
            </div>
            <div className="h-7 bg-zinc-950 rounded-md overflow-hidden">
              <div
                className="h-full bg-white/90 transition-all"
                style={{ width: `${step.pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BreakdownCard = ({ title, eyebrow, icon, data = [], formatter = (k) => k }) => {
  const max = Math.max(...data.map((d) => d.count || 0), 1);
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} />
      <div className="p-5">
        {data.length === 0 ? (
          <div className="text-center text-zinc-500 text-[13px] py-6">No data</div>
        ) : (
          <ul className="space-y-2.5">
            {data.map((d) => (
              <li key={String(d.key)} className="text-[13px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-200 truncate max-w-[70%]">{formatter(String(d.key))}</span>
                  <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                    {d.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 group-hover:bg-white transition-all"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

const DONUT_COLORS = ["#ffffff", "#a1a1aa", "#52525b", "#3f3f46", "#27272a"];

const DonutCard = ({ title, eyebrow, data = [] }) => {
  const total = data.reduce((a, b) => a + (b.count || 0), 0);
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} />
      <div className="p-5 flex items-center gap-5">
        <div className="w-[140px] h-[140px] shrink-0 relative">
          {total > 0 ? (
            <>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data} dataKey="count" innerRadius={48} outerRadius={68} stroke="none" paddingAngle={2}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <div className="font-display text-[20px] font-bold text-zinc-50 leading-none tabular-nums">{total.toLocaleString()}</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 mt-1">total</div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full grid place-items-center text-zinc-500 text-[12px]">No data</div>
          )}
        </div>
        <ul className="flex-1 space-y-2">
          {data.map((d, i) => {
            const Icon = d.key === "mobile" ? Smartphone : d.key === "tablet" ? Tablet : Monitor;
            return (
              <li key={String(d.key)} className="flex items-center gap-2.5 text-[13px]">
                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <Icon className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-200 capitalize flex-1">{d.key}</span>
                <span className="font-mono text-[11px] text-zinc-400 tabular-nums">{d.count.toLocaleString()}</span>
                <span className="font-mono text-[10px] text-zinc-500 w-10 text-right">
                  {total > 0 ? Math.round((d.count / total) * 100) : 0}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
};

const LiveFeed = ({ events }) => (
  <div className="overflow-x-auto max-h-[460px]">
    <table className="w-full text-[12.5px]" data-testid="live-feed-table">
      <thead className="sticky top-0 bg-zinc-900 z-10">
        <tr className="border-b border-zinc-800 text-zinc-500">
          <Th>Time</Th>
          <Th>Event</Th>
          <Th>Tenant</Th>
          <Th>Geo</Th>
          <Th>Device · Browser</Th>
          <Th>Path</Th>
          <Th>IP</Th>
        </tr>
      </thead>
      <tbody>
        {events.length === 0 ? (
          <tr><td colSpan={7} className="text-center py-10 text-zinc-500">No events yet</td></tr>
        ) : events.map((e) => (
          <tr key={e.id} className="border-b border-zinc-800/50">
            <Td><span className="font-mono text-[11px] text-zinc-400">{fmtTime(e.ts)}</span></Td>
            <Td>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10.5px] font-mono ${eventColor(e.type)}`}>
                {e.type}
              </span>
              {e.meta?.test_id && (
                <span className="ml-2 font-mono text-[10.5px] text-zinc-500">{e.meta.test_id}</span>
              )}
            </Td>
            <Td><span className="font-mono text-[11px] text-zinc-300">{e.tenant_slug}</span></Td>
            <Td>
              <span className="mr-1.5">{FLAG[e.country_code] || "🌐"}</span>
              <span className="text-zinc-300">{e.city || e.country || "—"}</span>
            </Td>
            <Td>
              <span className="text-zinc-300 capitalize">{e.device_type}</span>
              <span className="text-zinc-500"> · </span>
              <span className="text-zinc-400">{e.browser}</span>
            </Td>
            <Td><span className="font-mono text-[11px] text-zinc-400">{e.path}</span></Td>
            <Td><span className="font-mono text-[11px] text-zinc-500">{e.ip}</span></Td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtBucket(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtTime(s) {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function eventColor(t) {
  if (t === "page_view") return "bg-zinc-800 text-zinc-200";
  if (t === "click") return "bg-blue-950/60 text-blue-300";
  if (t === "lead_open") return "bg-amber-950/60 text-amber-300";
  if (t === "lead_submit") return "bg-green-950/60 text-green-300";
  if (t === "name_check") return "bg-violet-950/60 text-violet-300";
  if (t === "scroll") return "bg-zinc-800/70 text-zinc-400";
  return "bg-zinc-800 text-zinc-300";
}
