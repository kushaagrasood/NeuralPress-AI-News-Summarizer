import { useState } from "react";
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

  async function handleSummarize() {
    if (!article) return;
    setLoading(true);
    setError(null);
    setSummaryData(null);
    try {
      const result = await fetchSummary(article.body, length);
      setSummaryData(result);
    } catch (err) {
      setError(err.message || "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
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
        <span className={`category-badge ${catClass}`} data-cat={article.category}>
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
        <button
          className="summarize-btn"
          onClick={handleSummarize}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "✦ Summarize"}
        </button>
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

      {/* Summary Output — both sections always shown */}
      {summaryData && !loading && (
        <div className="summary-output">
          <ParagraphSummary paragraph={summaryData.paragraph} />
          <StructuredSummary sections={summaryData.sections} />
        </div>
      )}
    </main>
  );
}