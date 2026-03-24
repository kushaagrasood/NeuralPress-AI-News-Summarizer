import { useState } from "react";
import { fetchSummary } from "../data/gemini";
import ParagraphSummary from "./ParagraphSummary";
import StructuredSummary from "./StructuredSummary";

export default function SummaryPanel({ article }) {
  const [summaryData, setSummaryData] = useState(null); //holds the AI response
  const [loading, setLoading] = useState(false); // tracks whether an API call is currently in progress
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("paragraph"); // mode: "paragraph"(default) or "structured"
  const [length, setLength] = useState("medium"); // summary length: "medium"(default) or "short" or "detailed"

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

  return (
    <main className="summary-panel">
      {/* Article Header */}
      <div className="article-header">
        <span className="category-badge">{article.category}</span>
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

      {/* Summary Output */}
      {summaryData && !loading && (
        <div className="summary-output">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === "paragraph" ? "active" : ""}`}
              onClick={() => setMode("paragraph")}
            >
              ¶ Linear View
            </button>
            <button
              className={`mode-btn ${mode === "structured" ? "active" : ""}`}
              onClick={() => setMode("structured")}
            >
              ⊞ Insight View
            </button>
          </div>

          {/* Render Active Mode */}
          {mode === "paragraph" ? (
            <ParagraphSummary paragraph={summaryData.paragraph} />
          ) : (
            <StructuredSummary sections={summaryData.sections} />
          )}
        </div>
      )}
    </main>
  );
}
