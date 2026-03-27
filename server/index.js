import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WORLDNEWS_API_KEY = process.env.WORLDNEWS_API_KEY;

if (!GEMINI_API_KEY || !WORLDNEWS_API_KEY) {
  console.error("❌  Missing API keys in .env — set GEMINI_API_KEY and WORLDNEWS_API_KEY");
  process.exit(1);
}

// ── CORS ────────────────────────────────────────────────────────────────────
// In production replace with your actual domain
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server / curl (no origin header) only in dev
      if (!origin && process.env.NODE_ENV !== "production") return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "50kb" }));

// ── Rate limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: { error: "Gemini rate limit exceeded. Please wait a moment." },
});

const newsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "News rate limit exceeded. Please wait a moment." },
});

app.use(globalLimiter);

// ── In-memory news cache (server-side) ──────────────────────────────────────
let newsCache = null;
let newsCacheTs = 0;
const NEWS_CACHE_MS = 5 * 60 * 1000; // 5 minutes

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── News endpoint ─────────────────────────────────────────────────────────────
app.get("/api/news", newsLimiter, async (req, res) => {
  try {
    const now = Date.now();

    // Serve from cache if fresh
    if (newsCache && now - newsCacheTs < NEWS_CACHE_MS) {
      return res.json({ articles: newsCache, fetchedAt: newsCacheTs, cached: true });
    }

    const params = new URLSearchParams({
      "api-key": WORLDNEWS_API_KEY,
      text: req.query.topic || "technology",
      language: "en",
      number: String(Math.min(Number(req.query.number) || 15, 30)),
    });

    const upstream = await fetch(`https://api.worldnewsapi.com/search-news?${params}`);

    if (!upstream.ok) {
      const body = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: body?.message || `WorldNewsAPI error ${upstream.status}` });
    }

    const data = await upstream.json();
    const newsList = data.news || [];

    if (newsList.length === 0) {
      return res.status(404).json({ error: "No articles found." });
    }

    const articles = newsList.map((n, i) => ({
      id: n.id || `${i}-${n.url}`,
      headline: n.title || "Untitled Article",
      category: normalizeCategory(n.category) || getCategory(`${n.title} ${n.text}`),
      preview: buildPreview(n.text),
      readTime: estimateReadTime(n.text),
      body: n.text || n.title,
      image: n.image || null,
      sourceUrl: n.url || "#",
      sourceName: extractSourceName(n.url),
    }));

    newsCache = articles;
    newsCacheTs = now;

    res.json({ articles, fetchedAt: now, cached: false });
  } catch (err) {
    console.error("News fetch error:", err);
    res.status(500).json({ error: "Internal server error fetching news." });
  }
});

// ── Gemini summarise endpoint ────────────────────────────────────────────────
app.post("/api/summarise", geminiLimiter, async (req, res) => {
  const { articleText, length = "medium" } = req.body;

  if (!articleText || typeof articleText !== "string") {
    return res.status(400).json({ error: "articleText is required and must be a string." });
  }

  if (articleText.length > 20_000) {
    return res.status(400).json({ error: "articleText is too long (max 20,000 chars)." });
  }

  const lengthGuide = {
    short: "2-3 sentences",
    medium: "5-7 sentences",
    detailed: "8-10 sentences",
  };

  if (!lengthGuide[length]) {
    return res.status(400).json({ error: "length must be short, medium, or detailed." });
  }

  const prompt = `Summarize the following news article in ${lengthGuide[length]}.

Return ONLY a valid JSON object with exactly this structure (no markdown, no code fences, no extra text):
{
  "paragraph": "A flowing summary of the article as plain text.",
  "sections": [
    { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
    { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
    { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
    { "title": "Section Title", "insight": "One or two sentence insight for this theme." }
  ]
}

Article:
${articleText}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const upstream = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });

    if (!upstream.ok) {
      const body = await upstream.json().catch(() => ({}));
      const msg = body?.error?.message || `HTTP ${upstream.status}`;
      return res.status(upstream.status).json({ error: `Gemini API error: ${msg}` });
    }

    const data = await upstream.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Gemini returned malformed JSON:", raw);
      return res.status(502).json({ error: "AI returned malformed JSON." });
    }

    res.json(parsed);
  } catch (err) {
    console.error("Gemini fetch error:", err);
    res.status(500).json({ error: "Internal server error calling Gemini." });
  }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Not found." }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => {
  console.log(`✅  NeuralPress API server running on http://localhost:${PORT}`);
  console.log(`   Gemini key: ${GEMINI_API_KEY.slice(0, 8)}...`);
  console.log(`   NewsAPI key: ${WORLDNEWS_API_KEY.slice(0, 8)}...`);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

// Map WorldNewsAPI's raw category strings to our display labels.
// API categories: technology, science, health, politics, business, sports,
//                 entertainment, environment, food, travel, general, etc.
const CATEGORY_MAP = {
  technology: "Tech",
  science: "Science",
  health: "Health",
  politics: "Politics",
  business: "Finance",
  finance: "Finance",
  entertainment: "Entertainment",
  environment: "Environment",
  food: "Food",
  travel: "Travel",
  sports: "Sports",
  general: "General",
};

function normalizeCategory(apiCategory) {
  if (!apiCategory) return null;
  return CATEGORY_MAP[apiCategory.toLowerCase()] || null;
}

// Keyword fallback — only fires when the API returns no category.
// Uses title-match only (first 120 chars) to avoid false positives from
// long body text that happens to mention a keyword tangentially.
function getCategory(titleAndText) {
  const t = (titleAndText || "").toLowerCase();
  // Check title portion first (higher confidence)
  if (/\bai\b|artificial intelligence|machine learning|chatgpt|llm\b/.test(t)) return "AI";
  if (/\bspace\b|nasa|rocket|satellite|asteroid|orbit/.test(t)) return "Space";
  if (/crypto|bitcoin|ethereum|\bstock\b|\bbank\b|wall street/.test(t)) return "Finance";
  if (/\blaw\b|\bregulation\b|\bgovernment\b|\bpolicy\b|legislation/.test(t)) return "Politics";
  if (/\bresearch\b|\bstudy\b|\bscientists\b|\bdiscovery\b/.test(t)) return "Science";
  if (/\bhealth\b|medical|disease|\bvaccine\b|hospital/.test(t)) return "Health";
  if (/\btech\b|software|startup|app\b|gadget|device/.test(t)) return "Tech";
  return "General";
}

// Extract a human-readable source name from a URL.
// e.g. "https://www.timesofindia.com/..." → "Times of India"
// Falls back to the bare hostname if no pretty name is known.
const SOURCE_NAMES = {
  "timesofindia.com": "Times of India",
  "bbc.com": "BBC News",
  "bbc.co.uk": "BBC News",
  "nytimes.com": "New York Times",
  "theguardian.com": "The Guardian",
  "reuters.com": "Reuters",
  "apnews.com": "AP News",
  "bloomberg.com": "Bloomberg",
  "techcrunch.com": "TechCrunch",
  "wired.com": "Wired",
  "theverge.com": "The Verge",
  "arstechnica.com": "Ars Technica",
  "washingtonpost.com": "Washington Post",
  "wsj.com": "Wall Street Journal",
  "ft.com": "Financial Times",
  "forbes.com": "Forbes",
  "cnbc.com": "CNBC",
  "cnn.com": "CNN",
  "foxnews.com": "Fox News",
  "nbcnews.com": "NBC News",
  "abcnews.go.com": "ABC News",
  "cbsnews.com": "CBS News",
  "npr.org": "NPR",
  "politico.com": "Politico",
  "axios.com": "Axios",
  "theatlantic.com": "The Atlantic",
  "economist.com": "The Economist",
  "nature.com": "Nature",
  "scientificamerican.com": "Scientific American",
  "newscientist.com": "New Scientist",
  "nypost.com": "New York Post",
  "independent.co.uk": "The Independent",
  "telegraph.co.uk": "The Telegraph",
  "hindustantimes.com": "Hindustan Times",
  "ndtv.com": "NDTV",
  "thehindu.com": "The Hindu",
  "aljazeera.com": "Al Jazeera",
  "sputniknews.com": "Sputnik News",
  "scmp.com": "South China Morning Post",
  "smh.com.au": "Sydney Morning Herald",
  "theaustralian.com.au": "The Australian",
  "cbc.ca": "CBC News",
  "globeandmail.com": "The Globe and Mail",
  "lemonde.fr": "Le Monde",
  "spiegel.de": "Der Spiegel",
  "engadget.com": "Engadget",
  "zdnet.com": "ZDNet",
  "venturebeat.com": "VentureBeat",
  "gizmodo.com": "Gizmodo",
  "mashable.com": "Mashable",
  "businessinsider.com": "Business Insider",
  "inc.com": "Inc.",
  "fastcompany.com": "Fast Company",
  "technologyreview.com": "MIT Technology Review",
  "github.com": "GitHub",
  "medium.com": "Medium",
  "substack.com": "Substack",
};

function extractSourceName(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // Check for exact match first, then try parent domain
    if (SOURCE_NAMES[hostname]) return SOURCE_NAMES[hostname];
    // Try stripping one subdomain level (e.g. tech.co.uk → co.uk won't match, but covers cases like news.bbc.co.uk)
    const parts = hostname.split(".");
    if (parts.length > 2) {
      const parent = parts.slice(-2).join(".");
      if (SOURCE_NAMES[parent]) return SOURCE_NAMES[parent];
    }
    // Fallback: prettify the raw hostname (remove TLD, capitalise)
    const base = parts.slice(0, parts.length > 2 ? -2 : -1).join(" ");
    return base
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || hostname;
  } catch {
    return null;
  }
}

function estimateReadTime(text) {
  const words = (text || "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)) + " min";
}

function buildPreview(text) {
  if (!text) return "";
  const trimmed = text.slice(0, 120).trim();
  return trimmed.length < text.length ? trimmed + "..." : trimmed;
}