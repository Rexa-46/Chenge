import { useT } from "../../theme/ThemeContext.js";
import { ShortcutGlyph } from "./ShortcutGlyph.jsx";
import { shortcutStyle } from "./shortcutStyles.js";

export function ShortcutTile({ sc, onClick }) {
  const t = useT();
  const s = shortcutStyle(sc);
  return (
    <button onClick={onClick} style={{ border: 0, background: "transparent", padding: 0, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
      <span style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 20, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ShortcutGlyph style={s} size={40} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: t.text, textAlign: "center", lineHeight: 1.5, wordBreak: "break-word" }}>{sc.name}</span>
    </button>
  );
}
