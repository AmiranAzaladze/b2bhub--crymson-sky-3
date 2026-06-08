import React from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/client";
import { LogOut, Plus, Globe, ChevronRight, Loader2, BarChart3, Menu, X, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "sonner";
import { autoAbbreviation } from "../../lib/Logo";
import useDarkRoot from "../../lib/useDarkRoot";

export const CountriesContext = React.createContext(null);

export default function AdminLayout() {
  useDarkRoot();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [countries, setCountries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredCountries = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const hay = [c.name, c.slug, c.domain, c.brand_name, c.country_code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [countries, search]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/countries");
      setCountries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  // Auto-close mobile drawer on route change
  React.useEffect(() => { setNavOpen(false); }, [location.pathname]);

  // Lock body scroll while drawer is open on mobile
  React.useEffect(() => {
    if (navOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [navOpen]);

  const onLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <CountriesContext.Provider value={{ countries, refresh }}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 md:flex" data-testid="admin-shell">
        {/* Mobile top bar (md:hidden) */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 px-4 h-14 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800">
          <button
            onClick={() => setNavOpen(true)}
            className="h-9 w-9 grid place-items-center rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition-colors"
            data-testid="open-mobile-nav"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <NavLink to="/admin" className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-white grid place-items-center shrink-0">
              <span className="text-zinc-950 font-display font-bold text-[11px]">SF</span>
            </div>
            <span className="font-display font-bold text-[14px] tracking-tight text-zinc-50 truncate">
              Swift Formations
            </span>
          </NavLink>
          <button
            onClick={onLogout}
            className="h-9 w-9 grid place-items-center rounded-md hover:bg-zinc-800 text-zinc-300 hover:text-zinc-50 transition-colors"
            data-testid="admin-logout-mobile"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Backdrop (mobile drawer) */}
        {navOpen && (
          <button
            onClick={() => setNavOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-label="Close navigation"
            data-testid="mobile-nav-backdrop"
          />
        )}

        <aside
          className={`fixed md:sticky inset-y-0 left-0 top-0 z-50 w-72 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen transform transition-transform duration-200 ease-out
            ${navOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
          data-testid="admin-sidebar"
        >
          <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between gap-2">
            <NavLink to="/admin" className="flex items-center gap-2 min-w-0" data-testid="admin-brand">
              <div className="h-7 w-7 rounded-md bg-white grid place-items-center shrink-0">
                <span className="text-zinc-950 font-display font-bold text-[13px]">SF</span>
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-[15px] leading-none tracking-tight text-zinc-50 truncate">
                  Swift Formations
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 mt-1">
                  Admin · Multi-tenant
                </div>
              </div>
            </NavLink>
            <button
              onClick={() => setNavOpen(false)}
              className="md:hidden h-8 w-8 grid place-items-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
              data-testid="close-mobile-nav"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 pt-4 pb-2 border-b border-zinc-800/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, slug, domain…"
                className="w-full h-9 pl-8 pr-8 rounded-md bg-zinc-800/60 border border-zinc-700/60 text-[12.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:bg-zinc-800 transition-colors"
                data-testid="admin-country-search"
                autoComplete="off"
                spellCheck={false}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 transition-colors"
                  data-testid="admin-country-search-clear"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                Countries
              </span>
              <button
                onClick={() => setAddOpen(true)}
                className="h-6 w-6 grid place-items-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                data-testid="add-country-button"
                aria-label="Add country"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="px-2 py-6 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-zinc-500" />
              </div>
            ) : (
              <nav className="space-y-0.5">
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      isActive ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                    }`
                  }
                  data-testid="admin-nav-all"
                >
                  <Globe className="h-3.5 w-3.5" />
                  All countries
                  <span className="ml-auto font-mono text-[10px] text-zinc-500" data-testid="admin-country-count">
                    {search ? `${filteredCountries.length}/${countries.length}` : countries.length}
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/analytics"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      isActive ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                    }`
                  }
                  data-testid="admin-nav-analytics"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 live-dot" />
                </NavLink>

                <div className="h-3" />

                {filteredCountries.length === 0 && search && (
                  <div className="px-3 py-4 text-center text-[12px] text-zinc-500" data-testid="admin-country-empty">
                    No country matches “{search}”
                  </div>
                )}

                {filteredCountries.map((c) => (
                  <NavLink
                    key={c.id}
                    to={`/admin/countries/${c.id}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                        isActive
                          ? "bg-zinc-800 text-zinc-50"
                          : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                      }`
                    }
                    data-testid={`sidebar-country-${c.slug}`}
                  >
                    <span className="text-base leading-none">{c.flag || "🌍"}</span>
                    <span className="font-medium truncate">{c.name}</span>
                    <span
                      className={`ml-auto h-1.5 w-1.5 rounded-full shrink-0 ${
                        c.status === "published" ? "bg-green-500" : "bg-zinc-600"
                      }`}
                      title={c.status}
                    />
                    <ChevronRight className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100" />
                  </NavLink>
                ))}
              </nav>
            )}
          </div>

          <div className="px-3 py-3 border-t border-zinc-800">
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="min-w-0">
                <div className="text-[12.5px] font-medium text-zinc-100 truncate">
                  {user?.email}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 mt-0.5">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="h-7 w-7 grid place-items-center rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                data-testid="admin-logout"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0" key={location.pathname}>
          <Outlet />
        </main>

        <AddCountryDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onCreated={(c) => {
            toast.success(`${c.name} created`);
            refresh().then(() => navigate(`/admin/countries/${c.id}`));
          }}
        />
      </div>
    </CountriesContext.Provider>
  );
}

function AddCountryDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = React.useState({
    slug: "", name: "", domain: "", brand_name: "", flag: "🌍",
    brand_color: "#0A0A0A", accent_color: "#C8102E",
    currency: "USD", currency_symbol: "$",
    capital: "", authority_name: "", authority_short: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setForm({
        slug: "", name: "", domain: "", brand_name: "", flag: "🌍",
        brand_color: "#0A0A0A", accent_color: "#C8102E",
        currency: "USD", currency_symbol: "$",
        capital: "", authority_name: "", authority_short: "",
      });
      setErr("");
    }
  }, [open]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.slug.trim() || !form.name.trim() || !form.domain.trim() || !form.brand_name.trim()) {
      setErr("Slug, name, domain and brand name are required.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/admin/countries", {
        ...form,
        long_name: form.name,
        slug: form.slug.toLowerCase(),
        abbreviation: autoAbbreviation(form.brand_name),
      });
      onOpenChange(false);
      onCreated(data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 max-h-[92vh] overflow-y-auto" data-testid="add-country-dialog">
        <DialogHeader className="px-5 sm:px-7 pt-7 pb-2 text-left">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
            New country
          </div>
          <DialogTitle className="font-display text-[24px] font-bold tracking-tight text-zinc-50">
            Add a country landing
          </DialogTitle>
          <DialogDescription className="text-[13px] text-zinc-400 mt-1">
            Create a new country. Default content will be generated automatically — you can edit
            everything afterwards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="px-5 sm:px-7 pb-7 pt-3 space-y-3" data-testid="add-country-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DarkField label="Slug (URL key)" id="slug">
              <Input id="slug" value={form.slug} onChange={onChange("slug")} placeholder="es" className="h-10" data-testid="new-slug" />
            </DarkField>
            <DarkField label="Name (short)" id="name">
              <Input id="name" value={form.name} onChange={onChange("name")} placeholder="Spain" className="h-10" data-testid="new-name" />
            </DarkField>
          </div>
          <DarkField label="Domain" id="domain">
            <Input id="domain" value={form.domain} onChange={onChange("domain")} placeholder="spainformations.com" className="h-10" data-testid="new-domain" />
          </DarkField>
          <DarkField label="Brand name" id="brand_name">
            <Input id="brand_name" value={form.brand_name} onChange={onChange("brand_name")} placeholder="Swift Formations ES" className="h-10" data-testid="new-brand-name" />
          </DarkField>
          <div className="grid grid-cols-3 gap-3">
            <DarkField label="Flag emoji" id="flag">
              <Input id="flag" value={form.flag} onChange={onChange("flag")} className="h-10" />
            </DarkField>
            <DarkField label="Currency" id="currency">
              <Input id="currency" value={form.currency} onChange={onChange("currency")} className="h-10" />
            </DarkField>
            <DarkField label="Symbol" id="currency_symbol">
              <Input id="currency_symbol" value={form.currency_symbol} onChange={onChange("currency_symbol")} className="h-10" />
            </DarkField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DarkField label="Brand color" id="brand_color">
              <Input id="brand_color" type="color" value={form.brand_color} onChange={onChange("brand_color")} className="h-10 p-1" />
            </DarkField>
            <DarkField label="Accent color" id="accent_color">
              <Input id="accent_color" type="color" value={form.accent_color} onChange={onChange("accent_color")} className="h-10 p-1" />
            </DarkField>
          </div>

          {err && (
            <div className="text-[12.5px] text-red-300 bg-red-950/40 border border-red-900/60 rounded-md p-2.5">
              {err}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white hover:bg-zinc-200 text-zinc-950 rounded-full text-[13.5px] font-medium mt-2"
            data-testid="new-country-submit"
          >
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating</>) : "Create country"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const DarkField = ({ label, id, children }) => (
  <div>
    <Label htmlFor={id} className="text-[12px] font-medium text-zinc-300 mb-1.5 block">{label}</Label>
    {children}
  </div>
);
