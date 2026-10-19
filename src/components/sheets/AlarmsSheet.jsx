import { BellRing, Banknote, CalendarClock, FileSpreadsheet, Receipt, X } from "lucide-react";

import { dueText } from "../../domain/alarms.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { useT } from "../../theme/ThemeContext.js";
import { toFaInt } from "../../utils/format.js";
import { toBody } from "../../utils/portal.js";

const KIND = {
  check: { Icon: FileSpreadsheet, color: "#A98A3B", label: "چک" },
  bill: { Icon: Receipt, color: "#C56A1F", label: "قبض" },
  loan: { Icon: Banknote, color: "#6C3FA0", label: "قسط وام" },
  reminder: { Icon: CalendarClock, color: "#4E9AA0", label: "یادآوری" },
};

export function AlarmsSheet({ items, onClose, onOpen, onDoneReminder, notifBlocked, onEnableNotif }) {
  const t = useT();
  return toBody(
    <div dir="rtl" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: t.card, color: t.text, borderRadius: "0 0 18px 18px", padding: "calc(env(safe-area-inset-top, 0px) + 12px) 14px 16px", boxSizing: "border-box", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 15 }}><BellRing size={18} color={BRAND.orange} /> آلارم‌ها</span>
          <button onClick={onClose} aria-label="بستن" style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}><X size={20} /></button>
        </div>
        {notifBlocked && (
          <div style={{ background: "#fff4e0", border: "1px solid #f0c777", color: "#8a5a00", borderRadius: 10, padding: "9px 12px", fontSize: 12, lineHeight: 1.9, marginBottom: 10 }}>
            اعلان سررسیدها روی این گوشی هنوز اجازه نگرفته است.
            <button onClick={onEnableNotif} style={{ marginRight: 8, background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>اجازه‌ی اعلان</button>
          </div>
        )}
        {items.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 13, padding: "22px 0" }}>آلارم فعالی نیست؛ تا ۷ روز آینده سررسیدی ندارید.</div>}
        {items.map((it) => {
          const k = KIND[it.kind]; const Icon = k.Icon;
          const late = it.d < 0, today = it.d === 0;
          return (
            <div key={it.key} onClick={() => it.view && onOpen(it)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderTop: `1px solid ${t.border}`, cursor: it.view ? "pointer" : "default" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: k.color + "22", color: k.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
                <div style={{ fontSize: 11.5, color: t.sub, marginTop: 2 }}>{k.label}{it.amount ? ` — ${toFaInt(it.amount)} ریال` : ""}</div>
              </div>
              <div style={{ textAlign: "left", flexShrink: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: late ? BRAND.crimson : today ? BRAND.orange : t.sub }}>{dueText(it.d)}</div>
                {it.kind === "loan" && <div style={{ fontSize: 10.5, color: BRAND.violet, fontWeight: 700, marginTop: 2 }}>ثبت قسط ›</div>}
                {it.kind === "reminder" && <button onClick={(e) => { e.stopPropagation(); onDoneReminder(it.id); }} style={{ marginTop: 3, background: "#f1eef4", color: "#5f566b", border: "none", borderRadius: 7, padding: "3px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}>انجام شد</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
