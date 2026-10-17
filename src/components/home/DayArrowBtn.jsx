import { useT } from "../../theme/ThemeContext.js";

export function DayArrowBtn({ dir, onClick }) {
  const t = useT();
  return (
    <button onClick={onClick} aria-label={dir === "left" ? "روز بعد" : "روز قبل"}
      style={{ width: 28, height: 42, borderRadius: 7, border: "none", background: t.inputBorder, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
      <svg width="12" height="14" viewBox="0 0 12 14">
        <polygon points={dir === "left" ? "11,1 1,7 11,13" : "1,1 11,7 1,13"} fill={t.sub} />
      </svg>
    </button>
  );
}
