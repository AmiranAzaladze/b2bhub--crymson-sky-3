import React from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { Plus, FileText, Loader2, Search, ArrowUpRight } from "lucide-react";
import { toFullUrl } from "../../components/admin/MediaUpload";

const STATUS_CHIP = {
  published: "bg-emerald-950/40 text-emerald-300 border border-emerald-900/60",
  draft: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

export default function AdminBlogList() {
  const navigate = useNavigate();
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/blog");
      setPosts(data || []);
    } finally { setLoading(false); }
  }

  async function newPost() {
    const { data } = await api.post("/admin/blog", { title: "Untitled post", status: "draft" });
    navigate(`/admin/blog/${data.id}`);
  }

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [p.title, p.slug, (p.tags || []).join(" ")].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-8 lg:p-12 max-w-[1100px] mx-auto space-y-6" data-testid="admin-blog-list">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Content</div>
          <h1 className="font-display text-[28px] sm:text-[34px] font-bold tracking-tight text-zinc-50 flex items-center gap-3">
            <FileText className="h-6 w-6 text-zinc-400" />
            Blog
          </h1>
          <p className="text-[13px] text-zinc-400 mt-1">{posts.length} post{posts.length === 1 ? "" : "s"} — articles can be per-country or global (visible on every landing).</p>
        </div>
        <button
          onClick={newPost}
          data-testid="blog-new-btn"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-zinc-50 text-zinc-950 font-medium text-[13px] hover:bg-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, tag…"
            className="h-9 w-full pl-8 pr-3 rounded-md bg-zinc-900 border border-zinc-700 text-[12.5px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            data-testid="blog-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-[12.5px] text-zinc-100"
        >
          <option value="all">All</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-[13px]">
            {posts.length === 0 ? "No posts yet — click 'New post' to write your first article." : "No posts match the filters."}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filtered.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/admin/blog/${p.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                  data-testid={`blog-row-${p.slug}`}
                >
                  <div className="h-14 w-20 rounded-md overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0">
                    {p.cover_url ? <img src={toFullUrl(p.cover_url)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-zinc-100 truncate">{p.title || <span className="text-zinc-500 italic">Untitled</span>}</div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      /{p.slug} · {p.read_time} min read · {(p.tags || []).slice(0, 3).join(", ") || "no tags"}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_CHIP[p.status]}`}>{p.status}</span>
                  <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
