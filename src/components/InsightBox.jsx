const COLORS = [
  { border: "rgba(0,229,192,0.3)",   bg: "rgba(0,229,192,0.05)",   label: "#00e5c0" },
  { border: "rgba(255,95,160,0.3)",  bg: "rgba(255,95,160,0.05)",  label: "#ff5fa0" },
  { border: "rgba(64,200,255,0.3)",  bg: "rgba(64,200,255,0.05)",  label: "#40c8ff" },
  { border: "rgba(255,208,0,0.3)",   bg: "rgba(255,208,0,0.05)",   label: "#ffd000" },
  { border: "rgba(167,139,250,0.3)", bg: "rgba(167,139,250,0.05)", label: "#a78bfa" },
  { border: "rgba(96,210,128,0.3)",  bg: "rgba(96,210,128,0.05)",  label: "#60d280" },
];

export default function InsightBox({ title, insight, index }) {
  const c = COLORS[index % COLORS.length];
  return (
    <div
      className="insight-box fade-in"
      style={{
        borderColor: c.border,
        background: c.bg,
        animationDelay: `${index * 0.07}s`,
      }}
    >
      <div className="insight-title" style={{ color: c.label }}>{title}</div>
      <p className="insight-text">{insight}</p>
    </div>
  );
}