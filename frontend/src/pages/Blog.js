import React from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Loader2, Calendar, Clock } from "lucide-react";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fullUrl = (u) => (u && u.startsWith("/") ? `${API_ORIGIN}${u}` : u);

function readTenantSlug() {
  const m = window.location.pathname.match(/^\/preview\/([^/?#]+)/);
  return m ? m[1] : null;
}

/**
 * Public blog index page. Lists all published posts for the current tenant
 * (plus global posts). Tenant resolved from hostname OR ?tenant=/preview/.
 */
export default function Blog() {
  const tenant = readTenantSlug();
  const [posts, setPosts] = React.useState([]);
  const [country, setCountry] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const params = tenant ? `?tenant=${tenant}` : "";
        const [postsRes, landingRes] = await Promise.all([
          api.get(`/public/blog${params}`),
          api.get(`/public/landing${params || `?host=${window.location.hostname}`}`),
        ]);
        setPosts(postsRes.data.posts || []);
        setCountry(landingRes.data?.country || null);
      } finally { setLoading(false); }
    })();
  }, [tenant]);

  const homeLink = tenant ? `/preview/${tenant}` : "/";

  return (
    <div className="min-h-screen bg-white text-zinc-900" data-testid="public-blog-index">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to={homeLink} className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <span className="font-display font-bold tracking-tight text-[17px]">{country?.brand_name || "Swift Formations"}</span>
          </Link>
          <Link to={homeLink} className="text-[13px] text-zinc-600 hover:text-zinc-950">← Back to site</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Blog</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mt-1">Articles &amp; insights</h1>
          <p className="text-zinc-600 mt-3 max-w-xl">Guides, news and tips on starting a company {country?.name ? `in ${country.name}` : "anywhere in the world"}.</p>
        </div>

        {loading ? (
          <div className="py-20 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">No articles published yet.</div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => <PostCard key={p.id} post={p} tenant={tenant} />)}
          </ul>
        )}
      </main>
    </div>
  );
}

export function PostCard({ post, tenant }) {
  const href = tenant ? `/preview/${tenant}/blog/${post.slug}` : `/blog/${post.slug}`;
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <li>
      <Link to={href} className="group block" data-testid={`blog-card-${post.slug}`}>
        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 mb-4">
          {post.cover_url ? (
            <img src={fullUrl(post.cover_url)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full grid place-items-center text-zinc-400 text-xs">No cover</div>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-1.5">
          {date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time} min</span>
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-zinc-950 leading-snug group-hover:underline">{post.title}</h3>
        {post.excerpt && <p className="text-[13.5px] text-zinc-600 mt-1.5 line-clamp-3">{post.excerpt}</p>}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}
