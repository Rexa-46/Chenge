import { useT } from "../../theme/ThemeContext.js";

/* ---------------------------------------------------------
   Home View
--------------------------------------------------------- */
/* ---------------------------------------------------------
   Home detail helpers (سند باز‌شونده در صفحه اصلی)
--------------------------------------------------------- */
export function DetailBox({ lines = [], children }) {
  const t = useT();
  return (
    <div style={{ margin: "2px 0 10px", padding: 12, borderRadius: 12, background: "rgba(127,127,127,0.08)", border: `1px solid ${t.border}`, fontSize: 12 }}>
      {lines.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: `1px solid ${t.border}` }}>
          <span style={{ color: t.sub }}>{k}</span>
          <strong style={{ color: t.text, textAlign: "left", wordBreak: "break-word" }}>{v}</strong>
        </div>
      ))}
      {children}
    </div>
  );
}
export const detailActionBtn = (color, filled) => ({ flex: 1, border: filled ? "none" : `1px solid ${color}`, background: filled ? color : "transparent", color: filled ? "#fff" : color, borderRadius: 9, padding: "8px 10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" });
