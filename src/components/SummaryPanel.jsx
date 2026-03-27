import { useState, useRef, useCallback } from "react";
import { fetchSummary } from "../data/gemini";
import ParagraphSummary from "./ParagraphSummary";
import StructuredSummary from "./StructuredSummary";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&q=70";

function getCategoryClass(category) {
  const c = (category || "").toUpperCase();
  if (c === "AI") return "cat-ai";
  if (c === "SPACE") return "cat-space";
  if (c.includes("TECH")) return "cat-tech";
  if (c === "SCIENCE") return "cat-science";
  return "cat-ai";
}

export default function SummaryPanel({ article }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [length, setLength] = useState("medium");
  const [progress, setProgress] = useState(0);
  const [imageHeight, setImageHeight] = useState(220);

  const paragraphRef = useRef(null);

  // Attach scroll listener to the panel to collapse the image
  const panelRef = useCallback((node) => {
    if (!node) return;
    const handleScroll = () => {
      const scrollY = node.scrollTop;
      // Shrink image from 220px to 0 over the first 200px of scroll
      const newHeight = Math.max(0, 220 - scrollY);
      setImageHeight(newHeight);
    };
    node.addEventListener("scroll", handleScroll, { passive: true });
    // Reset image height when panel content changes
    setImageHeight(220);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [article]);

  async function handleSummarize() {
    if (!article) return;
    setLoading(true);
    setError(null);
    setSummaryData(null);
    setProgress(0);

    // Animate progress bar while loading
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

  return (
    <main className="summary-panel" ref={panelRef}>
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
      </div>

      {/* Article body */}
      <div className="article-header">
        <p className="article-body">{article.body}</p>

        {/* Source link */}
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
            {loading ? "Analyzing..." : "Summarize"}
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
        <div className="summary-output">
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