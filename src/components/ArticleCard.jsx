function getCategoryClass(category) {
  const c = (category || "").toUpperCase();
  if (c === "AI") return "cat-ai";
  if (c === "SPACE") return "cat-space";
  if (c.includes("TECH")) return "cat-tech";
  if (c === "SCIENCE") return "cat-science";
  return "cat-ai";
}

export default function ArticleCard({ article, isSelected, onSelect }) {
  const catClass = getCategoryClass(article.category);

  return (
    <div
      className={`article-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(article)}
    >
      <div className="card-top">
        <span className={`category-badge ${catClass}`} data-cat={article.category}>
          {article.category}
        </span>
        <h3 className="card-headline">{article.headline}</h3>
        <p className="card-preview">{article.preview}</p>
      </div>
      <div className="card-footer">
        <span className="read-time">⏱ {article.readTime} read</span>
      </div>
    </div>
  );
}