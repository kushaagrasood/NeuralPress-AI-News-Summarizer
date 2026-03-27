// ── WorldNews via secure backend proxy ──────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

// ── In-memory cache (client-side, short-circuits repeat renders) ─────────────
let cachedArticles = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ── Main fetch function ───────────────────────────────────────────────────────
export async function fetchNews({ topic = "technology", number = 15 } = {}) {
  const now = Date.now();
  if (cachedArticles && now - cacheTimestamp < CACHE_DURATION_MS) {
    return { articles: cachedArticles, fetchedAt: cacheTimestamp };
  }

  const params = new URLSearchParams({ topic, number: String(number) });
  const response = await fetch(`${API_BASE}/api/news?${params}`);

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errMsg = body?.error || errMsg;
    } catch (_) {}
    throw new Error(`News error: ${errMsg}`);
  }

  const data = await response.json();

  // Update client-side cache
  cachedArticles = data.articles;
  cacheTimestamp = data.fetchedAt;

  return { articles: data.articles, fetchedAt: data.fetchedAt };
}