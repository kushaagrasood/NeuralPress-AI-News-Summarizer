export default function ArticleCard({ article, isSelected, onSelect }) {
  return (
    <div
      className={`article-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(article)}
    >
      <span className="category-badge">{article.category}</span>
      <h3 className="card-headline">{article.headline}</h3>
      <p className="card-preview">{article.preview}</p>
      <span className="read-time">⏱ {article.readTime} read</span>
    </div>
  );
}
