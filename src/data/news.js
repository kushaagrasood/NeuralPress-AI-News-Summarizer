// ── WorldNewsAPI Fetch + Transform ─────────────────────────
const API_KEY = import.meta.env.VITE_WORLDNEWS_API_KEY;
const BASE_URL = "https://api.worldnewsapi.com/search-news";

// ── Simple keyword-based category classifier ──────────────
function getCategory(text) {
    const t = (text || "").toLowerCase();
    if (t.includes("ai") || t.includes("artificial intelligence") || t.includes("machine learning")) return "AI";
    if (t.includes("space") || t.includes("nasa") || t.includes("rocket") || t.includes("satellite")) return "Space";
    if (t.includes("finance") || t.includes("bank") || t.includes("crypto") || t.includes("stock")) return "Finance";
    if (t.includes("policy") || t.includes("government") || t.includes("law") || t.includes("regulation")) return "Tech Policy";
    if (t.includes("science") || t.includes("research") || t.includes("study")) return "Science";
    if (t.includes("health") || t.includes("medical") || t.includes("disease")) return "Health";
    if (t.includes("tech") || t.includes("software") || t.includes("app")) return "Tech";
    return "General";
}

// ── Estimate read time from word count ────────────────────
function estimateReadTime(text) {
    const words = (text || "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200)) + " min";
}

// ── Build preview (first ~120 chars) ──────────────────────
function buildPreview(text) {
    if (!text) return "";
    const trimmed = text.slice(0, 120).trim();
    return trimmed.length < text.length ? trimmed + "..." : trimmed;
}

// ── In-memory cache ───────────────────────────────────────
let cachedArticles = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ── Main fetch function ───────────────────────────────────
export async function fetchNews() {
    // Return cached data if still fresh
    const now = Date.now();
    if (cachedArticles && now - cacheTimestamp < CACHE_DURATION_MS) {
        return { articles: cachedArticles, fetchedAt: cacheTimestamp };
    }

    const params = new URLSearchParams({
        "api-key": API_KEY,
        text: "technology",
        language: "en",
        number: "15",
    });

    const response = await fetch(`${BASE_URL}?${params}`);

    if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
            const errBody = await response.json();
            errMsg = errBody?.message || errMsg;
        } catch (_) { }
        throw new Error(`News API error: ${errMsg}`);
    }

    const data = await response.json();
    const newsList = data.news || [];

    if (newsList.length === 0) {
        throw new Error("No articles found. Try again later.");
    }

    const articles = newsList.map((news, index) => ({
        id: news.id || `${index}-${news.url}`,
        headline: news.title || "Untitled Article",
        category: getCategory(`${news.title} ${news.text}`),
        preview: buildPreview(news.text),
        readTime: estimateReadTime(news.text),
        body: news.text || news.title,
        image: news.image || null,
        sourceUrl: news.url || "#",
    }));

    // Update cache
    cachedArticles = articles;
    cacheTimestamp = now;

    return { articles, fetchedAt: now };
}
