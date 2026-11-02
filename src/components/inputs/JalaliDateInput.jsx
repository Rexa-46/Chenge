import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import {
  faLongDate, faMonthYear, getJalaliMonthCells, jalaliParts, jalaliYear, todayISO,
} from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { navArrowStyle } from "../../theme/styles.js";
import { toBody } from "../../utils/portal.js";

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
  const [vvh, setVvh] = useState(() => (typeof window !== "undefined" ? (window.visualViewport?.height || window.innerHeight) : 700));
  useEffect(() => {   // با باز بودن صفحه‌کلید هم، تقویم داخل بخش دیدنیِ صفحه می‌ماند
    if (!open) return;
    const vv = window.visualViewport;
    const f = () => setVvh(vv ? vv.height : window.innerHeight);
    f(); vv?.addEventListener("resize", f); window.addEventListener("resize", f);
    return () => { vv?.removeEventListener("resize", f); window.removeEventListener("resize", f); };
  }, [open]);
  function openCal() { try { document.activeElement?.blur?.(); } catch {} setOpen((v) => !v); }
  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <button type="button" onClick={openCal} style={{ ...style, margin: 0, textAlign: "right", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>{value ? faLongDate(new Date(value)) : "انتخاب تاریخ"}</span>
        <CalendarDays size={15} />
      </button>
      {open && toBody(
        /* پنجره‌ی وسط صفحه (نه زیر فیلد): داخل فرم‌های پایین‌صفحه هم کامل دیده می‌شود و قابل انتخاب است */
        <div onClick={() => setOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, height: vvh, zIndex: 2000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, direction: "rtl", overflowY: "auto" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: t.card, color: t.text, borderRadius: 16, padding: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", width: "100%", maxWidth: 320, maxHeight: vvh - 24, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button type="button" onClick={prevMonth} style={navArrowStyle(t)}><ChevronLeft size={14} /></button>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{cells[0] ? faMonthYear(cells[0].date) : ""}</div>
              <button type="button" onClick={nextMonth} style={navArrowStyle(t)}><ChevronRight size={14} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {weekDays.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, color: t.sub, fontWeight: 700 }}>{w}</div>)}
              {cells[0] && Array.from({ length: cells[0].weekday }).map((_, i) => <div key={"b" + i} />)}
              {cells.map((c) => {
                const iso = c.date.toISOString().slice(0, 10);
                const selected = value === iso;
                return (
                  <button type="button" key={c.day} onClick={() => { onChange(iso); setOpen(false); }} style={{
                    aspectRatio: "1", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                    background: selected ? BRAND.header : "transparent", color: selected ? "#fff" : t.text
                  }}>{toFaInt(c.day)}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => { onChange(todayISO()); setOpen(false); }} style={{ flex: 1, background: "none", border: `1.5px solid ${BRAND.header}`, borderRadius: 10, padding: "8px 0", color: BRAND.header, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>امروز</button>
              <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, background: "none", border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "8px 0", color: t.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
