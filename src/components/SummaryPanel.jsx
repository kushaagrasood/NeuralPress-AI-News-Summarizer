import { useState, useRef } from "react";
import { fetchSummary } from "../data/gemini";
import ParagraphSummary from "./ParagraphSummary";
import StructuredSummary from "./StructuredSummary";

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

  const paragraphRef = useRef(null);

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
    <main className="summary-panel">
      {/* Article Header */}
      <div className="article-header">
        <span className={`category-badge ${catClass}`}>
          {article.category}
        </span>
        <h1 className="article-title">{article.headline}</h1>
        <p className="article-body">{article.body}</p>
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

      {/* Summary Output — Key Takeaways FIRST, then scroll button, then Linear Summary */}
      {summaryData && !loading && (
        <div className="summary-output">
          {/* 1. Key Takeaways (Structured Insight Cards) */}
          <StructuredSummary sections={summaryData.sections} />

          {/* 2. Scroll-down nudge */}
          <button className="scroll-down-btn" onClick={scrollToParagraph}>
            ↓ Scroll for paragraph summary
          </button>

          {/* 3. Linear (Paragraph) Summary */}
          <div ref={paragraphRef}>
            <ParagraphSummary paragraph={summaryData.paragraph} />
          </div>
        </div>
      )}
    </main>
  );
}