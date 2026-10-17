import { Plus } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";

export function AddShortcutTile({ onClick }) {
  const t = useT();
  return (
    <button onClick={onClick} style={{ border: 0, background: "transparent", padding: 0, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 20, background: "#DFF2FE", color: "#0F2F5C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Plus size={42} strokeWidth={2.4} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: t.text, textAlign: "center", lineHeight: 1.5 }}>افزودن میانبر</span>
    </button>
  );
}
