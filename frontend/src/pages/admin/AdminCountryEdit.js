import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { toast } from "sonner";
import {
  Loader2, Save, ExternalLink, Eye, RefreshCw, Trash2,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { CountriesContext } from "./AdminLayout";
import { Field, Section, ListEditor, StringListEditor } from "../../components/admin/Fields";
import { Label } from "../../components/ui/label";
import { autoAbbreviation, BrandMark } from "../../lib/Logo";
import { contentScore, seoScore } from "../../lib/seoQuality";
import { QualityBar } from "../../components/admin/QualityBar";
import SeoTestsPanel from "../../components/admin/SeoTestsPanel";
import SerpPreview from "../../components/admin/SerpPreview";
import CountryBlogPanel from "../../components/admin/CountryBlogPanel";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../../components/ui/dialog";

export default function AdminCountryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh: refreshCountries } = React.useContext(CountriesContext);

  const [country, setCountry] = React.useState(null);
  const [content, setContent] = React.useState(null);
  const [b2bhub, setB2bhub] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    setDirty(false);
    api
      .get(`/admin/countries/${id}`)
      .then(({ data }) => {
        setCountry(data.country);
        setContent(data.content || {});
      })
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    if (country?.b2bhub_country_code) {
      api.get(`/admin/b2bhub/${country.b2bhub_country_code}`).then(({ data }) => setB2bhub(data));
    }
  }, [country?.b2bhub_country_code]);

  const updateCountry = (patch) => {
    setCountry((c) => {
      const next = { ...c, ...patch };
      if (patch.brand_name) next.abbreviation = autoAbbreviation(patch.brand_name);
      return next;
    });
    setDirty(true);
  };

  const updateContent = (section, patch) => {
    setContent((c) => ({ ...c, [section]: { ...(c?.[section] || {}), ...patch } }));
    setDirty(true);
  };

  const updateContentRaw = (section, value) => {
    setContent((c) => ({ ...c, [section]: value }));
    setDirty(true);
  };

  const save = async () => {
    if (!country) return;
    setSaving(true);
    try {
      const { id: _ignore, created_at, updated_at, ...rest } = country;
      await api.patch(`/admin/countries/${id}`, rest);
      await api.patch(`/admin/countries/${id}/content`, { content });
      toast.success("Saved");
      setDirty(false);
      refreshCountries();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!country) return;
    try {
      const url = country.status === "published" ? "unpublish" : "publish";
      const { data } = await api.post(`/admin/countries/${id}/${url}`);
      setCountry((c) => ({ ...c, status: data.status }));
      toast.success(data.status === "published" ? "Published" : "Unpublished");
      refreshCountries();
    } catch {
      toast.error("Failed");
    }
  };

  const resetContent = async () => {
    if (!window.confirm("Reset all content to default template? Unsaved changes will be lost.")) return;
    try {
      await api.post(`/admin/countries/${id}/reset-content`);
      const { data } = await api.get(`/admin/countries/${id}`);
      setContent(data.content || {});
      setDirty(false);
      toast.success("Content reset to defaults");
    } catch {
      toast.error("Failed to reset");
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/admin/countries/${id}`);
      toast.success("Country deleted");
      refreshCountries();
      navigate("/admin");
    } catch {
      toast.error("Failed");
    }
  };

  const [activeTab, setActiveTab] = React.useState("general");
  const handleFix = React.useCallback((fix) => {
    if (fix?.tab) {
      setActiveTab(fix.tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  if (loading || !country) {
    return (
      <div className="p-8 lg:p-12 grid place-items-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  const cScore = contentScore(content || {}).score;
  const sScore = seoScore(country, content || {}).score;

  return (
    <div className="flex flex-col min-h-screen" data-testid="country-edit-page">
      {/* Top bar */}
      <div className="sticky top-14 md:top-0 z-30 bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {country.slug} · {country.locale}
          </div>
          <div className="font-display text-[18px] sm:text-[20px] font-bold tracking-tight text-zinc-50 flex items-center gap-2 flex-wrap">
            <span>{country.flag}</span>
            <span className="truncate max-w-[60vw] sm:max-w-none">{country.brand_name}</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                country.status === "published"
                  ? "border-green-900/60 bg-green-950/40 text-green-300"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${country.status === "published" ? "bg-green-500" : "bg-zinc-500"}`} />
              {country.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/preview/${country.slug}`}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-zinc-300 hover:text-zinc-50 border border-zinc-700 hover:bg-zinc-800 rounded-full transition-colors"
            data-testid="preview-link"
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePublish}
            className="h-9 px-3 rounded-full text-[12.5px] font-medium border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50"
            data-testid="toggle-publish"
          >
            {country.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="h-9 px-4 bg-white hover:bg-zinc-200 text-zinc-950 rounded-full text-[12.5px] font-medium disabled:opacity-40 ml-auto sm:ml-0"
            data-testid="save-button"
          >
            {saving ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving</>
            ) : (
              <><Save className="h-3.5 w-3.5 mr-1.5" />Save changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Quality monitor */}
      <div className="bg-zinc-950/40 border-b border-zinc-800 px-4 sm:px-8 lg:px-12 py-3 flex flex-col sm:flex-row gap-2">
        <QualityBar label="Content quality" value={cScore} testid="quality-content" />
        <QualityBar label="SEO quality" value={sScore} testid="quality-seo" />
      </div>

      {dirty && (
        <div className="bg-amber-950/40 border-b border-amber-900/60 px-4 sm:px-8 lg:px-12 py-2 text-[12.5px] text-amber-300 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          You have unsaved changes.
        </div>
      )}

      {/* Body */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 w-full sm:w-auto overflow-x-auto flex justify-start no-scrollbar">
              <TabsTrigger value="general" data-testid="tab-general" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">General</TabsTrigger>
              <TabsTrigger value="blog" data-testid="tab-blog" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Blog</TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Content</TabsTrigger>
              <TabsTrigger value="seo" data-testid="tab-seo" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">SEO</TabsTrigger>
              <TabsTrigger value="seo-tests" data-testid="tab-seo-tests" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">SEO tests</TabsTrigger>
              <TabsTrigger value="tracking" data-testid="tab-tracking" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Tracking</TabsTrigger>
              <TabsTrigger value="b2bhub" data-testid="tab-b2bhub" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">B2BHub</TabsTrigger>
              <TabsTrigger value="danger" data-testid="tab-danger" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-zinc-400">Danger</TabsTrigger>
            </TabsList>

            {/* GENERAL */}
            <TabsContent value="general" className="space-y-5">
              <Section title="Identity" eyebrow="General">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Slug" value={country.slug} onChange={(v) => updateCountry({ slug: v })} testid="field-slug" />
                  <Field label="Domain" value={country.domain} onChange={(v) => updateCountry({ domain: v })} hint="auto SSL" testid="field-domain" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name (short)" value={country.name} onChange={(v) => updateCountry({ name: v })} testid="field-name" />
                  <Field label="Long name" value={country.long_name} onChange={(v) => updateCountry({ long_name: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Flag" value={country.flag} onChange={(v) => updateCountry({ flag: v })} />
                  <Field label="Locale" value={country.locale} onChange={(v) => updateCountry({ locale: v })} />
                  <Field label="Country code" value={country.country_code} onChange={(v) => updateCountry({ country_code: v })} />
                </div>
              </Section>

              <Section title="Branding">
                <Field label="Brand name" value={country.brand_name} onChange={(v) => updateCountry({ brand_name: v })} testid="field-brand-name" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Field label="Auto abbreviation" value={country.abbreviation} onChange={(v) => updateCountry({ abbreviation: v })} hint="logo" testid="field-abbreviation" />
                  <Field label="Brand color" type="color" value={country.brand_color} onChange={(v) => updateCountry({ brand_color: v })} testid="field-brand-color" />
                  <Field label="Accent color" type="color" value={country.accent_color} onChange={(v) => updateCountry({ accent_color: v })} testid="field-accent-color" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <Label className="text-[12px] font-medium text-zinc-300 block mb-1.5">Logo preview</Label>
                    <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/60 rounded-lg px-4 py-3">
                      <BrandMark
                        brandName={country.brand_name}
                        abbreviation={country.abbreviation}
                        color={country.brand_color}
                        size="md"
                      />
                      <span className="font-display font-bold text-[16px] tracking-tight text-zinc-50">
                        {country.brand_name}
                      </span>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Authority & legal">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Currency" value={country.currency} onChange={(v) => updateCountry({ currency: v })} />
                  <Field label="Symbol" value={country.currency_symbol} onChange={(v) => updateCountry({ currency_symbol: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Capital city / Registered office hub" value={country.capital} onChange={(v) => updateCountry({ capital: v })} />
                  <Field label="Company type" value={country.company_type} onChange={(v) => updateCountry({ company_type: v })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Authority name" value={country.authority_name} onChange={(v) => updateCountry({ authority_name: v })} />
                  <Field label="Authority short code" value={country.authority_short} onChange={(v) => updateCountry({ authority_short: v })} />
                </div>
                <Field label="Legal suffix" value={country.legal_suffix} onChange={(v) => updateCountry({ legal_suffix: v })} multiline />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Business phone (E.164)" value={country.phone} onChange={(v) => updateCountry({ phone: v })} hint="+44 20 1234 5678 — used in LocalBusiness schema + footer" />
                  <Field label="Street address" value={country.address} onChange={(v) => updateCountry({ address: v })} hint="e.g. 71-75 Shelton Street, London — feeds LocalBusiness schema" />
                </div>
                <Field label="B2BHub country code" value={country.b2bhub_country_code} onChange={(v) => updateCountry({ b2bhub_country_code: v })} hint="GB / UA / DE…" />
              </Section>
            </TabsContent>

            {/* BLOG */}
            <TabsContent value="blog" className="space-y-5">
              <CountryBlogPanel country={country} />
            </TabsContent>

            {/* CONTENT */}
            <TabsContent value="content" className="space-y-5">
              <ContentEditor content={content || {}} updateContent={updateContent} updateContentRaw={updateContentRaw} />
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-5">
              <Section title="SEO meta">
                <Field
                  label="Page title"
                  value={content?.seo?.title}
                  onChange={(v) => updateContent("seo", { title: v })}
                  hint="< 60 chars"
                />
                <Field
                  label="Meta description"
                  value={content?.seo?.description}
                  onChange={(v) => updateContent("seo", { description: v })}
                  multiline
                  hint="< 160 chars"
                />
              </Section>
              <Section title="Google preview">
                <SerpPreview country={country} content={content || {}} />
              </Section>
            </TabsContent>

            {/* SEO TESTS */}
            <TabsContent value="seo-tests" className="space-y-5">
              <SeoTestsPanel country={country} content={content || {}} onFix={handleFix} />
            </TabsContent>

            {/* TRACKING */}
            <TabsContent value="tracking" className="space-y-5">
              <Section title="Verification" eyebrow="Search consoles">
                <p className="text-[12.5px] text-zinc-500 -mt-1 mb-1">
                  Paste only the <span className="font-mono text-zinc-400">content</span> value
                  from each platform's verification meta tag. We'll inject the full{" "}
                  <code className="font-mono text-zinc-400">&lt;meta&gt;</code> tag for you.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Google Search Console"
                    hint="google-site-verification"
                    value={content?.tracking?.google_site_verification}
                    onChange={(v) => updateContent("tracking", { google_site_verification: v })}
                    testid="tt-google-verify"
                  />
                  <Field
                    label="Bing Webmaster"
                    hint="msvalidate.01"
                    value={content?.tracking?.bing_site_verification}
                    onChange={(v) => updateContent("tracking", { bing_site_verification: v })}
                    testid="tt-bing-verify"
                  />
                  <Field
                    label="Facebook domain verification"
                    hint="facebook-domain-verification"
                    value={content?.tracking?.facebook_domain_verification}
                    onChange={(v) => updateContent("tracking", { facebook_domain_verification: v })}
                    testid="tt-fb-domain"
                  />
                  <Field
                    label="Pinterest verification"
                    hint="p:domain_verify"
                    value={content?.tracking?.pinterest_verification}
                    onChange={(v) => updateContent("tracking", { pinterest_verification: v })}
                    testid="tt-pin-verify"
                  />
                </div>
              </Section>

              <Section title="Analytics & tag managers" eyebrow="Measurement">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Google Analytics 4"
                    hint="G-XXXXXXXX"
                    value={content?.tracking?.ga4_id}
                    onChange={(v) => updateContent("tracking", { ga4_id: v })}
                    testid="tt-ga4"
                  />
                  <Field
                    label="Google Tag Manager"
                    hint="GTM-XXXXXX"
                    value={content?.tracking?.gtm_id}
                    onChange={(v) => updateContent("tracking", { gtm_id: v })}
                    testid="tt-gtm"
                  />
                  <Field
                    label="Microsoft Clarity"
                    hint="project id"
                    value={content?.tracking?.clarity_id}
                    onChange={(v) => updateContent("tracking", { clarity_id: v })}
                    testid="tt-clarity"
                  />
                  <Field
                    label="Hotjar"
                    hint="numeric site id"
                    value={content?.tracking?.hotjar_id}
                    onChange={(v) => updateContent("tracking", { hotjar_id: v })}
                    testid="tt-hotjar"
                  />
                  <Field
                    label="Plausible domain"
                    hint="data-domain"
                    value={content?.tracking?.plausible_domain}
                    onChange={(v) => updateContent("tracking", { plausible_domain: v })}
                    testid="tt-plausible"
                  />
                </div>
              </Section>

              <Section title="Ad pixels" eyebrow="Conversion">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Meta (Facebook) Pixel"
                    hint="numeric id"
                    value={content?.tracking?.facebook_pixel_id}
                    onChange={(v) => updateContent("tracking", { facebook_pixel_id: v })}
                    testid="tt-fb-pixel"
                  />
                  <Field
                    label="LinkedIn Insight Tag"
                    hint="partner id"
                    value={content?.tracking?.linkedin_partner_id}
                    onChange={(v) => updateContent("tracking", { linkedin_partner_id: v })}
                    testid="tt-li-tag"
                  />
                  <Field
                    label="X (Twitter) Pixel"
                    hint="pixel id"
                    value={content?.tracking?.twitter_pixel_id}
                    onChange={(v) => updateContent("tracking", { twitter_pixel_id: v })}
                    testid="tt-twq"
                  />
                  <Field
                    label="TikTok Pixel"
                    hint="sdk id"
                    value={content?.tracking?.tiktok_pixel_id}
                    onChange={(v) => updateContent("tracking", { tiktok_pixel_id: v })}
                    testid="tt-ttq"
                  />
                  <Field
                    label="Pinterest Tag"
                    hint="tag id"
                    value={content?.tracking?.pinterest_tag_id}
                    onChange={(v) => updateContent("tracking", { pinterest_tag_id: v })}
                    testid="tt-pintrk"
                  />
                </div>
              </Section>

              <Section title="Custom HTML" eyebrow="Advanced">
                <p className="text-[12.5px] text-zinc-500 -mt-1">
                  Anything else? Paste raw HTML (including{" "}
                  <code className="font-mono text-zinc-400">&lt;script&gt;</code> tags) to inject
                  into the page. Scripts will execute live on every page load.
                </p>
                <Field
                  label="Inject into <head>"
                  hint="raw HTML"
                  value={content?.tracking?.custom_head_html}
                  onChange={(v) => updateContent("tracking", { custom_head_html: v })}
                  multiline
                  testid="tt-custom-head"
                />
                <Field
                  label="Inject before </body>"
                  hint="raw HTML"
                  value={content?.tracking?.custom_body_html}
                  onChange={(v) => updateContent("tracking", { custom_body_html: v })}
                  multiline
                  testid="tt-custom-body"
                />
              </Section>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-[12px] text-zinc-400 leading-relaxed">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">
                  Live preview tip
                </div>
                Tags are loaded only on the public landing page (not in /admin). Save your changes,
                then open <code className="font-mono text-zinc-300">/preview/{country.slug}</code>{" "}
                in a new tab to verify the platform-specific debugger (e.g. GA4 DebugView, Meta
                Pixel Helper, GTM Preview) sees the events.
              </div>
            </TabsContent>

            {/* B2BHUB */}
            <TabsContent value="b2bhub" className="space-y-5">
              <Section title="B2BHub.ltd data" eyebrow="Integration">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[12.5px] text-zinc-300">
                    Source for company-formation metadata. Currently{" "}
                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full ${
                      b2bhub?.is_mocked ? "bg-amber-950/40 text-amber-300 border border-amber-900/60" : "bg-green-950/40 text-green-300 border border-green-900/60"
                    }`}>
                      {b2bhub?.is_mocked ? "MOCKED" : "LIVE"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { data } = await api.get(`/admin/b2bhub/${country.b2bhub_country_code}`);
                        setB2bhub(data);
                        toast.success("B2BHub data refreshed");
                      } catch {
                        toast.error("Failed");
                      }
                    }}
                    className="h-8 text-[12px] rounded-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1.5" />
                    Refresh
                  </Button>
                </div>
                {b2bhub ? (
                  <pre className="bg-zinc-950 text-zinc-200 rounded-lg p-4 text-[11.5px] overflow-x-auto font-mono leading-relaxed border border-zinc-800">
                    {JSON.stringify(b2bhub, null, 2)}
                  </pre>
                ) : (
                  <div className="text-[12.5px] text-zinc-500">Loading…</div>
                )}
              </Section>
            </TabsContent>

            {/* DANGER */}
            <TabsContent value="danger" className="space-y-5">
              <Section title="Reset content" eyebrow="Danger zone">
                <p className="text-[13px] text-zinc-400">
                  Restore all sections of this country's landing page to the default template.
                  Country identity, branding and domain settings are not affected.
                </p>
                <Button
                  variant="outline"
                  onClick={resetContent}
                  className="border-amber-900/70 text-amber-300 bg-transparent hover:bg-amber-950/40 rounded-full h-9 text-[12.5px]"
                  data-testid="reset-content"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reset to defaults
                </Button>
              </Section>

              <Section title="Delete country">
                <p className="text-[13px] text-zinc-400">
                  Permanently delete this country, its content, and unlink the domain. This cannot
                  be undone.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(true)}
                  className="border-red-900/70 text-red-300 bg-transparent hover:bg-red-950/40 rounded-full h-9 text-[12.5px]"
                  data-testid="delete-country"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete this country
                </Button>
              </Section>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-display text-[20px] font-bold tracking-tight text-zinc-50">
              Delete {country.brand_name}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13.5px] text-zinc-400 my-2">
            All content for <span className="font-mono text-zinc-200">{country.domain}</span> will be permanently
            removed.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50">
              Cancel
            </Button>
            <Button onClick={remove} className="bg-red-600 hover:bg-red-700 text-white rounded-full" data-testid="confirm-delete">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content editor (collapsible per section)
// ─────────────────────────────────────────────────────────────────────────────
function ContentEditor({ content, updateContent, updateContentRaw }) {
  const c = content;
  return (
    <div className="space-y-5">
      <Section title="Hero" eyebrow="Section">
        <Field label="Badge text" value={c.hero?.badge} onChange={(v) => updateContent("hero", { badge: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Headline prefix" value={c.hero?.headline_prefix} onChange={(v) => updateContent("hero", { headline_prefix: v })} />
          <Field label="Highlight" value={c.hero?.headline_highlight} onChange={(v) => updateContent("hero", { headline_highlight: v })} hint="boxed" />
        </div>
        <Field label="Headline suffix (price line)" value={c.hero?.headline_suffix} onChange={(v) => updateContent("hero", { headline_suffix: v })} />
        <Field label="Sub-headline" multiline value={c.hero?.sub} onChange={(v) => updateContent("hero", { sub: v })} />
        <Field label="Fee note" value={c.hero?.fee_note} onChange={(v) => updateContent("hero", { fee_note: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Primary CTA" value={c.hero?.cta_primary} onChange={(v) => updateContent("hero", { cta_primary: v })} />
          <Field label="Secondary CTA" value={c.hero?.cta_secondary} onChange={(v) => updateContent("hero", { cta_secondary: v })} />
        </div>
      </Section>

      <Accordion type="multiple" className="space-y-3">
        <SectionAccordion value="trust" title="Trust bar">
          <Field label="Eyebrow" value={c.trust_bar?.eyebrow} onChange={(v) => updateContent("trust_bar", { eyebrow: v })} />
          <Field label="Right text (e.g. active count)" value={c.trust_bar?.right_text} onChange={(v) => updateContent("trust_bar", { right_text: v })} />
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Partners</Label>
          <ListEditor
            items={c.trust_bar?.partners || []}
            onChange={(arr) => updateContent("trust_bar", { partners: arr })}
            makeNew={() => ({ icon: "Star", label: "" })}
            renderItem={(it, patch) => (
              <div className="grid grid-cols-2 gap-2">
                <Input value={it.icon || ""} onChange={(e) => patch({ icon: e.target.value })} placeholder="Lucide icon (e.g. Banknote)" className="h-9" />
                <Input value={it.label || ""} onChange={(e) => patch({ label: e.target.value })} placeholder="Label" className="h-9" />
              </div>
            )}
            addLabel="Add partner"
          />
        </SectionAccordion>

        <SectionAccordion value="how" title="How it works">
          <Field label="Eyebrow" value={c.how_it_works?.eyebrow} onChange={(v) => updateContent("how_it_works", { eyebrow: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={c.how_it_works?.title} onChange={(v) => updateContent("how_it_works", { title: v })} />
            <Field label="Title secondary" value={c.how_it_works?.title_secondary} onChange={(v) => updateContent("how_it_works", { title_secondary: v })} />
          </div>
          <Field label="Lead paragraph" multiline value={c.how_it_works?.lead} onChange={(v) => updateContent("how_it_works", { lead: v })} />
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Steps</Label>
          <ListEditor
            items={c.how_it_works?.steps || []}
            onChange={(arr) => updateContent("how_it_works", { steps: arr })}
            makeNew={() => ({ n: "0X", icon: "Star", title: "", body: "", tag: "" })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={it.n || ""} onChange={(e) => patch({ n: e.target.value })} placeholder="01" className="h-9" />
                  <Input value={it.icon || ""} onChange={(e) => patch({ icon: e.target.value })} placeholder="Search" className="h-9" />
                  <Input value={it.tag || ""} onChange={(e) => patch({ tag: e.target.value })} placeholder="~6 min" className="h-9" />
                </div>
                <Input value={it.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Title" className="h-9" />
                <Input value={it.body || ""} onChange={(e) => patch({ body: e.target.value })} placeholder="Body" className="h-9" />
              </div>
            )}
            addLabel="Add step"
          />
        </SectionAccordion>

        <SectionAccordion value="pricing" title="Pricing">
          <Field label="Eyebrow" value={c.pricing?.eyebrow} onChange={(v) => updateContent("pricing", { eyebrow: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={c.pricing?.title} onChange={(v) => updateContent("pricing", { title: v })} />
            <Field label="Title secondary" value={c.pricing?.title_secondary} onChange={(v) => updateContent("pricing", { title_secondary: v })} />
          </div>
          <Field label="Lead paragraph" multiline value={c.pricing?.lead} onChange={(v) => updateContent("pricing", { lead: v })} />
          <Field label="Footnote" value={c.pricing?.footnote} onChange={(v) => updateContent("pricing", { footnote: v })} />
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Tiers</Label>
          <ListEditor
            items={c.pricing?.tiers || []}
            onChange={(arr) => updateContent("pricing", { tiers: arr })}
            makeNew={() => ({ id: "new", name: "New tier", tagline: "", price: "0", fee: "", cta: "Get started", inverse: false, popular: false, features: [] })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <Input value={it.id || ""} onChange={(e) => patch({ id: e.target.value })} placeholder="id" className="h-9" />
                  <Input value={it.name || ""} onChange={(e) => patch({ name: e.target.value })} placeholder="Name" className="h-9" />
                  <Input value={it.price || ""} onChange={(e) => patch({ price: e.target.value })} placeholder="Price" className="h-9" />
                  <Input value={it.fee || ""} onChange={(e) => patch({ fee: e.target.value })} placeholder="Fee" className="h-9" />
                </div>
                <Input value={it.tagline || ""} onChange={(e) => patch({ tagline: e.target.value })} placeholder="Tagline" className="h-9" />
                <Input value={it.cta || ""} onChange={(e) => patch({ cta: e.target.value })} placeholder="CTA" className="h-9" />
                <div className="flex items-center gap-3 text-[12px] py-1">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!it.inverse} onChange={(e) => patch({ inverse: e.target.checked })} />Inverse (dark)</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={!!it.popular} onChange={(e) => patch({ popular: e.target.checked })} />Popular badge</label>
                </div>
                <Label className="text-[11px] font-medium text-neutral-600 mt-1 block">Features</Label>
                <StringListEditor items={it.features || []} onChange={(arr) => patch({ features: arr })} />
              </div>
            )}
            addLabel="Add tier"
          />
        </SectionAccordion>

        <SectionAccordion value="benefits" title="Benefits">
          <Field label="Eyebrow" value={c.benefits?.eyebrow} onChange={(v) => updateContent("benefits", { eyebrow: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={c.benefits?.title} onChange={(v) => updateContent("benefits", { title: v })} />
            <Field label="Title secondary" value={c.benefits?.title_secondary} onChange={(v) => updateContent("benefits", { title_secondary: v })} />
          </div>
          <Field label="Lead" multiline value={c.benefits?.lead} onChange={(v) => updateContent("benefits", { lead: v })} />
          <Field label="CTA strip text" value={c.benefits?.cta_text} onChange={(v) => updateContent("benefits", { cta_text: v })} />
          <Field label="CTA strip sub" value={c.benefits?.cta_sub} onChange={(v) => updateContent("benefits", { cta_sub: v })} />
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Items</Label>
          <ListEditor
            items={c.benefits?.items || []}
            onChange={(arr) => updateContent("benefits", { items: arr })}
            makeNew={() => ({ icon: "Star", title: "", body: "", span: "md:col-span-4" })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Input value={it.icon || ""} onChange={(e) => patch({ icon: e.target.value })} placeholder="Icon" className="h-9" />
                  <Input value={it.span || ""} onChange={(e) => patch({ span: e.target.value })} placeholder="md:col-span-4" className="h-9" />
                  <Input value={it.stat_value || ""} onChange={(e) => patch({ stat_value: e.target.value })} placeholder="stat (opt)" className="h-9" />
                </div>
                <Input value={it.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Title" className="h-9" />
                <Input value={it.body || ""} onChange={(e) => patch({ body: e.target.value })} placeholder="Body" className="h-9" />
                <Input value={it.stat_label || ""} onChange={(e) => patch({ stat_label: e.target.value })} placeholder="stat label (opt)" className="h-9" />
              </div>
            )}
            addLabel="Add benefit"
          />
        </SectionAccordion>

        <SectionAccordion value="testimonials" title="Testimonials">
          <Field label="Eyebrow" value={c.testimonials?.eyebrow} onChange={(v) => updateContent("testimonials", { eyebrow: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={c.testimonials?.title} onChange={(v) => updateContent("testimonials", { title: v })} />
            <Field label="Title secondary" value={c.testimonials?.title_secondary} onChange={(v) => updateContent("testimonials", { title_secondary: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Rating" value={c.testimonials?.rating} onChange={(v) => updateContent("testimonials", { rating: v })} />
            <Field label="Rating subtext" value={c.testimonials?.rating_sub} onChange={(v) => updateContent("testimonials", { rating_sub: v })} />
          </div>
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Quotes</Label>
          <ListEditor
            items={c.testimonials?.items || []}
            onChange={(arr) => updateContent("testimonials", { items: arr })}
            makeNew={() => ({ quote: "", name: "", role: "", img: "" })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <Input value={it.quote || ""} onChange={(e) => patch({ quote: e.target.value })} placeholder="Quote" className="h-9" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={it.name || ""} onChange={(e) => patch({ name: e.target.value })} placeholder="Name" className="h-9" />
                  <Input value={it.role || ""} onChange={(e) => patch({ role: e.target.value })} placeholder="Role" className="h-9" />
                </div>
                <Input value={it.img || ""} onChange={(e) => patch({ img: e.target.value })} placeholder="Image URL" className="h-9" />
              </div>
            )}
            addLabel="Add testimonial"
          />
        </SectionAccordion>

        <SectionAccordion value="faqs" title="FAQs">
          <Field label="Eyebrow" value={c.faqs?.eyebrow} onChange={(v) => updateContent("faqs", { eyebrow: v })} />
          <Field label="Title" value={c.faqs?.title} onChange={(v) => updateContent("faqs", { title: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contact line" value={c.faqs?.contact_line} onChange={(v) => updateContent("faqs", { contact_line: v })} />
            <Field label="Contact CTA" value={c.faqs?.contact_cta} onChange={(v) => updateContent("faqs", { contact_cta: v })} />
          </div>
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Q & A</Label>
          <ListEditor
            items={c.faqs?.items || []}
            onChange={(arr) => updateContent("faqs", { items: arr })}
            makeNew={() => ({ q: "", a: "" })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <Input value={it.q || ""} onChange={(e) => patch({ q: e.target.value })} placeholder="Question" className="h-9" />
                <textarea
                  value={it.a || ""}
                  onChange={(e) => patch({ a: e.target.value })}
                  placeholder="Answer"
                  className="w-full text-[13.5px] rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>
            )}
            addLabel="Add Q & A"
          />
        </SectionAccordion>

        <SectionAccordion value="final" title="Final CTA">
          <Field label="Eyebrow" value={c.final_cta?.eyebrow} onChange={(v) => updateContent("final_cta", { eyebrow: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Headline" value={c.final_cta?.headline} onChange={(v) => updateContent("final_cta", { headline: v })} />
            <Field label="Headline secondary" value={c.final_cta?.headline_secondary} onChange={(v) => updateContent("final_cta", { headline_secondary: v })} />
          </div>
          <Field label="Sub" multiline value={c.final_cta?.sub} onChange={(v) => updateContent("final_cta", { sub: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Primary CTA" value={c.final_cta?.cta_primary} onChange={(v) => updateContent("final_cta", { cta_primary: v })} />
            <Field label="Secondary CTA" value={c.final_cta?.cta_secondary} onChange={(v) => updateContent("final_cta", { cta_secondary: v })} />
          </div>
          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Chips (value + label)</Label>
          <ListEditor
            items={c.final_cta?.chips || []}
            onChange={(arr) => updateContent("final_cta", { chips: arr })}
            makeNew={() => ({ v: "", l: "" })}
            renderItem={(it, patch) => (
              <div className="grid grid-cols-2 gap-2">
                <Input value={it.v || ""} onChange={(e) => patch({ v: e.target.value })} placeholder="£12.99" className="h-9" />
                <Input value={it.l || ""} onChange={(e) => patch({ l: e.target.value })} placeholder="from" className="h-9" />
              </div>
            )}
          />
        </SectionAccordion>

        <SectionAccordion value="footer" title="Footer">
          <Field label="Tagline" multiline value={c.footer?.tagline} onChange={(v) => updateContent("footer", { tagline: v })} />
          <Field label="Badge text" value={c.footer?.badge_text} onChange={(v) => updateContent("footer", { badge_text: v })} />
          <Field label="Legal line" value={c.footer?.legal} onChange={(v) => updateContent("footer", { legal: v })} hint="{year} = current year" />
          <Field label="Made-in line" value={c.footer?.made_in} onChange={(v) => updateContent("footer", { made_in: v })} />

          <Label className="text-[12px] font-medium text-zinc-300 block mt-4 mb-1.5">Social links</Label>
          <div className="grid sm:grid-cols-2 gap-2.5 mb-2">
            <Field
              label="Instagram URL"
              value={c.footer?.social?.instagram}
              onChange={(v) => updateContent("footer", { social: { ...(c.footer?.social || {}), instagram: v } })}
              hint="https://instagram.com/yourbrand"
            />
            <Field
              label="X (Twitter) URL"
              value={c.footer?.social?.x}
              onChange={(v) => updateContent("footer", { social: { ...(c.footer?.social || {}), x: v } })}
              hint="https://x.com/yourbrand"
            />
            <Field
              label="Facebook URL"
              value={c.footer?.social?.facebook}
              onChange={(v) => updateContent("footer", { social: { ...(c.footer?.social || {}), facebook: v } })}
              hint="https://facebook.com/yourbrand"
            />
            <Field
              label="LinkedIn URL"
              value={c.footer?.social?.linkedin}
              onChange={(v) => updateContent("footer", { social: { ...(c.footer?.social || {}), linkedin: v } })}
              hint="https://linkedin.com/company/yourbrand"
            />
          </div>

          <Label className="text-[12px] font-medium text-neutral-700 block mt-2">Columns</Label>
          <ListEditor
            items={c.footer?.columns || []}
            onChange={(arr) => updateContent("footer", { columns: arr })}
            makeNew={() => ({ title: "Column", links: [] })}
            renderItem={(it, patch) => (
              <div className="space-y-2">
                <Input value={it.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Column title" className="h-9" />
                <StringListEditor items={it.links || []} onChange={(arr) => patch({ links: arr })} />
              </div>
            )}
            addLabel="Add column"
          />
        </SectionAccordion>
      </Accordion>
    </div>
  );
}

function SectionAccordion({ value, title, children }) {
  return (
    <AccordionItem value={value} className="border border-zinc-800 bg-zinc-900 rounded-xl px-5 data-[state=open]:bg-zinc-900">
      <AccordionTrigger className="font-display font-semibold text-[15px] tracking-tight py-4 hover:no-underline text-zinc-50">
        {title}
      </AccordionTrigger>
      <AccordionContent className="pb-5 pt-1 space-y-3.5">{children}</AccordionContent>
    </AccordionItem>
  );
}
