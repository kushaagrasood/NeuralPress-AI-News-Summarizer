const ACCENT_COLORS = [
  { border: "#4a8fff", bg: "rgba(74, 143, 255, 0.07)", label: "#6b9fff" },
  { border: "#e06b6b", bg: "rgba(224, 107, 107, 0.07)", label: "#e07878" },
  { border: "#52b788", bg: "rgba(82, 183, 136, 0.07)", label: "#5dc995" },
  { border: "#d4a24e", bg: "rgba(212, 162, 78, 0.07)",  label: "#e0b05a" },
];

export default function InsightBox({ title, insight, index }) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      className="insight-box fade-in"
      style={{
        borderColor: color.border,
        background: color.bg,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="insight-title" style={{ color: color.label }}>
        {title}
      </div>
      <p className="insight-text">{insight}</p>
    </div>
  );
}
