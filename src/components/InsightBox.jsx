const ACCENT_COLORS = [
  {
    border: "rgba(0,212,170,0.3)",
    bg: "rgba(0,212,170,0.05)",
    label: "#00d4aa",
  },
  {
    border: "rgba(255,126,179,0.3)",
    bg: "rgba(255,126,179,0.05)",
    label: "#ff7eb3",
  },
  {
    border: "rgba(121,212,253,0.3)",
    bg: "rgba(121,212,253,0.05)",
    label: "#79d4fd",
  },
  {
    border: "rgba(255,179,71,0.3)",
    bg: "rgba(255,179,71,0.05)",
    label: "#ffb347",
  },
  {
    border: "rgba(124,111,239,0.3)",
    bg: "rgba(124,111,239,0.05)",
    label: "#7c6fef",
  },
  {
    border: "rgba(82,196,136,0.3)",
    bg: "rgba(82,196,136,0.05)",
    label: "#52c488",
  },
];

export default function InsightBox({ title, insight, index }) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];

  return (
    <div
      className="insight-box fade-in"
      style={{
        borderColor: color.border,
        background: color.bg,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div className="insight-title" style={{ color: color.label }}>
        {title}
      </div>
      <p className="insight-text">{insight}</p>
    </div>
  );
}