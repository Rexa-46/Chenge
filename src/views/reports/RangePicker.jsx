import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { RANGE_KINDS } from "../../domain/reportMath.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { jf } from "../../utils/dates.js";

export function RangePicker({ rs }) {
  const st = useStyles(); const t = useT();
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {RANGE_KINDS.map(([k, l]) => (
          <button key={k} onClick={() => rs.setKind(k)} style={{ padding: "7px 12px", borderRadius: 18, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, background: rs.kind === k ? BRAND.header : t.input, color: rs.kind === k ? "#fff" : t.text }}>{l}</button>
        ))}
      </div>
      {rs.kind === "custom" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={st.label}>از تاریخ</label><JalaliDateInput value={rs.from} onChange={rs.setFrom} style={st.input} /></div>
          <div><label style={st.label}>تا تاریخ</label><JalaliDateInput value={rs.to} onChange={rs.setTo} style={st.input} /></div>
        </div>
      )}
      <div style={{ fontSize: 12, color: t.sub }}>بازه‌ی گزارش: {jf(rs.range.from)} تا {jf(rs.range.to)}</div>
    </div>
  );
}
