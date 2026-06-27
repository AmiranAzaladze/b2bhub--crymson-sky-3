/**
 * Tracking SDK — queues events, flushes via sendBeacon on idle/unload.
 * Never blocks the page. Ignores /admin/*.
 */
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const ENDPOINT = `${BACKEND}/api/track`;

const VISITOR_KEY = "sf_visitor_id";
const SESSION_KEY = "sf_session_id";
const SESSION_TS_KEY = "sf_session_ts";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes idle

let queue = [];
let flushTimer = null;
let currentTenant = null;

function uuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function visitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function sessionId() {
  const now = Date.now();
  const ts = parseInt(localStorage.getItem(SESSION_TS_KEY) || "0", 10);
  let id = localStorage.getItem(SESSION_KEY);
  if (!id || !ts || now - ts > SESSION_TTL_MS) {
    id = uuid();
    localStorage.setItem(SESSION_KEY, id);
  }
  localStorage.setItem(SESSION_TS_KEY, String(now));
  return id;
}

function utmFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
    utm_term: p.get("utm_term") || "",
    utm_content: p.get("utm_content") || "",
  };
}

function shouldTrack() {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith("/admin")) return false;
  if (!currentTenant) return false;
  return true;
}

function baseEvent() {
  return {
    tenant_slug: currentTenant,
    visitor_id: visitorId(),
    session_id: sessionId(),
    path: window.location.pathname,
    host: window.location.hostname,
    referrer: document.referrer || "",
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    language: navigator.language || "",
    ...utmFromUrl(),
  };
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, 4000);
}

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  const body = JSON.stringify({ events: batch });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (!ok) throw new Error("beacon-failed");
    } else {
      throw new Error("no-beacon");
    }
  } catch {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function track(type, meta = {}) {
  if (!shouldTrack()) return;
  queue.push({ ...baseEvent(), type, meta });
  scheduleFlush();
}

let initialised = false;

export function initAnalytics(tenantSlug) {
  currentTenant = tenantSlug || null;
  if (initialised) return;
  initialised = true;

  // Auto page view
  track("page_view");

  // Auto click tracking for any element with data-testid
  document.addEventListener(
    "click",
    (e) => {
      try {
        const el = e.target.closest?.("[data-testid]");
        if (!el) return;
        const testId = el.getAttribute("data-testid") || "";
        if (!testId || testId === "landing-page") return;
        const txt = (el.innerText || el.value || "").trim().slice(0, 80);
        track("click", { test_id: testId, text: txt });
      } catch {
        /* ignore */
      }
    },
    { passive: true, capture: true },
  );

  // Scroll depth (25 / 50 / 75 / 100)
  let maxDepth = 0;
  const reported = new Set();
  const onScroll = () => {
    const h = document.documentElement;
    const total = (h.scrollHeight - h.clientHeight) || 1;
    const depth = Math.min(100, Math.round((h.scrollTop / total) * 100));
    if (depth > maxDepth) maxDepth = depth;
    [25, 50, 75, 100].forEach((m) => {
      if (depth >= m && !reported.has(m)) {
        reported.add(m);
        track("scroll", { depth: m });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Flush on hide / unload (sendBeacon is reliable here)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
  window.addEventListener("beforeunload", flush);
}

export function trackLeadOpen(testId) {
  track("lead_open", { test_id: testId });
}
export function trackLeadSubmit() {
  track("lead_submit", {});
}
export function trackNameCheck(result) {
  track("name_check", { result });
}

/**
 * Start a live-presence heartbeat. Calls /api/presence every 30s while the tab
 * is visible. Returns a stop() function for cleanup.
 */
const PRESENCE_ENDPOINT = `${BACKEND}/api/presence`;
export function startPresence(tenantSlug) {
  if (!tenantSlug || typeof window === "undefined") return () => {};
  if (window.location.pathname.startsWith("/admin")) return () => {};

  const send = () => {
    if (document.visibilityState !== "visible") return;
    const body = JSON.stringify({
      tenant_slug: tenantSlug,
      visitor_id: visitorId(),
      session_id: sessionId(),
      path: window.location.pathname,
      host: window.location.hostname,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(PRESENCE_ENDPOINT, new Blob([body], { type: "application/json" }));
      } else {
        fetch(PRESENCE_ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch { /* swallow */ }
  };

  send(); // immediate
  const interval = setInterval(send, 30_000);
  const onVis = () => { if (document.visibilityState === "visible") send(); };
  document.addEventListener("visibilitychange", onVis);
  return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVis); };
}
