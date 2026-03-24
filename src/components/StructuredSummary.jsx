import InsightBox from "./InsightBox";

export default function StructuredSummary({ sections }) {
  return (
    <div className="structured-summary">
      <div className="summary-label">
        <span className="label-icon">⊞</span>
        Structured Insights
      </div>
      <div className="insight-grid">
        {sections.map((section, i) => (
          <InsightBox
            key={i}
            index={i}
            title={section.title}
            insight={section.insight}
          />
        ))}
      </div>
    </div>
  );
}
