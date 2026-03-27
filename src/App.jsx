import { useState, useEffect } from "react";
import NewsFeed from "./components/NewsFeed";
import SummaryPanel from "./components/SummaryPanel";
import { fetchNews } from "./data/news";
import "./App.css";

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [theme, setTheme] = useState("dark");

  // ── Live news state ─────────────────────────────────────
  const [articles, setArticles] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark">🧠</span>
          <span className="logo-text">NeuralPress</span>
        </div>
        <div className="header-right">
          <span className="header-tag">AI News Article Summarizer</span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="app-body">
        <NewsFeed
          articles={articles}
          feedLoading={feedLoading}
          feedError={feedError}
          lastUpdated={lastUpdated}
          selectedArticle={selectedArticle}
          onSelect={setSelectedArticle}
        />
        <SummaryPanel article={selectedArticle} />
      </div>
    </div>
  );
}