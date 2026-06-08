import React from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ChevronDown, Search, ArrowUpRight, TrendingUp, AlertTriangle } from "lucide-react";
import api from "../../api/client";
import { contentScore, seoScore } from "../../lib/seoQuality";

/**
 * SEO Leaderboard — sortable table across ALL countries showing their
 * Content score, SEO score, status, domain, # FAQs, # pricing tiers, etc.
 * Loads full content for each country lazily to compute scores.
 */
export default function SeoLeaderboard({ countries }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState("seo");
  const [sortDir, setSortDir] = React.useState("asc"); // weakest first by default — that's the value
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("published");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // Fetch each country's content (parallel, capped batches of 12 at a time)
      const targets = (countries || []).filter((c) => c?.id);
      const out = [];
      const batchSize = 12;
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((c) => api.get(`/admin/countries/${c.id}`).then((r) => r.data))
        );
        results.forEach((r, idx) => {
          const c = batch[idx];
          if (r.status === "fulfilled" && r.value) {
            const content = r.value.content || {};
            const cs = contentScore(content).score;
            const ss = seoScore(c, content).score;
            const faqCount = (content?.faqs?.items || []).length;
            const tierCount = (content?.pricing?.tiers || []).length;
            out.push({
              ...c,
              seo: ss,
              content: cs,
              faqCount,
              tierCount,
              tracked: !!(content?.tracking?.ga4_id || content?.tracking?.gtm_id),
              hasDomain: !!c.domain,
            });
          } else {
            out.push({ ...c, seo: 0, content: 0, faqCount: 0, tierCount: 0, tracked: false, hasDomain: !!c.domain });
          }
        });
        if (cancelled) return;
        setRows([...out]);
      }
      if (!cancelled) setLoading(false);
    }
    if (countries && countries.length) load();
    return () => { cancelled = true; };
  }, [countries]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let f = rows;
    if (statusFilter !== "all") f = f.filter((r) => r.status === statusFilter);
    if (q) f = f.filter((r) => `${r.name} ${r.slug} ${r.domain || ""}`.toLowerCase().includes(q));
    const dir = sortDir === "asc" ? 1 : -1;
    return [...f].sort((a, b) => {
      const av = a[sortBy]; const bv = b[sortBy];
      if (typeof av === "string") return dir * av.localeCompare(bv || "");
      return dir * ((av ?? 0) - (bv ?? 0));
    });
  }, [rows, sortBy, sortDir, search, statusFilter]);

  const setSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir(col === "name" || col === "slug" ? "asc" : "asc"); }
  };

  const weak = rows.filter((r) => r.seo < 50).length;
  const strong = rows.filter((r) => r.seo >= 80).length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden" data-testid="seo-leaderboard">
      <div className="px-4 sm:px-5 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Quality monitoring</div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-display text-[20px] font-bold tracking-tight text-zinc-50 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-400" />
              SEO leaderboard
            </h3>
            {loading && <span className="text-[11px] text-zinc-500">Scanning {rows.length}/{countries?.length || 0}…</span>}
            {!loading && weak > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-300">
                <AlertTriangle className="h-3 w-3" /> {weak} weak
              </span>
            )}
            {!loading && strong > 0 && (
              <span className="text-[11px] font-medium text-emerald-300">{strong} strong</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter…"
              className="h-9 w-[180px] pl-8 pr-3 rounded-md bg-zinc-950 border border-zinc-700 text-[12.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
              data-testid="seo-leaderboard-search"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2 rounded-md bg-zinc-950 border border-zinc-700 text-[12.5px] text-zinc-100 focus:outline-none focus:border-zinc-500"
            data-testid="seo-leaderboard-status"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] min-w-[640px]">
          <thead className="bg-zinc-950/60 text-zinc-400 text-[10px] uppercase tracking-wider">
            <tr>
              <Th col="name" sortBy={sortBy} sortDir={sortDir} onClick={setSort}>Country</Th>
              <Th col="seo" sortBy={sortBy} sortDir={sortDir} onClick={setSort} align="right">SEO</Th>
              <Th col="content" sortBy={sortBy} sortDir={sortDir} onClick={setSort} align="right">Content</Th>
              <Th col="faqCount" sortBy={sortBy} sortDir={sortDir} onClick={setSort} align="right">FAQs</Th>
              <Th col="tierCount" sortBy={sortBy} sortDir={sortDir} onClick={setSort} align="right">Pricing</Th>
              <th className="px-3 py-2 text-left font-mono">Status</th>
              <th className="px-3 py-2 text-right font-mono w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {c.flag_emoji && <span className="text-[14px] shrink-0">{c.flag_emoji}</span>}
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-100 truncate">{c.name}</div>
                      <div className="text-[10.5px] text-zinc-500 truncate">{c.domain || "no domain"}</div>
                    </div>
                  </div>
                </td>
                <ScoreCell value={c.seo} />
                <ScoreCell value={c.content} />
                <td className="px-3 py-2.5 text-right text-zinc-300 tabular-nums">{c.faqCount}</td>
                <td className="px-3 py-2.5 text-right text-zinc-300 tabular-nums">{c.tierCount}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    c.status === "published" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-900/60"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    to={`/admin/countries/${c.id}`}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-zinc-500 text-[12px]">No countries match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, col, sortBy, sortDir, onClick, align }) {
  const active = sortBy === col;
  return (
    <th
      onClick={() => onClick(col)}
      className={`px-3 py-2 cursor-pointer select-none font-mono hover:text-zinc-200 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </span>
    </th>
  );
}

function ScoreCell({ value }) {
  const tone =
    value >= 80 ? { color: "text-emerald-300", bar: "bg-emerald-500" } :
    value >= 50 ? { color: "text-amber-300", bar: "bg-amber-500" } :
                  { color: "text-rose-300", bar: "bg-rose-500" };
  return (
    <td className="px-3 py-2.5 text-right">
      <div className="inline-flex items-center gap-2 justify-end">
        <div className="h-1 w-16 rounded-full bg-zinc-800 overflow-hidden">
          <div className={`h-full ${tone.bar}`} style={{ width: `${Math.max(2, value)}%` }} />
        </div>
        <span className={`tabular-nums font-mono font-bold text-[12px] w-7 text-right ${tone.color}`}>{value}</span>
      </div>
    </td>
  );
}
