import { useState } from "react";

import { JalaliDateInput } from "../inputs/JalaliDateInput.jsx";
import { useStyles } from "../../theme/styles.js";
import { todayISO } from "../../utils/dates.js";

/* ---------------------------------------------------------
   Reminder quick modal
--------------------------------------------------------- */
export function ReminderQuickModal({ onClose, onSubmit, initial = null }) {
  const st = useStyles();
  const [text, setText] = useState(initial?.text || "");
  const [date, setDate] = useState(initial?.date || todayISO());
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 400, maxWidth: 480, margin: "0 auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", borderRadius: "18px 18px 0 0", padding: "20px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>یادآوری جدید</div>
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلا: تماس با بانک" style={st.input} />
        <label style={st.label}>تاریخ</label>
        <JalaliDateInput value={date} onChange={(v) => setDate(v)} style={st.input} />
        <button disabled={!text.trim()} onClick={() => onSubmit({ text: text.trim(), date, done: false })} style={{ ...st.primaryBtn, opacity: text.trim() ? 1 : 0.5 }}>ذخیره یادآوری</button>
      </div>
    </div>
  );
}
