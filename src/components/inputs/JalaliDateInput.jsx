import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import {
  faLongDate, faMonthYear, getJalaliMonthCells, jalaliParts, jalaliYear, todayISO,
} from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { navArrowStyle } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Calendar View
--------------------------------------------------------- */
/* ---------------------------------------------------------
   Jalali date picker — replaces native <input type="date">,
   which always shows the Gregorian calendar regardless of the
   phone's language. This renders a Persian-calendar popup instead.
--------------------------------------------------------- */
export function JalaliDateInput({ value, onChange, style }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const d = value ? new Date(value) : new Date();
  const [viewY, setViewY] = useState(jalaliYear(d));
  const [viewM, setViewM] = useState(jalaliParts(d).m);
  const cells = useMemo(() => getJalaliMonthCells(viewY, viewM), [viewY, viewM]);
  function prevMonth() { if (viewM === 1) { setViewM(12); setViewY((y) => y - 1); } else setViewM((m) => m - 1); }
  function nextMonth() { if (viewM === 12) { setViewM(1); setViewY((y) => y + 1); } else setViewM((m) => m + 1); }
  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...style, margin: 0, textAlign: "right", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{value ? faLongDate(new Date(value)) : "انتخاب تاریخ"}</span>
        <CalendarDays size={15} />
      </button>
      {open && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", zIndex: 40, top: "100%", marginTop: 6, right: 0, background: t.card, borderRadius: 12, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.25)", width: 260 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button type="button" onClick={prevMonth} style={navArrowStyle(t)}><ChevronLeft size={14} /></button>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{cells[0] ? faMonthYear(cells[0].date) : ""}</div>
            <button type="button" onClick={nextMonth} style={navArrowStyle(t)}><ChevronRight size={14} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {weekDays.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 10, color: t.sub, fontWeight: 700 }}>{w}</div>)}
            {cells[0] && Array.from({ length: cells[0].weekday }).map((_, i) => <div key={"b" + i} />)}
            {cells.map((c) => {
              const iso = c.date.toISOString().slice(0, 10);
              const selected = value === iso;
              return (
                <button type="button" key={c.day} onClick={() => { onChange(iso); setOpen(false); }} style={{
                  aspectRatio: "1", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11,
                  background: selected ? BRAND.header : "transparent", color: selected ? "#fff" : t.text
                }}>{toFaInt(c.day)}</button>
              );
            })}
          </div>
          <button type="button" onClick={() => { onChange(todayISO()); setOpen(false); }} style={{ marginTop: 8, width: "100%", background: "none", border: "none", color: BRAND.header, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>امروز</button>
        </div>
      )}
    </div>
  );
}
