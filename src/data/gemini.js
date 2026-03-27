// ── Gemini summarise via secure backend proxy ─────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function fetchSummary(articleText, length = "medium") {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/summarise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleText, length }),
    });
  } catch (networkErr) {
    console.error("Network error:", networkErr);
    throw new Error("Could not reach the NeuralPress server. Is it running?");
  }

  if (!response.ok) {
    let errBody = {};
    try { errBody = await response.json(); } catch (_) {}
    const msg = errBody?.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return response.json();
}