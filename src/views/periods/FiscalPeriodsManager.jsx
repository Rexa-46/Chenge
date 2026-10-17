import { useState } from "react";
import { Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { faLongDate, todayISO } from "../../utils/dates.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Fiscal Periods Manager (دوره مالی)
--------------------------------------------------------- */
export function FiscalPeriodsManager({ fiscalPeriods, setFiscalPeriods }) {
  const st = useStyles();
  const [form, setForm] = useState({ title: "", startDate: todayISO(), endDate: todayISO() });
  function add() {
    if (!form.title) return;
    setFiscalPeriods((p) => [...p, { id: uid(), ...form }]);
    setForm({ title: "", startDate: todayISO(), endDate: todayISO() });
  }
  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>تعریف دوره مالی جدید</div>
        <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 10 }}>مثلا «سال مالی ۱۴۰۴» یا «فصل بهار». در گزارش‌ها می‌توانید بر اساس این بازه فیلتر کنید.</div>
        <input placeholder="عنوان دوره" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={st.input} />
        <label style={st.label}>تاریخ شروع</label>
        <JalaliDateInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} style={st.input} />
        <label style={st.label}>تاریخ پایان</label>
        <JalaliDateInput value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} style={st.input} />
        <button onClick={add} style={st.primaryBtn}>افزودن دوره</button>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {fiscalPeriods.length === 0 && <EmptyRow text="دوره‌ای ثبت نشده" />}
        {fiscalPeriods.map((p) => (
          <Row key={p.id} title={p.title} subtitle={`${faLongDate(new Date(p.startDate))} تا ${faLongDate(new Date(p.endDate))}`}
            leftIcon={<Trash2 size={15} />} leftColor={BRAND.crimson}
            onClick={() => setFiscalPeriods((prev) => prev.filter((x) => x.id !== p.id))} chevron={null} />
        ))}
      </div>
    </div>
  );
}
