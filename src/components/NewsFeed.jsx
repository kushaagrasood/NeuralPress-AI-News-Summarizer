import ArticleCard from "./ArticleCard";
import { articles } from "../data/articles";

export default function NewsFeed({ selectedArticle, onSelect }) {
  return (
    <aside className="news-feed">
      <div className="feed-header">
        <span className="feed-dot" />
        <span>Live Feed</span>
      </div>
      <div className="feed-list">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            isSelected={selectedArticle?.id === article.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}