// ── WorldNews via secure backend proxy ──────────────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

// ── In-memory cache (client-side, short-circuits repeat renders) ─────────────
let cachedArticles = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SUMMARY_ARTICLE_CHARS = 20_000;

// ── Main fetch function ───────────────────────────────────────────────────────
export async function fetchNews({ topic = "technology", number = 15 } = {}) {
  const now = Date.now();
  if (cachedArticles && now - cacheTimestamp < CACHE_DURATION_MS) {
    return { articles: cachedArticles, fetchedAt: cacheTimestamp };
  }

  const params = new URLSearchParams({ topic, number: String(number) });
  let response;
  try {
    response = await fetch(`${API_BASE}/api/news?${params}`);
  } catch (networkErr) {
    console.error("News network error:", networkErr);
    throw new Error("Could not reach the NeuralPress server. Start the backend and try again.");
  }

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errMsg = body?.error || errMsg;
    } catch (_) {}
    throw new Error(`News error: ${errMsg}`);
  }

  const data = await response.json();

  const articles = (data.articles || []).filter(isDisplayableArticle);

  // Update client-side cache
  cachedArticles = articles;
  cacheTimestamp = data.fetchedAt;

  return { articles, fetchedAt: data.fetchedAt };
}

function isDisplayableArticle(article) {
  if (!article || typeof article !== "object") return false;

  const hasImage = typeof article.image === "string" && /^https?:\/\//i.test(article.image.trim());
  if (!hasImage) return false;

  const cleanBody = String(article.body || "").replace(/\s+/g, " ").trim();
  if (!cleanBody) return false;

  const sample = cleanBody.slice(0, 4000);
  const lettersDigitsSpaces = (sample.match(/[A-Za-z0-9\s]/g) || []).length;
  const nonStandardRatio = (sample.length - lettersDigitsSpaces) / Math.max(sample.length, 1);
  const repeatedPunctuation = /([!?.,:\-_=+*#@~`$%^&(){}\[\]\\\/])\1{4,}/.test(sample);

  const isTextLikelyMalformed =
    sample.length < 80 ||
    nonStandardRatio > 0.35 ||
    repeatedPunctuation;

  if (isTextLikelyMalformed) return false;

  // Keep body ready for summarize endpoint limits.
  article.body = cleanBody.slice(0, MAX_SUMMARY_ARTICLE_CHARS);
  article.preview = String(article.preview || "").replace(/\s+/g, " ").trim();

  return true;
}