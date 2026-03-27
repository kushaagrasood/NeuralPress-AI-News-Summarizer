# NeuralPress — AI News Summarizer

NeuralPress is a full-stack AI-powered news summarizer. It fetches live news articles from the WorldNews API and uses Google Gemini to generate concise summaries in either a structured (key takeaways) or linear (paragraph) format, all wrapped in a responsive React UI with dark/light theme support.

---

## Features

- **Live news feed** — pulls the latest articles from WorldNews API, organized by topic/category
- **AI summarization** — powered by Google Gemini 2.5 Flash, with three configurable lengths (short, medium, detailed)
- **Two summary formats** — structured key-takeaway cards or flowing paragraph text
- **Two-tier caching** — server-side news cache (5 min) and client-side summary cache (10 min) to minimize API calls
- **Category detection** — AI-assisted and regex-based category tagging (AI, Space, Tech, Science, Health, Finance, Politics, Environment, Sports, Entertainment)
- **Dark / Light theme** toggle
- **Responsive layout** — split-pane on desktop, tabbed navigation on mobile
- **Security-first backend** — API keys are never exposed to the browser; helmet, CORS allowlist, and rate limiting are built in

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite 5 |
| Backend | Node.js + Express 4 |
| AI summarization | Google Gemini 2.5 Flash (`generativelanguage.googleapis.com`) |
| News data | WorldNews API (`api.worldnewsapi.com`) |
| Security | Helmet, express-rate-limit, CORS allowlist |
| Dev tooling | concurrently, cross-env, dotenv |

---

## Architecture

```
┌────────────────────────────────┐        ┌──────────────────────────────┐
│   Browser (React + Vite)       │        │  Express Backend (port 3001) │
│                                │        │                              │
│  NewsFeed ──────────────────── │──GET──▶│  /api/news                   │──▶ WorldNews API
│  ArticleCard                   │        │    └─ 5-min server cache     │
│  SummaryPanel ─────────────────│──POST─▶│  /api/summarise              │──▶ Google Gemini
│   ├─ StructuredSummary         │        │    └─ rate-limited (20/min)  │
│   └─ ParagraphSummary          │        │                              │
│                                │        │  /api/health                 │
│  Client summary cache (10 min) │        │                              │
└────────────────────────────────┘        └──────────────────────────────┘
```

All requests from the browser are proxied through the Express backend (configured in `vite.config.js` for development). API keys are stored only in `server/.env` and are never bundled into the frontend.

---

## Prerequisites

- **Node.js ≥ 18** (LTS recommended) — [nodejs.org](https://nodejs.org/)
- **npm ≥ 9** (bundled with Node.js)
- A **Google Gemini API key** (free tier available)
- A **WorldNews API key** (free tier available)

---

## Obtaining API Keys

### Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and sign in with a Google account.
2. Click **Create API key** and copy the generated key.
3. The application uses the `gemini-2.5-flash` model; confirm it is available on your key's project.

### WorldNews API Key

1. Register a free account at [worldnewsapi.com](https://worldnewsapi.com/).
2. After logging in, navigate to your **Dashboard** → **API Keys**.
3. Copy the key shown there.

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/kushaagrasood/NeuralPress-AI-News-Summarizer.git
cd NeuralPress-AI-News-Summarizer
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
cd ..
```

### 4. Create the server environment file

The backend reads its configuration from `server/.env`. This file is **not** tracked by git (see `.gitignore`).

```bash
cp server/.env.example server/.env   # if an example file is provided, otherwise:
touch server/.env
```

Open `server/.env` in your editor and add your keys:

```dotenv
# server/.env

GEMINI_API_KEY=your_gemini_api_key_here
WORLDNEWS_API_KEY=your_worldnews_api_key_here

# Optional — defaults shown
PORT=3001
NODE_ENV=development

# Production only — comma-separated list of allowed frontend origins
# ALLOWED_ORIGINS=https://yourdomain.com
```

> ⚠️ **Important:** The `.env` file must live inside the `server/` directory, not the project root. The server will exit immediately if either required key is missing.

---

## Running the Application

### Development mode (recommended)

This command starts both the Vite dev server and the Express backend concurrently:

```bash
npm run dev
```

| Process | URL |
|---|---|
| React frontend (Vite HMR) | http://localhost:5173 |
| Express API backend | http://localhost:3001 |

Vite automatically proxies every `/api/*` request from port 5173 to port 3001, so you only need to open the frontend URL in your browser.

To start each process separately:

```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

### Production mode

Build the React app and serve everything from the Express backend on a single port:

```bash
npm run build        # outputs to dist/
npm run start:prod   # serves dist/ + API on port 3001 (or $PORT)
```

Or as a one-liner:

```bash
npm run build:prod
```

Visit http://localhost:3001 (or whatever `$PORT` is set to).

---

## Project Structure

```
NeuralPress-AI-News-Summarizer/
├── index.html                 # Vite HTML entry point
├── vite.config.js             # Vite configuration (proxy, chunk splitting)
├── package.json               # Root: React, Vite, dev tooling
│
├── src/
│   ├── main.jsx               # React entry — mounts <App />
│   ├── App.jsx                # Root component: state, theme, routing logic
│   ├── App.css                # Global styles + CSS variable themes
│   │
│   ├── components/
│   │   ├── NewsFeed.jsx       # Left sidebar: article list with loading skeletons
│   │   ├── ArticleCard.jsx    # Single article card (thumbnail, category badge, preview)
│   │   ├── SummaryPanel.jsx   # Right panel: article view + summarize controls
│   │   ├── StructuredSummary.jsx  # Key-takeaway grid (4 insight boxes)
│   │   ├── ParagraphSummary.jsx   # Paragraph-format summary display
│   │   └── InsightBox.jsx     # Individual insight card with animated entrance
│   │
│   └── data/
│       ├── news.js            # Fetches /api/news, client-side 5-min cache
│       ├── gemini.js          # POSTs to /api/summarise, parses JSON response
│       └── articles.js        # Static fallback articles (demo / offline use)
│
└── server/
    ├── package.json           # Server: Express, Helmet, CORS, rate-limit, dotenv
    ├── .env                   # 🔒 Your API keys — NOT committed to git
    └── index.js               # Express app: /api/news, /api/summarise, /api/health
```

---

## Environment Variable Reference

All variables belong in `server/.env`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | — | Google Gemini API key |
| `WORLDNEWS_API_KEY` | ✅ Yes | — | WorldNews API key |
| `PORT` | No | `3001` | Port the Express server listens on |
| `NODE_ENV` | No | `development` | Set to `production` to enable static file serving and strict CORS |
| `ALLOWED_ORIGINS` | No (prod) | `http://localhost:5173,http://localhost:4173` | Comma-separated list of origins allowed by CORS (required in production) |

---

## API Endpoints

The Express backend exposes three endpoints:

### `GET /api/health`
Returns a simple health-check payload.

```json
{ "status": "ok" }
```

### `GET /api/news`

Fetches news articles from WorldNews API and returns normalized article objects.

| Query param | Type | Default | Description |
|---|---|---|---|
| `topic` | string | `"technology"` | News topic / category |
| `number` | number | `30` | Number of articles to return (max 30) |

**Example:**
```
GET /api/news?topic=science&number=10
```

Results are cached on the server for 5 minutes.

### `POST /api/summarise`

Sends article text to Gemini and returns a structured summary.

**Request body:**
```json
{
  "title": "Article headline",
  "text": "Full article text (max ~20 KB)...",
  "length": "medium"
}
```

`length` must be one of `"short"` (2–3 sentences), `"medium"` (5–7), or `"detailed"` (8–10).

**Response:**
```json
{
  "paragraph": "A concise narrative summary of the article...",
  "sections": [
    { "title": "Key Point 1", "insight": "Detail about the first takeaway." },
    { "title": "Key Point 2", "insight": "Detail about the second takeaway." },
    { "title": "Key Point 3", "insight": "Detail about the third takeaway." },
    { "title": "Key Point 4", "insight": "Detail about the fourth takeaway." }
  ]
}
```

Rate-limited to **20 requests per minute** per IP.

---

## Security Notes

- **API keys** are stored exclusively in `server/.env` and injected at runtime; they are never bundled into the frontend JavaScript.
- **Helmet** sets recommended HTTP security headers on every response.
- **CORS** is restricted to an explicit allowlist; in development, server-to-server requests (no `Origin` header) are also permitted.
- **Rate limiting** prevents API quota exhaustion:
  - Global: 200 requests / 15 minutes per IP
  - `/api/summarise`: 20 requests / minute per IP
  - `/api/news`: 10 requests / minute per IP
- **Body size** is capped at 50 KB to prevent oversized payloads.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Server exits immediately with "Missing API keys" | `server/.env` is missing or empty | Create `server/.env` with both required keys |
| `CORS: origin … not allowed` error in browser | Frontend origin not in allowlist | In production, set `ALLOWED_ORIGINS` in `server/.env` to your frontend URL |
| Gemini returns garbled JSON | Model response contained markdown fences | The server strips ` ```json ` fences automatically; if it persists, check your Gemini API quota |
| News feed shows static demo articles | WorldNews API key invalid or quota exceeded | Verify your `WORLDNEWS_API_KEY` and check your plan limits |
| Port 3001 already in use | Another process on the same port | Set `PORT=3002` (or any free port) in `server/.env` |

---

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feat/your-feature`).
2. Install dependencies (`npm install && cd server && npm install`).
3. Add your changes and test them locally with `npm run dev`.
4. Open a pull request describing what you changed and why.
