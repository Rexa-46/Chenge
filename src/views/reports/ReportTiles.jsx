import { BarChart3, ClipboardList, Scale, ScrollText, Wallet } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { ShortcutGlyph } from "../../components/shortcuts/ShortcutGlyph.jsx";

export const REPORT_TILES = [
  { key: "summary", title: "خلاصه گزارش", style: { bg: "#EAE7FB", fg: "#6C56C8", icons: [ClipboardList] } },
  { key: "incexp", title: "گزارش هزینه و درآمد", style: { bg: "#B9FFF9", fg: "#14A39B", icons: [BarChart3] } },
  { key: "balances", title: "گزارش مانده حساب‌ها", style: { bg: "#FFF3C8", fg: "#E0A800", icons: [Wallet] } },
  { key: "statement", title: "گزارش صورتحساب", style: { bg: "#DDF4FF", fg: "#2F8FC4", icons: [ScrollText] } },
  { key: "balsheet", title: "گزارش ترازنامه", style: { bg: "#FDE6F3", fg: "#D6489B", icons: [Scale] } },
];
export function ReportTiles({ onOpen }) {
  const t = useT();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 14px", marginBottom: 20 }}>
      {REPORT_TILES.map((x) => (
        <button key={x.key} onClick={() => onOpen(x.key)} style={{ border: 0, background: "transparent", padding: 0, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 20, background: x.style.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShortcutGlyph style={x.style} size={38} />
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: t.text, textAlign: "center", lineHeight: 1.6 }}>{x.title}</span>
        </button>
      ))}
    </div>
  );
}
