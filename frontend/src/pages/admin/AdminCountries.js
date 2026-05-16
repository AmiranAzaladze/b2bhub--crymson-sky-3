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
      {/* Header */}
      <div className="mb-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500 mb-3">
          Dashboard
        </div>
        <h1 className="font-display text-4xl font-bold tracking-[-0.03em] text-neutral-950">
          All country landings.
        </h1>
        <p className="text-neutral-500 mt-2 text-[15px]">
          Manage every country from one place. Each landing serves its own domain — edit content
          on the right, publish when ready.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard icon={Globe} label="Countries" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Published" value={stats.published} accent="green" />
        <StatCard icon={Clock} label="Draft" value={stats.draft} />
      </div>

      {/* List */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 border-b border-neutral-200 bg-neutral-50/60">
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">Country</div>
          <div className="col-span-4 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">Domain</div>
          <div className="col-span-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">Status</div>
          <div className="col-span-2" />
        </div>

        {countries.length === 0 ? (
          <div className="px-6 py-16 text-center text-neutral-500">
            No countries yet. Use the + button in the sidebar to add one.
          </div>
        ) : (
          countries.map((c) => (
            <Link
              to={`/admin/countries/${c.id}`}
              key={c.id}
              className="grid grid-cols-12 px-6 py-4 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors items-center group"
              data-testid={`country-row-${c.slug}`}
            >
              <div className="col-span-4 flex items-center gap-3">
                <Logo
                  brandName={c.brand_name}
                  abbreviation={c.abbreviation}
                  bg={c.brand_color}
                  size="sm"
                  showText={false}
                />
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[15px] text-neutral-950 truncate flex items-center gap-2">
                    <span>{c.flag}</span>
                    {c.brand_name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500 mt-0.5">
                    /{c.slug} · {c.locale}
                  </div>
                </div>
              </div>
              <div className="col-span-4 flex items-center gap-1.5 text-[13.5px] text-neutral-700">
                <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                {c.domain}
              </div>
              <div className="col-span-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    c.status === "published"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      c.status === "published" ? "bg-green-500" : "bg-neutral-400"
                    }`}
                  />
                  {c.status}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12.5px] text-neutral-500 group-hover:text-neutral-950"
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
  <div className="rounded-2xl border border-neutral-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <div
        className={`h-8 w-8 rounded-lg grid place-items-center ${
          accent === "green" ? "bg-green-50 border border-green-200" : "bg-neutral-50 border border-neutral-200"
        }`}
      >
        <Icon className={`h-4 w-4 ${accent === "green" ? "text-green-700" : "text-neutral-700"}`} />
      </div>
    </div>
    <div className="mt-4 font-display text-[32px] font-bold tracking-tighter text-neutral-950 leading-none">
      {value}
    </div>
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 mt-1.5">{label}</div>
  </div>
);
