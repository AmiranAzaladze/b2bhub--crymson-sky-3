import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { Loader2, Save, Trash2, Eye, ArrowLeft, X, Plus } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "../../components/admin/RichTextEditor";
import { CoverUpload, GalleryUpload, toFullUrl } from "../../components/admin/MediaUpload";
import apiClient from "../../api/client";

export default function AdminBlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [countries, setCountries] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        const [postRes, countriesRes] = await Promise.all([
          api.get(`/admin/blog/${id}`),
          api.get("/admin/countries"),
        ]);
        setPost(postRes.data);
        setCountries(countriesRes.data || []);
      } catch (e) {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const update = (patch) => { setPost((p) => ({ ...p, ...patch })); setDirty(true); };
  const updateAuthor = (patch) => update({ author: { ...(post?.author || {}), ...patch } });

  async function save() {
    if (!post) return;
    setSaving(true);
    try {
      const payload = {
        title: post.title, slug: post.slug, excerpt: post.excerpt, body_html: post.body_html,
        cover_url: post.cover_url, gallery: post.gallery || [], tags: post.tags || [],
        author: post.author, links: post.links || [], status: post.status,
        seo_title: post.seo_title, seo_description: post.seo_description,
        country_id: post.country_id || null,
      };
      const { data } = await api.patch(`/admin/blog/${id}`, payload);
      setPost(data);
      setDirty(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  }

  async function togglePublish() {
    const next = post.status === "published" ? "draft" : "published";
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/blog/${id}`, { status: next });
      setPost(data);
      toast.success(next === "published" ? "Published" : "Unpublished");
    } finally { setSaving(false); }
  }

  async function del() {
    if (!window.confirm("Delete this post permanently?")) return;
    await api.delete(`/admin/blog/${id}`);
    toast.success("Deleted");
    navigate("/admin/blog");
  }

  if (loading || !post) {
    return <div className="p-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>;
  }

  const previewUrl = (() => {
    const c = countries.find((c) => c.id === post.country_id);
    // Build a safe same-origin preview URL. Falls back to "uk" when no country
    // is bound (global posts). URL-encodes the slug to survive spaces/weird chars.
    const tenantSlug = encodeURIComponent(c?.slug || "uk");
    const postSlug = encodeURIComponent(post.slug || "");
    const token = post.status !== "published" ? `?preview=${post.id}` : "";
    return `/preview/${tenantSlug}/blog/${postSlug}${token}`;
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" data-testid="admin-blog-editor">
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 sm:px-8 py-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/admin/blog")} className="inline-flex items-center gap-1 text-[12.5px] text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex-1 min-w-[200px] truncate">
          <span className="text-zinc-500 text-[11px] mr-2">{post.status.toUpperCase()}</span>
          <span className="text-[13px] truncate">{post.title || "Untitled"}</span>
        </div>
        {dirty && <span className="text-[11px] text-amber-300">Unsaved changes</span>}
        <button onClick={save} disabled={saving} data-testid="blog-save-btn" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-zinc-50 text-zinc-950 font-medium text-[12.5px] hover:bg-white disabled:opacity-60">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </button>
        <button onClick={togglePublish} data-testid="blog-publish-btn" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-700 text-zinc-100 font-medium text-[12.5px] hover:bg-zinc-800">
          {post.status === "published" ? "Unpublish" : "Publish"}
        </button>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-700 text-zinc-100 text-[12.5px] hover:bg-zinc-800">
          <Eye className="h-3.5 w-3.5" /> View
        </a>
        <button onClick={del} className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-rose-900 text-rose-300 hover:bg-rose-950/40" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>

      <div className="max-w-[1100px] mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* MAIN */}
        <div className="space-y-5 min-w-0">
          <FieldBlock label="Title">
            <input
              value={post.title || ""}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Article title"
              className="w-full h-12 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-[18px] font-display font-bold text-zinc-50 focus:outline-none focus:border-zinc-500"
              data-testid="blog-title"
            />
          </FieldBlock>

          <FieldBlock label="Slug" hint="URL: /blog/slug. Auto-set from title on first save.">
            <input
              value={post.slug || ""}
              onChange={(e) => update({ slug: e.target.value })}
              placeholder="my-article-slug"
              className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
            />
          </FieldBlock>

          <FieldBlock label="Excerpt" hint="Short summary shown in lists & search results.">
            <textarea
              value={post.excerpt || ""}
              onChange={(e) => update({ excerpt: e.target.value })}
              rows={2}
              maxLength={280}
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-[13px] text-zinc-100 focus:outline-none focus:border-zinc-500"
              placeholder="One-sentence summary…"
            />
          </FieldBlock>

          <FieldBlock label="Body">
            <RichTextEditor value={post.body_html || ""} onChange={(v) => update({ body_html: v })} />
            <div className="text-[10.5px] text-zinc-500 mt-1">Est. read time: {post.read_time || 1} min</div>
          </FieldBlock>

          <CoverUpload value={post.cover_url} onChange={(v) => update({ cover_url: v })} />
          <GalleryUpload value={post.gallery || []} onChange={(v) => update({ gallery: v })} />

          <FieldBlock label="Related links" hint="External links shown at the bottom of the article.">
            <RepeatableLinks value={post.links || []} onChange={(v) => update({ links: v })} />
          </FieldBlock>

          <FieldBlock label="SEO override" hint="Optional. Falls back to title/excerpt if blank.">
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                value={post.seo_title || ""}
                onChange={(e) => update({ seo_title: e.target.value })}
                placeholder="SEO title (<60 chars)"
                className="h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
              <input
                value={post.seo_description || ""}
                onChange={(e) => update({ seo_description: e.target.value })}
                placeholder="SEO description (<160 chars)"
                className="h-9 px-3 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </FieldBlock>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          <SidebarBlock title="Visibility">
            <select
              value={post.country_id || ""}
              onChange={(e) => update({ country_id: e.target.value || null })}
              className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100"
            >
              <option value="">— Pick a country —</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.flag_emoji ? c.flag_emoji + " " : ""}{c.name}</option>
              ))}
            </select>
            <div className="text-[10.5px] text-zinc-500 mt-1.5">
              Posts are strictly scoped to one country&apos;s landing.
              Use the Blog tab inside each country to manage that country&apos;s articles.
            </div>
          </SidebarBlock>

          <SidebarBlock title="Tags">
            <TagInput value={post.tags || []} onChange={(v) => update({ tags: v })} />
          </SidebarBlock>

          <SidebarBlock title="Author">
            <div className="text-[10.5px] text-zinc-500 mb-2">
              Use your real team name (e.g. &ldquo;Swift Editorial&rdquo; or your founder&apos;s name). Leave blank for anonymous — Google still indexes the post fine.
            </div>
            <input
              value={post.author?.name || ""}
              onChange={(e) => updateAuthor({ name: e.target.value })}
              placeholder='Name (e.g. "Swift Editorial")'
              className="w-full h-9 px-3 mb-2 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100"
            />
            <AuthorAvatar value={post.author?.avatar} onChange={(v) => updateAuthor({ avatar: v })} />
            <textarea
              value={post.author?.bio || ""}
              onChange={(e) => updateAuthor({ bio: e.target.value })}
              rows={2}
              placeholder='Short bio (e.g. "Formations team — 10 years helping founders.")'
              className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100 mt-2"
            />
          </SidebarBlock>
        </aside>
      </div>
    </div>
  );
}

const FieldBlock = ({ label, hint, children }) => (
  <div>
    <div className="flex items-end justify-between mb-1.5">
      <label className="text-[12px] font-medium text-zinc-300">{label}</label>
      {hint && <span className="text-[10.5px] text-zinc-500">{hint}</span>}
    </div>
    {children}
  </div>
);

const SidebarBlock = ({ title, children }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-2">{title}</div>
    {children}
  </div>
);

function AuthorAvatar({ value, onChange }) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await apiClient.post("/admin/blog/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <>
          <img src={toFullUrl(value)} alt="avatar" className="h-10 w-10 rounded-full object-cover border border-zinc-700" />
          <button type="button" onClick={() => onChange(null)} className="text-[11px] text-zinc-400 hover:text-rose-300">Remove</button>
        </>
      ) : (
        <>
          <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 grid place-items-center text-zinc-500 text-[10px]">No avatar</div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="text-[11px] text-zinc-300 hover:text-zinc-100 px-2 py-1 rounded border border-dashed border-zinc-700 hover:border-zinc-500"
          >
            {busy ? "Uploading…" : "Upload avatar"}
          </button>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

function TagInput({ value, onChange }) {
  const [v, setV] = React.useState("");
  const add = () => {
    const t = v.trim();
    if (!t) return;
    if (value.includes(t)) { setV(""); return; }
    onChange([...value, t]);
    setV("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200">
            {t}
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-zinc-500 hover:text-zinc-200">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add tag and press Enter"
          className="flex-1 h-8 px-2 rounded bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-100"
        />
        <button type="button" onClick={add} className="h-8 w-8 grid place-items-center rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700"><Plus className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function RepeatableLinks({ value, onChange }) {
  const update = (i, patch) => onChange(value.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={l.label || ""}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Label"
            className="w-1/3 h-9 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100"
          />
          <input
            value={l.url || ""}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="https://example.com"
            className="flex-1 h-9 px-2 rounded-md bg-zinc-900 border border-zinc-800 text-[12.5px] text-zinc-100"
          />
          <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="h-9 w-9 grid place-items-center rounded-md border border-zinc-800 text-zinc-400 hover:text-rose-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: "", url: "" }])}
        className="inline-flex items-center gap-1 text-[12px] text-zinc-300 hover:text-zinc-100 px-2 py-1 rounded border border-dashed border-zinc-700 hover:border-zinc-500"
      >
        <Plus className="h-3.5 w-3.5" /> Add link
      </button>
    </div>
  );
}
