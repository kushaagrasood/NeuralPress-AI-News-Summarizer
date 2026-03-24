const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 

// Routes through Vite dev proxy → avoids browser CORS block
const GEMINI_URL = `/gemini-api/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function fetchSummary(articleText, length = "medium") {
  const lengthGuide = {
    short: "2-3 sentences",
    medium: "5-7 sentences",
    detailed: "8-10 sentences",
  };

  const prompt = `Summarize the following news article in ${lengthGuide[length]}.

    Return ONLY a valid JSON object with exactly this structure (no markdown, no code fences, no extra text):
    {
      "paragraph": "A flowing summary of the article as plain text.",
      "sections": [
        { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
        { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
        { "title": "Section Title", "insight": "One or two sentence insight for this theme." },
        { "title": "Section Title", "insight": "One or two sentence insight for this theme." }
      ]
    }

    Article:
  ${articleText}`;

  let response;
  try {
    response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });
  } catch (networkErr) {
    // This fires on CORS or no internet
    console.error("Network/CORS error:", networkErr);
    throw new Error("Network error — if running locally, this may be a CORS issue. Try opening the browser console (F12) for details.");
  }

  if (!response.ok) {
    // Parse the error body from Google for a useful message
    let errBody = {};
    try { errBody = await response.json(); } catch (_) {}
    const msg = errBody?.error?.message || `HTTP ${response.status}`;
    console.error("Gemini API error:", errBody);
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Strip markdown code fences and extract JSON
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("JSON parse failed. Raw response was:\n", raw);
    throw new Error("AI returned malformed JSON. See browser console for the raw response.");
  }
}
