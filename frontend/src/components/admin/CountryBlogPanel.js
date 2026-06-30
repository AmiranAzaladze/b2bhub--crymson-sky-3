import React from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { Plus, Loader2, ArrowUpRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { toFullUrl } from "./MediaUpload";

const STATUS_CHIP = {
  published: "bg-emerald-950/40 text-emerald-300 border border-emerald-900/60",
  draft: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

/**
 * Blog panel scoped to a single country. Lives inside the country edit page
 * as a tab. Lists all posts for this country + global posts (so the editor
 * can see what's actually shown on the landing).
 */
export default function CountryBlogPanel({ country }) {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/blog?country_id=${country.id}`);
      setPosts(data || []);
    } finally { setLoading(false); }
  }, [country.id]);

  React.useEffect(() => { load(); }, [load]);

  async function createPost() {
    setCreating(true);
    try {
      const { data } = await api.post("/admin/blog", {
        title: `New post — ${country.name || ""}`.trim(),
        status: "draft",
        country_id: country.id,
      });
      // Open editor in new tab so the user keeps their place in country edit
      window.open(`/admin/blog/${data.id}`, "_blank");
      // Refresh list after a tick so the row shows up
      setTimeout(load, 800);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create post");
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-4" data-testid="country-blog-panel">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Blog</div>
          <h2 className="font-display text-[18px] font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            Articles for {country.name || country.brand_name}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            Posts created here appear only on this country&apos;s blog.
          </p>
        </div>
        <button
          onClick={createPost}
          disabled={creating}
          data-testid="country-blog-new"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-zinc-50 text-zinc-950 font-medium text-[12.5px] hover:bg-white disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New post
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {loading ? (
          <div className="p-8 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-[13px]">
            No articles yet. Click <span className="text-zinc-200 font-medium">New post</span> to write your first article for {country.name}.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/admin/blog/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
                  data-testid={`country-blog-row-${p.slug}`}
                >
                  <div className="h-12 w-16 rounded-md overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                    {p.cover_url ? <img src={toFullUrl(p.cover_url)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-100 truncate text-[13px]">
                      {p._global && <span className="mr-1 text-[10px] opacity-70" title="Visible on every country's blog">🌍</span>}
                      {p.title || <span className="text-zinc-500 italic">Untitled</span>}
                    </div>
                    <div className="text-[10.5px] text-zinc-500 truncate mt-0.5">
                      /{p.slug} · {p.read_time} min · {(p.tags || []).slice(0, 3).join(", ") || "no tags"}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_CHIP[p.status]}`}>{p.status}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
