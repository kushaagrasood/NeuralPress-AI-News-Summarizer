import ArticleCard from "./ArticleCard";

export default function NewsFeed({
  articles,
  feedLoading,
  feedError,
  lastUpdated,
  selectedArticle,
  onSelect,
}) {
  return (
    <aside className="news-feed">
      <div className="feed-header">
        <span className="feed-dot" />
        <span>Live Feed</span>
        {lastUpdated && (
          <span className="feed-timestamp">
            {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="feed-list">
        {/* Loading state */}
        {feedLoading && (
          <div className="feed-loading">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line wide" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {feedError && !feedLoading && (
          <div className="feed-error">
            <span className="feed-error-icon">⚠</span>
            <p>{feedError}</p>
          </div>
        )}

        {/* Empty state */}
        {!feedLoading && !feedError && articles.length === 0 && (
          <div className="feed-empty">
            <p>No articles found.</p>
          </div>
        )}

        {/* Article list */}
        {!feedLoading &&
          !feedError &&
          articles.map((article) => (
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