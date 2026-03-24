import { useState } from "react";
import NewsFeed from "./components/NewsFeed";
import SummaryPanel from "./components/SummaryPanel";
import "./App.css";

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark">🧠</span>
          <span className="logo-text">NeuralPress</span>
        </div>
        <div className="header-right">
          <span className="header-tag">AI News Article Summarizer</span>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="app-body">
        <NewsFeed selectedArticle={selectedArticle} onSelect={setSelectedArticle} />
        <SummaryPanel article={selectedArticle} />
      </div>
    </div>
  );
}