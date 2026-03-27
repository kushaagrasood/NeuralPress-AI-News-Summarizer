import { useState, useEffect, useRef } from "react";
import NewsFeed from "./components/NewsFeed";
import SummaryPanel from "./components/SummaryPanel";
import { fetchNews } from "./data/news";
import "./App.css";

// Cache TTL: 10 minutes
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [mobileView, setMobileView] = useState("feed");

  // ── Live news state ─────────────────────────────────────
  const [articles, setArticles] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Summary cache: Map<cacheKey, { data, cachedAt }> ────
  // key = `${articleId}::${length}`
  const summaryCache = useRef(new Map());

  useEffect(() => {
    async function loadNews() {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const { articles: fetched, fetchedAt } = await fetchNews();
        setArticles(fetched);
        setLastUpdated(new Date(fetchedAt));
      } catch (err) {
        console.error("Failed to fetch news:", err);
        setFeedError(err.message || "Failed to load news.");
      } finally {
        setFeedLoading(false);
      }
    }
    loadNews();
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "");
  };

  function handleSelectArticle(article) {
    setSelectedArticle(article);
    setMobileView("summary");
  }

  function handleBackToFeed() {
    setMobileView("feed");
  }

  function getCached(articleId, length) {
    const key = `${articleId}::${length}`;
    const entry = summaryCache.current.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      summaryCache.current.delete(key);
      return null;
    }
    return entry.data;
  }

  function setCached(articleId, length, data) {
    const key = `${articleId}::${length}`;
    summaryCache.current.set(key, { data, cachedAt: Date.now() });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark">🧠</span>
          <span className="logo-text">NeuralPress</span>
        </div>
        <div className="header-right">
          <span className="header-tag">AI News Summarizer</span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className={`app-body mobile-view-${mobileView}`}>
        <NewsFeed
          articles={articles}
          feedLoading={feedLoading}
          feedError={feedError}
          lastUpdated={lastUpdated}
          selectedArticle={selectedArticle}
          onSelect={handleSelectArticle}
        />
        <SummaryPanel
          article={selectedArticle}
          onBack={handleBackToFeed}
          getCached={getCached}
          setCached={setCached}
        />
      </div>
    </div>
  );
}