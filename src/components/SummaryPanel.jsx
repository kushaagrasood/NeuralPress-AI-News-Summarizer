import { useState, useEffect, useRef, useCallback } from "react";
import { fetchSummary } from "../data/gemini";
import ParagraphSummary from "./ParagraphSummary";
import StructuredSummary from "./StructuredSummary";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=70";

function getCategoryClass(category) {
  const c = (category || "").toLowerCase();
  if (c === "ai") return "cat-ai";
  if (c === "space") return "cat-space";
  if (c === "science") return "cat-science";
  if (c === "health") return "cat-health";
  if (c === "finance") return "cat-finance";
  if (c === "politics") return "cat-politics";
  if (c === "environment") return "cat-environment";
  if (c === "sports") return "cat-sports";
  if (c === "entertainment") return "cat-entertainment";
  if (c.includes("tech")) return "cat-tech";
  return "cat-general";
}

export default function SummaryPanel({ article, onBack, getCached, setCached }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [length, setLength] = useState("medium");
  const [progress, setProgress] = useState(0);
  const [imageHeight, setImageHeight] = useState(220);

  const paragraphRef = useRef(null);

  // ── When article or length changes, load from cache or clear ──
  useEffect(() => {
    if (!article) {
      setSummaryData(null);
      setError(null);
      setLoading(false);
      setProgress(0);
      return;
    }

    const cached = getCached(article.id, length);
    if (cached) {
      setSummaryData(cached);
      setProgress(100);
      setError(null);
    } else {
      // New article (or length not yet cached) — clear the panel
      setSummaryData(null);
      setError(null);
      setProgress(0);
    }
  }, [article?.id, length]);

  // Attach scroll listener to the panel to collapse the image
  const panelRef = useCallback((node) => {
    if (!node) return;
    const handleScroll = () => {
      const scrollY = node.scrollTop;
      const newHeight = Math.max(0, 220 - scrollY);
      setImageHeight(newHeight);
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    setImageHeight(220);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [article]);

  async function handleSummarize() {
    if (!article) return;
    setLoading(true);
    setError(null);
    setSummaryData(null);
    setProgress(0);

    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18;
      if (p > 88) p = 88;
      setProgress(p);
    }, 300);

    try {
      const result = await fetchSummary(article.body, length);
      clearInterval(tick);
      setProgress(100);
      setSummaryData(result);
      setCached(article.id, length, result);
    } catch (err) {
      clearInterval(tick);
      setProgress(0);
      setError(err.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  function scrollToParagraph() {
    paragraphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!article) {
    return (
      <main className="summary-panel empty-state">
        <div className="empty-icon">⬡</div>
        <p>Select an article from the feed to begin</p>
      </main>
    );
  }

  const catClass = getCategoryClass(article.category);
  const isCached = !!getCached(article.id, length);

  return (
    <main className="summary-panel" ref={panelRef}>
      {/* Mobile back button */}
      <button className="mobile-back-btn" onClick={onBack} aria-label="Back to feed">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Feed
      </button>

      {/* Collapsible hero image */}
      <div
        className="article-image-wrapper"
        style={{ height: imageHeight, opacity: imageHeight / 220 }}
      >
        <img
          className="article-image"
          src={article.image || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
      </div>

      {/* Sticky title bar */}
      <div className="article-title-bar">
        <span className={`category-badge ${catClass}`}>
          {article.category}
        </span>
        <h1 className="article-title">{article.headline}</h1>
        {article.sourceName && (
          <p className="article-source">— {article.sourceName}</p>
        )}
      </div>

      {/* Article body */}
      <div className="article-header">
        <p className="article-body">{article.body}</p>

        {article.sourceUrl && article.sourceUrl !== "#" && (
          <a
            className="source-link"
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read Full Article ↗
          </a>
        )}
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="length-selector">
          {["short", "medium", "detailed"].map((opt) => (
            <button
              key={opt}
              className={`length-btn ${length === opt ? "active" : ""}`}
              onClick={() => setLength(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <div className="summarize-row">
          <button
            className="summarize-btn"
            onClick={handleSummarize}
            disabled={loading}
          >
            {loading ? "Analyzing..." : isCached ? "Re-summarize" : "Summarize"}
          </button>
          <div className="summarize-progress-track">
            <div
              className="summarize-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-indicator">
          <div className="loading-bar" />
          <span>AI is reading the article...</span>
        </div>
      )}

      {/* Error */}
      {error && <div className="error-box">{error}</div>}

      {/* Summary Output */}
      {summaryData && !loading && (
        <div className="summary-output fade-in">
          <StructuredSummary sections={summaryData.sections} />

          <div ref={paragraphRef}>
            <ParagraphSummary paragraph={summaryData.paragraph} />
          </div>
        </div>
      )}

      {/* Floating scroll-to-paragraph FAB */}
      {summaryData && !loading && (
        <button
          className="scroll-fab"
          onClick={scrollToParagraph}
          title="Scroll to paragraph summary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="7 13 12 18 17 13" />
            <polyline points="7 6 12 11 17 6" />
          </svg>
        </button>
      )}
    </main>
  );
}