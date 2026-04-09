const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=400&q=60";

// Maps display category labels → CSS class
function getCategoryClass(category) {
  const c = (category || "").toLowerCase();
  if (c === "ai") return "cat-ai";
  if (c === "space") return "cat-space";
  if (c === "science") return "cat-science";
  if (c === "health") return "cat-health";
  if (c === "finance") return "cat-finance";
  if (c === "politics") return "cat-politics";
  if (c === "environment") return "cat-environment";
  if (c === "sports") return "cat-sports";
  if (c === "entertainment") return "cat-entertainment";
  if (c.includes("tech")) return "cat-tech";
  return "cat-general";
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
        {article.sourceName && (
          <p className="card-source">— {article.sourceName}</p>
        )}
        <p className="card-preview">{article.preview}</p>
      </div>
      <div className="card-footer">
        <span className="read-time">{article.readTime} read</span>
      </div>
    </div>
  );
}