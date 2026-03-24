export default function ParagraphSummary({ paragraph }) {
  return (
    <div className="paragraph-summary fade-in">
      <div className="section-label">
        <span className="section-label-icon">¶</span>
        Linear Summary
      </div>
      <p className="summary-text">{paragraph}</p>
    </div>
  );
}