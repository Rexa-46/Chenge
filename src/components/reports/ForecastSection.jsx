import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { buildForecast } from "../../domain/forecast.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { jf } from "../../utils/dates.js";
import { faDigits, formatMoney } from "../../utils/format.js";

export function ForecastSection({ loans, recurring, bills, checks, categories, currency, usdRate, onOpenItem }) {
  const t = useT(); const st = useStyles();
  const [offset, setOffset] = usePersistedState("forecastOffset", 0);
  const [open, setOpen] = useState({});
  const f = useMemo(() => buildForecast({ loans, recurring, bills, checks, categories, offset }), [loans, recurring, bills, checks, categories, offset]);
  return (
    <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: t.input, borderRadius: 10, padding: 4 }}>
        {[[0, "این ماه"], [1, "ماه بعد"]].map(([k, l]) => (
          <button key={k} onClick={() => setOffset(k)} style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit", background: offset === k ? BRAND.header : "transparent", color: offset === k ? "#fff" : t.text, fontWeight: 700, fontSize: 12 }}>{l}</button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 6 }}>{offset === 0 ? "باقی‌مانده تا پایان ماه (به‌علاوه‌ی عقب‌افتاده‌ها)" : "کل ماه"}: {jf(f.start)} تا {jf(f.end)}</div>
      <div style={{ fontSize: 17, fontWeight: 900, color: BRAND.crimson, marginBottom: 8 }}>{formatMoney(f.total, currency, usdRate)}</div>
      {f.groups.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 12.5, padding: 12 }}>پرداخت برنامه‌ریزی‌شده‌ای برای این ماه نیست</div>}
      {f.groups.map((g) => (
        <div key={g.key}>
          <div onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 2px", borderTop: `1px solid ${t.border}`, cursor: "pointer" }}>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{g.title} <span style={{ fontSize: 11, color: t.sub, fontWeight: 500 }}>({faDigits(g.items.length)} مورد)</span></span>
            <span style={{ fontWeight: 800, fontSize: 13, color: BRAND.crimson }}>{formatMoney(g.total, currency, usdRate)}</span>
            <ChevronLeft size={16} color={t.sub} style={{ transform: open[g.key] ? "rotate(-90deg)" : "none" }} />
          </div>
          {open[g.key] && g.items.map((x) => (
            <div key={x.id} onClick={x.ref ? () => onOpenItem?.(x.ref[0], x.ref[1]) : undefined} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px 8px 2px", paddingRight: 14, borderTop: `1px dashed ${t.border}`, cursor: x.ref ? "pointer" : "default" }}>
              <span style={{ flex: 1, fontSize: 12.5 }}>{x.title}<div style={{ fontSize: 11, color: x.late ? BRAND.crimson : t.sub }}>{jf(x.date)}{x.late ? " · عقب‌افتاده" : ""}{x.sub ? ` · ${x.sub}` : ""}</div></span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{x.amount ? formatMoney(x.amount, currency, usdRate) : "مبلغ نامشخص"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
