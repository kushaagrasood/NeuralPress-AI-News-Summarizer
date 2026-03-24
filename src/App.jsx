import { useState } from "react";
import NewsFeed from "./components/NewsFeed";
import SummaryPanel from "./components/SummaryPanel";
import "./App.css";

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">NeuralPress</span>
        </div>
        <span className="header-tag">AI News Article Summarizer</span>
      </header>

      <div className="app-body">
        <NewsFeed
          selectedArticle={selectedArticle}
          onSelect={setSelectedArticle}
        />
        <SummaryPanel article={selectedArticle} />
      </div>
    </div>
  );
}
