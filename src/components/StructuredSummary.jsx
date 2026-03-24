import InsightBox from "./InsightBox";

export default function StructuredSummary({ sections }) {
  return (
    <div className="structured-summary fade-in">
      <div className="section-label">
        <span className="section-label-icon">◈</span>
        Key Takeaways
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