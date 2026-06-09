import React from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { ArrowRight, Calendar, Clock } from "lucide-react";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fullUrl = (u) => (u && u.startsWith("/") ? `${API_ORIGIN}${u}` : u);

/**
 * Latest blog posts section shown on each landing page.
 * Hidden gracefully if no posts are published yet.
 */
export default function BlogSection({ country, tenant }) {
  const [posts, setPosts] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const params = tenant ? `?tenant=${tenant}&limit=3` : "?limit=3";
        const { data } = await api.get(`/public/blog${params}`);
        setPosts(data.posts || []);
      } catch { /* swallow */ } finally { setLoaded(true); }
    })();
  }, [tenant]);

  if (!loaded || posts.length === 0) return null;

  const blogHref = tenant ? `/preview/${tenant}/blog` : "/blog";

  return (
    <section className="bg-white text-zinc-900 py-20 sm:py-28" data-testid="landing-blog-section">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">Blog</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">Latest articles</h2>
            <p className="text-zinc-600 mt-2 max-w-lg text-[14px]">Practical guides on starting a company {country?.name ? `in ${country.name}` : "anywhere in the world"}.</p>
          </div>
          <Link
            to={blogHref}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-900 hover:underline"
          >
            All articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => {
            const href = tenant ? `/preview/${tenant}/blog/${p.slug}` : `/blog/${p.slug}`;
            const date = p.published_at ? new Date(p.published_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;
            return (
              <li key={p.id}>
                <Link to={href} className="group block" data-testid={`landing-blog-${p.slug}`}>
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-zinc-100 mb-4">
                    {p.cover_url ? (
                      <img src={fullUrl(p.cover_url)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-zinc-400 text-xs">No cover</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mb-1.5">
                    {date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{p.read_time} min</span>
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-zinc-950 leading-snug group-hover:underline">{p.title}</h3>
                  {p.excerpt && <p className="text-[13.5px] text-zinc-600 mt-1.5 line-clamp-2">{p.excerpt}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
