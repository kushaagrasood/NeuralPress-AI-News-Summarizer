// ── Gemini summarise via secure backend proxy ─────────────
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const MAX_SUMMARY_ARTICLE_CHARS = 20_000;

export async function fetchSummary(articleText, length = "medium") {
  const normalizedText = typeof articleText === "string" ? articleText.trim() : "";

  if (!normalizedText) {
    throw new Error("This article has no usable content to summarize.");
  }

  if (normalizedText.length > MAX_SUMMARY_ARTICLE_CHARS) {
    throw new Error("This article is too long to summarize (max 20,000 characters).");
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/api/summarise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleText: normalizedText, length }),
    });
  } catch (networkErr) {
    console.error("Network error:", networkErr);
    throw new Error("Could not reach the NeuralPress server. Is it running?");
  }

  if (!response.ok) {
    let errBody = {};
    try { errBody = await response.json(); } catch (_) {}
    const msg = errBody?.error || `HTTP ${response.status}`;

    if (/articleText is too long/i.test(msg)) {
      throw new Error("This article is too long to summarize (max 20,000 characters).");
    }

    if (response.status === 429) {
      throw new Error("Summarization is temporarily rate-limited. Please try again in a moment.");
    }

    // if (response.status >= 500) {
    //   throw new Error("The summarization service is temporarily unavailable. Please try again shortly.");
    // }

    throw new Error(msg);
  }

  return response.json();
}