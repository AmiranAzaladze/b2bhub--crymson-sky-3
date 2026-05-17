import React from "react";
import { Link } from "react-router-dom";
import { CountriesContext } from "./AdminLayout";
import api from "../../api/client";
import { Button } from "../../components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "../../components/ui/dialog";
import {
  ArrowRight, ExternalLink, Globe, CheckCircle2, Clock, Database,
  Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCountries() {
  const { countries, refresh } = React.useContext(CountriesContext);
  const [syncOpen, setSyncOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const stats = React.useMemo(() => {
    const total = countries.length;
    const published = countries.filter((c) => c.status === "published").length;
    return { total, published, draft: total - published };
  }, [countries]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.long_name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q),
    );
  }, [countries, filter]);

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-6xl" data-testid="admin-countries-page">
      <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-3">
            Dashboard
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-50">
            All country landings.
          </h1>
          <p className="text-zinc-400 mt-2 text-[14px] sm:text-[15px] max-w-2xl">
            Manage every country from one place. Each landing serves its own domain — edit content
            on the right, publish when ready. Sync from B2BHub.ltd to import or refresh data for
            every jurisdiction in their catalog.
          </p>
        </div>
        <Button
          onClick={() => setSyncOpen(true)}
          className="bg-white hover:bg-zinc-200 text-zinc-950 rounded-full h-10 px-5 text-[13px] font-medium w-full sm:w-auto shrink-0"
          data-testid="open-sync-button"
        >
          <Database className="h-4 w-4 mr-2" />
          Sync from B2BHub
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard icon={Globe} label="Countries" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Published" value={stats.published} accent="green" />
        <StatCard icon={Clock} label="Draft" value={stats.draft} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, slug or domain…"
          className="flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700 min-w-0"
          data-testid="country-filter"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 whitespace-nowrap">
          {filtered.length} / {countries.length}
        </span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-6 py-3 border-b border-zinc-800 bg-zinc-900/60">
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Country</div>
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Domain</div>
          <div className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Status</div>
          <div className="col-span-2" />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-500 text-[13px]">
            {countries.length === 0
              ? "No countries yet. Click 'Sync from B2BHub' or use the + button in the sidebar to add one."
              : "No matches."}
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              to={`/admin/countries/${c.id}`}
              key={c.id}
              className="flex sm:grid sm:grid-cols-12 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/40 transition-colors items-center group gap-3 sm:gap-0"
              data-testid={`country-row-${c.slug}`}
            >
              <div className="sm:col-span-4 flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
                <div
                  className="h-9 w-9 rounded-md grid place-items-center shrink-0"
                  style={{ backgroundColor: c.brand_color }}
                >
                  <span className="text-white font-display font-bold text-[13px] leading-none">
                    {c.abbreviation}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-[14px] sm:text-[15px] text-zinc-50 truncate flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span className="truncate">{c.brand_name}</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5 truncate">
                    /{c.slug} · {c.currency_symbol || c.currency}
                    <span className="sm:hidden"> · {c.domain}</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex sm:col-span-4 items-center gap-1.5 text-[13.5px] text-zinc-300 min-w-0">
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="truncate">{c.domain}</span>
              </div>
              <div className="hidden sm:block sm:col-span-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    c.status === "published"
                      ? "border-green-900/60 bg-green-950/40 text-green-300"
                      : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      c.status === "published" ? "bg-green-500" : "bg-zinc-500"
                    }`}
                  />
                  {c.status}
                </span>
              </div>
              <div className="flex sm:col-span-2 sm:justify-end items-center gap-1 shrink-0">
                <span
                  className={`sm:hidden h-2 w-2 rounded-full ${
                    c.status === "published" ? "bg-green-500" : "bg-zinc-500"
                  }`}
                  title={c.status}
                />
                <ArrowRight className="h-4 w-4 text-zinc-500 sm:hidden" />
                <Button
                  variant="ghost" size="sm"
                  className="hidden sm:inline-flex text-[12.5px] text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
                >
                  Edit
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </Link>
          ))
        )}
      </div>

      <SyncDialog open={syncOpen} onOpenChange={setSyncOpen} onDone={refresh} />
    </div>
  );
}

function SyncDialog({ open, onOpenChange, onDone }) {
  const [meta, setMeta] = React.useState(null);
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [overwrite, setOverwrite] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setResult(null);
      setRunning(false);
      return;
    }
    api.get("/admin/b2bhub/slugs/available").then(({ data }) => setMeta(data));
  }, [open]);

  const start = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await api.post("/admin/b2bhub/sync", { overwrite_content: overwrite });
      setResult(data);
      toast.success(`Synced ${data.inserted + data.updated} countries from B2BHub`);
      await onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Sync failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 max-h-[92vh] overflow-y-auto"
        data-testid="sync-dialog"
      >
        <DialogHeader className="px-5 sm:px-7 pt-7 pb-2 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
            Integration · b2bhub.ltd
          </div>
          <DialogTitle className="font-display text-[22px] sm:text-[24px] font-bold tracking-tight text-zinc-50">
            Sync country landings
          </DialogTitle>
          <DialogDescription className="text-[13px] text-zinc-400 mt-1">
            Imports / refreshes country data (name, currency, registrar, legal forms, real pricing,
            timeline, FAQs) for every jurisdiction available on your API key.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-7 pb-7 pt-3 space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-2 text-[12.5px]">
            <Row k="API key" v={<span className="font-mono text-zinc-300">b2b_d8f0…d7d5ca</span>} />
            <Row k="Source" v={
              meta ? (
                <span className={`font-mono text-[10.5px] uppercase px-2 py-0.5 rounded-full border ${
                  meta.source === "live"
                    ? "border-green-900/60 bg-green-950/40 text-green-300"
                    : "border-amber-900/60 bg-amber-950/40 text-amber-300"
                }`}>
                  {meta.source === "live" ? "LIVE LIST" : "FALLBACK (no countries:list scope)"}
                </span>
              ) : <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
            } />
            <Row k="Available countries" v={meta ? <span className="font-display text-zinc-50 font-semibold">{meta.count}</span> : "…"} />
          </div>

          {meta?.source === "fallback-scope" && (
            <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 flex items-start gap-2 text-[12px] text-amber-200">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                Your B2BHub API key is missing the <code className="font-mono">countries:list</code> scope, so we're using
                a curated catalog of {meta?.count ?? "248+"} jurisdictions. Enable that scope in your B2BHub dashboard to discover the
                full catalog automatically.
              </div>
            </div>
          )}

          <label className="flex items-center gap-2.5 text-[13px] text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="h-4 w-4 accent-white"
              data-testid="overwrite-toggle"
            />
            Overwrite existing landing content
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 ml-1">
              (destructive)
            </span>
          </label>

          {result && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-1.5 text-[12.5px]">
              <Row k="Inserted" v={<span className="font-display text-green-300 font-semibold">{result.inserted}</span>} />
              <Row k="Updated" v={<span className="font-display text-zinc-100 font-semibold">{result.updated}</span>} />
              <Row k="Failed" v={<span className="font-display text-red-300 font-semibold">{result.failed.length}</span>} />
            </div>
          )}

          <Button
            onClick={start}
            disabled={running || !meta}
            className="w-full h-11 bg-white hover:bg-zinc-200 text-zinc-950 rounded-full text-[13.5px] font-medium"
            data-testid="run-sync-button"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing all countries…</>
            ) : (
              <><Database className="h-4 w-4 mr-2" />{result ? "Sync again" : "Start sync"}</>
            )}
          </Button>
          {running && (
            <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-zinc-500">
              Takes ~2 minutes for the full catalog
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Row = ({ k, v }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">{k}</span>
    <span className="text-zinc-200">{v}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <div className="flex items-center justify-between">
      <div
        className={`h-8 w-8 rounded-lg grid place-items-center ${
          accent === "green"
            ? "bg-green-950/40 border border-green-900/60"
            : "bg-zinc-800 border border-zinc-700"
        }`}
      >
        <Icon className={`h-4 w-4 ${accent === "green" ? "text-green-400" : "text-zinc-300"}`} />
      </div>
    </div>
    <div className="mt-4 font-display text-[32px] font-bold tracking-tighter text-zinc-50 leading-none">
      {value}
    </div>
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mt-1.5">{label}</div>
  </div>
);
