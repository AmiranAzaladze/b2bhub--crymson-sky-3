import React from "react";
import { Link } from "react-router-dom";
import { CountriesContext } from "./AdminLayout";
import { Button } from "../../components/ui/button";
import { ArrowRight, ExternalLink, Globe, CheckCircle2, Clock } from "lucide-react";
import Logo from "../../lib/Logo";

export default function AdminCountries() {
  const { countries } = React.useContext(CountriesContext);

  const stats = React.useMemo(() => {
    const total = countries.length;
    const published = countries.filter((c) => c.status === "published").length;
    return { total, published, draft: total - published };
  }, [countries]);

  return (
    <div className="p-8 lg:p-12 max-w-6xl" data-testid="admin-countries-page">
      <div className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-3">
          Dashboard
        </div>
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-zinc-50">
          All country landings.
        </h1>
        <p className="text-zinc-400 mt-2 text-[15px]">
          Manage every country from one place. Each landing serves its own domain — edit content
          on the right, publish when ready.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard icon={Globe} label="Countries" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Published" value={stats.published} accent="green" />
        <StatCard icon={Clock} label="Draft" value={stats.draft} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-zinc-800 bg-zinc-900/60">
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Country</div>
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Domain</div>
          <div className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Status</div>
          <div className="col-span-2" />
        </div>

        {countries.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-500">
            No countries yet. Use the + button in the sidebar to add one.
          </div>
        ) : (
          countries.map((c) => (
            <Link
              to={`/admin/countries/${c.id}`}
              key={c.id}
              className="grid grid-cols-12 px-6 py-4 border-b border-zinc-800/70 last:border-0 hover:bg-zinc-800/40 transition-colors items-center group"
              data-testid={`country-row-${c.slug}`}
            >
              <div className="col-span-4 flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-md grid place-items-center shrink-0"
                  style={{ backgroundColor: c.brand_color }}
                >
                  <span className="text-white font-display font-bold text-[13px] leading-none">
                    {c.abbreviation}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[15px] text-zinc-50 truncate flex items-center gap-2">
                    <span>{c.flag}</span>
                    {c.brand_name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5">
                    /{c.slug} · {c.locale}
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex items-center gap-1.5 text-[13.5px] text-zinc-300">
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                {c.domain}
              </div>
              <div className="col-span-2">
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
              <div className="col-span-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12.5px] text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
                >
                  Edit
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

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
