import React from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { Loader2, Calendar, Clock, ExternalLink, ArrowLeft } from "lucide-react";

const API_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fullUrl = (u) => (u && u.startsWith("/") ? `${API_ORIGIN}${u}` : u);

function readTenantSlug() {
  const m = window.location.pathname.match(/^\/preview\/([^/?#]+)/);
  return m ? m[1] : null;
}

export default function BlogPost() {
  const params = useParams();
  // In `/preview/:slug/blog/:postSlug` the URL has both. The post slug is always last.
  const slug = params.postSlug || params.slug;
  const tenant = readTenantSlug();
  const [post, setPost] = React.useState(null);
  const [country, setCountry] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const previewToken = new URLSearchParams(window.location.search).get("preview");
        const qs = new URLSearchParams();
        if (tenant) qs.set("tenant", tenant);
        else qs.set("host", window.location.hostname);
        if (previewToken) qs.set("preview", previewToken);
        const landingQs = tenant ? `?tenant=${tenant}` : `?host=${window.location.hostname}`;
        const [postRes, landingRes] = await Promise.all([
          api.get(`/public/blog/${slug}?${qs.toString()}`),
          api.get(`/public/landing${landingQs}`),
        ]);
        setPost(postRes.data);
        setCountry(landingRes.data?.country || null);
      } catch (e) { setError(true); }
      finally { setLoading(false); }
    })();
  }, [slug, tenant]);

  // Inject SEO meta tags + Article JSON-LD
  React.useEffect(() => {
    if (!post) return;
    const t = post.seo_title || post.title;
    const d = post.seo_description || post.excerpt || "";
    document.title = t;
    setMeta("description", d);
    setMeta("og:title", t, "property");
    setMeta("og:description", d, "property");
    setMeta("og:type", "article", "property");
    if (post.cover_url) setMeta("og:image", fullUrl(post.cover_url), "property");

    const ld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.excerpt || undefined,
      image: post.cover_url ? fullUrl(post.cover_url) : undefined,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at || undefined,
      author: post.author?.name ? { "@type": "Person", name: post.author.name } : undefined,
      publisher: country?.brand_name ? {
        "@type": "Organization",
        name: country.brand_name,
        logo: { "@type": "ImageObject", url: `${window.location.origin}/logo.png` },
      } : undefined,
      mainEntityOfPage: { "@type": "WebPage", "@id": window.location.href },
      keywords: (post.tags || []).join(", ") || undefined,
    };
    const stripped = JSON.parse(JSON.stringify(ld, (k, v) => v === undefined ? undefined : v));
    let el = document.getElementById("blog-ld");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "blog-ld";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(stripped);
    return () => { el?.remove(); };
  }, [post, country]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-white"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>;
  if (error || !post) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Article not found</h1>
          <Link to={tenant ? `/preview/${tenant}` : "/"} className="text-zinc-500 hover:text-zinc-900">← Back home</Link>
        </div>
      </div>
    );
  }

  const date = post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : null;
  const blogHref = tenant ? `/preview/${tenant}/blog` : "/blog";

  return (
    <div className="min-h-screen bg-white text-zinc-900" data-testid="public-blog-post">
      {post.status !== "published" && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-[12.5px] font-medium text-center px-4 py-2">
          ✏️ Draft preview — this post is not yet published. Only visible with the preview link.
        </div>
      )}
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to={tenant ? `/preview/${tenant}` : "/"} className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-8 w-8" />
            <span className="font-display font-bold tracking-tight text-[17px]">{country?.brand_name || "Swift Formations"}</span>
          </Link>
          <Link to={blogHref} className="text-[13px] text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> All articles</Link>
        </div>
      </header>

      <article className="max-w-[760px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 text-[12px] text-zinc-500 mb-3">
          {date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{date}</span>}
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.read_time} min read</span>
          {(post.tags || []).map((t) => (
            <span key={t} className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">{t}</span>
          ))}
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight">{post.title}</h1>
        {post.excerpt && <p className="text-zinc-600 mt-4 text-[16px] leading-relaxed">{post.excerpt}</p>}

        {post.cover_url && (
          <img src={fullUrl(post.cover_url)} alt={post.title} className="w-full rounded-xl mt-8 aspect-[16/9] object-cover" />
        )}

        <div
          className="prose prose-zinc prose-lg max-w-none mt-8 prose-headings:font-display prose-headings:tracking-tight prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.body_html || "" }}
        />

        {post.gallery?.length > 0 && (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.gallery.map((u, i) => (
              <img key={i} src={fullUrl(u)} alt="" className="rounded-lg w-full aspect-square object-cover" />
            ))}
          </div>
        )}

        {post.links?.length > 0 && (
          <section className="mt-12 border-t border-zinc-200 pt-8">
            <h2 className="font-display text-lg font-bold tracking-tight mb-3">Related links</h2>
            <ul className="space-y-1.5">
              {post.links.map((l, i) => (
                <li key={i}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13.5px] text-zinc-700 hover:text-zinc-950 underline">
                    {l.label || l.url} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {post.author?.name && (
          <section className="mt-12 border-t border-zinc-200 pt-8 flex items-start gap-4">
            {post.author.avatar && <img src={fullUrl(post.author.avatar)} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div>
              <div className="font-display font-bold tracking-tight text-[15px]">{post.author.name}</div>
              {post.author.bio && <p className="text-[13px] text-zinc-600 mt-1">{post.author.bio}</p>}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function setMeta(key, val, attr = "name") {
  if (!val) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", val);
}
