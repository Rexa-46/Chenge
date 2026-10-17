import { ArrowLeftRight, FileSpreadsheet, TrendingDown, TrendingUp } from "lucide-react";

import { BRAND } from "../../theme/palette.js";

/* ---------------------------------------------------------
   Add Transaction Sheet
--------------------------------------------------------- */
/* ---------------------------------------------------------
   Quick-add action sheet (opened from the center + button)
--------------------------------------------------------- */
export function QuickAddSheet({ onClose, onPick }) {
  const options = [
    { key: "expense", label: "ثبت هزینه", icon: <TrendingDown size={20} />, color: BRAND.crimson },
    { key: "income", label: "ثبت درآمد", icon: <TrendingUp size={20} />, color: BRAND.darkgreen },
    { key: "transfer", label: "انتقال بین حساب‌ها", icon: <ArrowLeftRight size={20} />, color: BRAND.violet },
    { key: "check", label: "ثبت چک", icon: <FileSpreadsheet size={20} />, color: BRAND.gold },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 400, maxWidth: 480, margin: "0 auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", borderRadius: "18px 18px 0 0", padding: "20px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, textAlign: "center" }}>چی می‌خوای ثبت کنی؟</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {options.map((o) => (
            <button key={o.key} onClick={() => onPick(o.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 8px",
              borderRadius: 14, border: "none", background: "#f7f5fa", cursor: "pointer"
            }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: o.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{o.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#241a30" }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
