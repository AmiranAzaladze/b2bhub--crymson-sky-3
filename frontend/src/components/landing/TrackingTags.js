/**
 * TrackingTags
 *
 * Renders nothing visually. Side-effects only: injects per-tenant analytics
 * and verification snippets into document.head (and a noscript iframe for
 * GTM into document.body) based on the `tracking` object stored in
 * landing_content.
 *
 * Each script/element added by this component is tagged with
 * `data-tt-managed="1"` so we can clean it up on unmount or when the tenant
 * (slug) changes — important for SPA navigation between previews.
 *
 * Supported integrations:
 *  - Google Analytics 4 (gtag)
 *  - Google Tag Manager
 *  - Google Search Console (meta verification)
 *  - Bing Webmaster (meta verification)
 *  - Facebook (Meta) Pixel
 *  - Facebook Domain Verification (meta)
 *  - LinkedIn Insight Tag
 *  - X (Twitter) Pixel
 *  - TikTok Pixel
 *  - Pinterest Tag (+ verification meta)
 *  - Hotjar
 *  - Microsoft Clarity
 *  - Plausible Analytics
 *  - Raw custom <head> HTML
 *  - Raw custom <body-end> HTML
 */
import React from "react";

const ATTR = "data-tt-managed";
const SCOPE_ATTR = "data-tt-scope";

function clearScope(scope) {
  document
    .querySelectorAll(`[${ATTR}="1"][${SCOPE_ATTR}="${scope}"]`)
    .forEach((n) => n.remove());
}

function addMeta(scope, name, content) {
  if (!content) return;
  const m = document.createElement("meta");
  m.setAttribute("name", name);
  m.setAttribute("content", content);
  m.setAttribute(ATTR, "1");
  m.setAttribute(SCOPE_ATTR, scope);
  document.head.appendChild(m);
}

function addScript(scope, opts) {
  const s = document.createElement("script");
  if (opts.src) s.src = opts.src;
  if (opts.async) s.async = true;
  if (opts.defer) s.defer = true;
  if (opts.text) s.text = opts.text;
  s.setAttribute(ATTR, "1");
  s.setAttribute(SCOPE_ATTR, scope);
  (opts.parent || document.head).appendChild(s);
}

function addRawHTML(scope, html, parent) {
  if (!html || !html.trim()) return;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  Array.from(tpl.content.childNodes).forEach((node) => {
    // Re-create <script> nodes so they actually execute (cloneNode doesn't run them)
    if (node.tagName === "SCRIPT") {
      const s = document.createElement("script");
      for (const a of node.attributes) s.setAttribute(a.name, a.value);
      if (node.textContent) s.text = node.textContent;
      s.setAttribute(ATTR, "1");
      s.setAttribute(SCOPE_ATTR, scope);
      (parent || document.head).appendChild(s);
    } else if (node.nodeType === 1) {
      node.setAttribute(ATTR, "1");
      node.setAttribute(SCOPE_ATTR, scope);
      (parent || document.head).appendChild(node);
    } else if (node.nodeType === 3 && node.textContent.trim()) {
      const sp = document.createElement("span");
      sp.style.display = "none";
      sp.appendChild(node);
      sp.setAttribute(ATTR, "1");
      sp.setAttribute(SCOPE_ATTR, scope);
      (parent || document.head).appendChild(sp);
    }
  });
}

export default function TrackingTags({ tracking, scope = "default" }) {
  React.useEffect(() => {
    if (!tracking) return undefined;
    // Always start clean for this scope before re-injecting
    clearScope(scope);

    const t = tracking;

    // ─── Verification meta tags ───
    if (t.google_site_verification)
      addMeta(scope, "google-site-verification", t.google_site_verification);
    if (t.bing_site_verification)
      addMeta(scope, "msvalidate.01", t.bing_site_verification);
    if (t.facebook_domain_verification)
      addMeta(scope, "facebook-domain-verification", t.facebook_domain_verification);
    if (t.pinterest_verification)
      addMeta(scope, "p:domain_verify", t.pinterest_verification);

    // ─── Google Analytics 4 ───
    if (t.ga4_id) {
      addScript(scope, {
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(t.ga4_id)}`,
        async: true,
      });
      addScript(scope, {
        text: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${t.ga4_id}');`,
      });
    }

    // ─── Google Tag Manager ───
    if (t.gtm_id) {
      addScript(scope, {
        text: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${t.gtm_id}');`,
      });
      // GTM noscript iframe in <body>
      const ns = document.createElement("noscript");
      ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${t.gtm_id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      ns.setAttribute(ATTR, "1");
      ns.setAttribute(SCOPE_ATTR, scope);
      document.body.insertBefore(ns, document.body.firstChild);
    }

    // ─── Facebook (Meta) Pixel ───
    if (t.facebook_pixel_id) {
      addScript(scope, {
        text: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${t.facebook_pixel_id}');fbq('track','PageView');`,
      });
      const img = document.createElement("img");
      img.height = 1; img.width = 1; img.style.display = "none";
      img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(t.facebook_pixel_id)}&ev=PageView&noscript=1`;
      img.setAttribute(ATTR, "1");
      img.setAttribute(SCOPE_ATTR, scope);
      document.body.appendChild(img);
    }

    // ─── LinkedIn Insight Tag ───
    if (t.linkedin_partner_id) {
      addScript(scope, {
        text: `_linkedin_partner_id = "${t.linkedin_partner_id}";window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');b.type='text/javascript';b.async=true;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';s.parentNode.insertBefore(b,s);})(window.lintrk);`,
      });
    }

    // ─── X (Twitter) Pixel ───
    if (t.twitter_pixel_id) {
      addScript(scope, {
        text: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${t.twitter_pixel_id}');twq('event','tw-${t.twitter_pixel_id}-PageView');`,
      });
    }

    // ─── TikTok Pixel ───
    if (t.tiktok_pixel_id) {
      addScript(scope, {
        text: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${t.tiktok_pixel_id}');ttq.page();}(window,document,'ttq');`,
      });
    }

    // ─── Pinterest Tag ───
    if (t.pinterest_tag_id) {
      addScript(scope, {
        text: `!function(e){if(!window.pintrk){window.pintrk = function () {window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${t.pinterest_tag_id}');pintrk('page');`,
      });
    }

    // ─── Hotjar ───
    if (t.hotjar_id) {
      addScript(scope, {
        text: `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${Number(t.hotjar_id) || 0},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
      });
    }

    // ─── Microsoft Clarity ───
    if (t.clarity_id) {
      addScript(scope, {
        text: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${t.clarity_id}");`,
      });
    }

    // ─── Plausible ───
    if (t.plausible_domain) {
      addScript(scope, {
        src: "https://plausible.io/js/script.js",
        defer: true,
      });
      const last = document.head.querySelector(
        `script[${ATTR}="1"][${SCOPE_ATTR}="${scope}"][src="https://plausible.io/js/script.js"]`,
      );
      if (last) last.setAttribute("data-domain", t.plausible_domain);
    }

    // ─── Custom raw HTML ───
    addRawHTML(scope, t.custom_head_html, document.head);
    addRawHTML(scope, t.custom_body_html, document.body);

    return () => clearScope(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tracking || {}), scope]);

  return null;
}
