export default function ParagraphSummary({ paragraph }) {
  return (
    <div className="paragraph-summary fade-in">
      <div className="summary-label">
        <span className="label-icon">¶</span>
        Linear Summary
      </div>
      <p className="summary-text">{paragraph}</p>
    </div>
  );
}
