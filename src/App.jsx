import { useState, useEffect, useRef } from "react";
import NewsFeed from "./components/NewsFeed";
import SummaryPanel from "./components/SummaryPanel";
import { fetchNews } from "./data/news";
import logoLight from "./assets/icons/logo-light.svg"
import logoDark from "./assets/icons/logo-dark.svg"
import themeSunIcon from "./assets/icons/theme-sun.svg";
import themeMoonIcon from "./assets/icons/theme-moon.svg";
import linkedInIcon from "./assets/icons/linkedin.svg";
import githubIcon from "./assets/icons/github.svg";
import "./App.css";

// Cache TTL: 10 minutes
const CACHE_TTL_MS = 10 * 60 * 1000;

function Icon({ src, className = "", ...props }) {
  return (
    <span
      className={`icon ${className}`.trim()}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

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

  const themeActionLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  const themeIcon = theme === "dark" ? themeSunIcon : themeMoonIcon;
  const logoMark = theme === "dark" ? logoDark : logoLight;

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <Icon src = {logoMark} className="logo-mark" aria-hidden="true"/>
          <span className="logo-text">NeuralPress</span>
        </div>
        <div className="header-right">
          <span className="header-tag">AI News Summarizer</span>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={themeActionLabel}
            aria-label={themeActionLabel}
          >
            <Icon src={themeIcon} className="theme-toggle-icon" />
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

      <footer className="app-footer" aria-label="Credits and social links">
        <div className="footer-link">
          <span className="footer-note">Developed By</span>
          <span className="footer-divider" aria-hidden="true">
            •
          </span>
          <span className="footer-name">Kushaagra Sood</span>
          
          
        </div>

        <div className="footer-links">
          <a
            className="footer-link"
            href="https://www.linkedin.com/in/kushaagrasood23/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn profile"
            title="LinkedIn"
          >
            <Icon src={linkedInIcon} className="footer-link-icon" />
            <span>LinkedIn</span>
          </a>

          <a
            className="footer-link"
            href="https://github.com/kushaagrasood"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile"
            title="GitHub"
          >
            <Icon src={githubIcon} className="footer-link-icon" />
            <span>GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}