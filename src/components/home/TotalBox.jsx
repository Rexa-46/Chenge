import { Minus, Plus } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { moneyParts } from "../../utils/format.js";

export function TotalBox({ kind, active, amount, currency, usdRate, onClick }) {
  const t = useT();
  const isExp = kind === "expense";
  const main = isExp ? "#E5384B" : "#22A559";
  const c = active ? main : "#9b9b9b";
  const { num, unit } = moneyParts(amount, currency, usdRate);
  const fs = num.length > 14 ? 10.5 : num.length > 12 ? 12 : num.length > 9 ? 14 : 16;
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 0, direction: "rtl", display: "flex", alignItems: "center", gap: 6, padding: "10px 8px",
      border: `2px solid ${active ? main : "#cfcfcf"}`, borderRadius: 14, background: t.card, cursor: "pointer", fontFamily: "inherit"
    }}>
      <span style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? (isExp ? "#FBC9CF" : "#C2EBD2") : "#e4e4e4", color: c }}>
        {isExp ? <Minus size={20} strokeWidth={3.4} /> : <Plus size={20} strokeWidth={3.4} />}
      </span>
      <span style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c }}>{isExp ? "جمع هزینه‌ها" : "جمع درآمدها"}</div>
        <div style={{ fontSize: fs, fontWeight: 900, color: c, whiteSpace: "nowrap", marginTop: 2 }}>{num}</div>
      </span>
      <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 11, fontWeight: 700, color: c, flexShrink: 0 }}>{unit}</span>
    </button>
  );
}
