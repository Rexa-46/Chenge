import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";

export function DocView({ doc, maxRows = 300 }) {
  const t = useT(); const st = useStyles();
  return (
    <>
      {(doc?.sections || []).map((sec, i) => {
        const ncol = sec.head ? sec.head.length : Math.max(1, ...sec.rows.map((r) => r.length));
        const rows = sec.rows.slice(0, maxRows);
        return (
          <div key={i} style={{ ...st.card, padding: 12, marginBottom: 14 }}>
            {sec.title && <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{sec.title}</div>}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: ncol > 4 ? ncol * 92 : undefined }}>
                {sec.head && <thead><tr>{sec.head.map((h, k) => <th key={k} style={{ textAlign: "right", padding: "8px 6px", background: t.input, color: t.text, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>}
                <tbody>
                  {rows.map((r, ri) => (
                    <tr key={ri} style={{ borderBottom: `1px solid ${t.border}` }}>
                      {r.map((v, ci) => {
                        const num = typeof v === "number";
                        return <td key={ci} style={{ padding: "8px 6px", textAlign: "right", color: num ? (v < 0 ? BRAND.crimson : BRAND.darkgreen) : t.text, fontWeight: num ? 700 : 500, whiteSpace: num ? "nowrap" : "normal" }}>{num ? toFaInt(v) : v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!sec.rows.length && <div style={{ textAlign: "center", color: t.sub, fontSize: 12, padding: 10 }}>موردی نیست</div>}
            {sec.rows.length > maxRows && <div style={{ textAlign: "center", color: t.sub, fontSize: 12, padding: 8 }}>{toFaInt(maxRows)} ردیف اول از {toFaInt(sec.rows.length)} نمایش داده شد؛ فایل Excel/PDF همه‌ی ردیف‌ها را دارد.</div>}
          </div>
        );
      })}
    </>
  );
}
