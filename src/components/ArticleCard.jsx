const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=400&q=60";

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
  const imgSrc = article.image || FALLBACK_IMAGE;

  return (
    <div
      className={`article-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(article)}
    >
      {/* Thumbnail image */}
      <div className="card-image-wrapper">
        <img
          className="card-image"
          src={imgSrc}
          alt=""
          loading="lazy"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="card-image-overlay" />
      </div>

      <div className="card-top">
        <span className={`category-badge ${catClass}`}>{article.category}</span>
        <h3 className="card-headline">{article.headline}</h3>
        <p className="card-preview">{article.preview}</p>
      </div>
      <div className="card-footer">
        <span className="read-time">⏱ {article.readTime} read</span>
      </div>
    </div>
  );
}