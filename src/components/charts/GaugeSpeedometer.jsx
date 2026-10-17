import { useT } from "../../theme/ThemeContext.js";
import { toFaInt } from "../../utils/format.js";

/* ---------------------------------------------------------
   Half-circle speedometer gauge — e.g. check collection ratio
--------------------------------------------------------- */
export function GaugeSpeedometer({ pct, label, colorFrom = "#B01E4A", colorTo = "#1E8449" }) {
  const t = useT();
  const size = 200, stroke = 16;
  const cx = size / 2, cy = size / 2 + 10, r = size / 2 - stroke;
  const clamped = Math.max(0, Math.min(100, pct));
  const angle = -180 + (clamped / 100) * 180; // -180 (left) .. 0 (right)
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.86 * Math.cos(rad);
  const needleY = cy + r * 0.86 * Math.sin(rad);
  const arc = (startDeg, endDeg, color) => {
    const s = (startDeg * Math.PI) / 180, e = (endDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" />;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size / 2 + 30}>
        {arc(-180, 0, t.border)}
        {arc(-180, angle, clamped >= 60 ? colorTo : clamped >= 30 ? "#C56A1F" : colorFrom)}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={t.text} strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={7} fill={t.text} />
      </svg>
      <div style={{ fontSize: 20, fontWeight: 800, color: t.text, marginTop: -6 }}>{toFaInt(Math.round(clamped))}٪</div>
      <div style={{ fontSize: 12.5, color: t.sub, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
