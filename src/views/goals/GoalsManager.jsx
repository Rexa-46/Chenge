import { useState } from "react";
import { Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles, miniBtn } from "../../theme/styles.js";
import { faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Parmis-style modules: persons, debts, currencies, calculator, support
--------------------------------------------------------- */
export function GoalsManager({ goals, setGoals }) {
  const st = useStyles();
  const t = useT();
  const [form, setForm] = useState({ title: "", target: "", saved: "", dueDate: "", note: "", accountId: "" });
  function add() {
    const target = Number(form.target || 0), saved = Number(form.saved || 0);
    if (!form.title.trim() || target <= 0) return;
    setGoals((p) => [{ id: uid(), title: form.title.trim(), target, saved: Math.min(saved, target), dueDate: form.dueDate || "", note: form.note.trim(), createdAt: new Date().toISOString() }, ...p]);
    setForm({ title: "", target: "", saved: "", dueDate: "", note: "" });
  }
  function changeSaved(id, delta) {
    setGoals((p) => p.map((g) => g.id === id ? { ...g, saved: Math.max(0, Math.min(g.target, Number(g.saved || 0) + delta)) } : g));
  }
  const totalTarget = goals.reduce((s, g) => s + Number(g.target || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>هدف مالی جدید</div>
      <div style={{ fontSize: 12, color: t.sub, marginBottom: 10 }}>مثلاً خرید خودرو، سفر، پس‌انداز اضطراری یا خرید خانه.</div>
      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="نام هدف" style={st.input} />
      <AmountInput placeholder="مبلغ هدف" value={form.target} onChange={(v) => setForm({ ...form, target: v })} style={st.input} />
      <AmountInput placeholder="مبلغ پس‌انداز فعلی (اختیاری)" value={form.saved} onChange={(v) => setForm({ ...form, saved: v })} style={st.input} />
      <label style={st.label}>تاریخ هدف (اختیاری)</label>
      <JalaliDateInput value={form.dueDate || todayISO()} onChange={(v) => setForm({ ...form, dueDate: v })} style={st.input} />
      <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="توضیحات" style={st.input} />
      <button onClick={add} style={{ ...st.primaryBtn, background: BRAND.green }}>افزودن هدف</button>
    </div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t.sub, marginBottom: 8 }}>
        <span>مجموع اهداف</span><b style={{ color: t.text }}>{toFaInt(totalTarget)} ریال</b>
      </div>
      <div style={{ height: 10, background: t.border, borderRadius: 20, overflow: "hidden" }}><div style={{ height: "100%", width: `${totalTarget ? Math.min(100, totalSaved / totalTarget * 100) : 0}%`, background: BRAND.green, borderRadius: 20 }} /></div>
      <div style={{ marginTop: 7, textAlign: "center", fontSize: 12, color: BRAND.green, fontWeight: 700 }}>پس‌انداز شده: {toFaInt(totalSaved)} ریال</div>
    </div>
    <div style={{ ...st.card, padding: "4px 12px" }}>
      {goals.length === 0 && <EmptyRow text="هنوز هدف مالی ثبت نشده" />}
      {goals.map((g) => {
        const pct = g.target ? Math.min(100, Number(g.saved || 0) / g.target * 100) : 0;
        return <div key={g.id} style={{ padding: "14px 2px", borderBottom: "1px solid #f0eef3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div><div style={{ fontWeight: 800 }}>{g.title}</div>{g.dueDate && <div style={{ fontSize: 11.5, color: t.sub, marginTop: 3 }}>هدف: {faLongDate(new Date(g.dueDate))}</div>}</div>
            <button onClick={() => setGoals((p) => p.filter((x) => x.id !== g.id))} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15}/></button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 10 }}><span>{toFaInt(g.saved)} ریال</span><b>{toFaInt(g.target)} ریال</b></div>
          <div style={{ height: 9, background: t.border, borderRadius: 20, overflow: "hidden", marginTop: 6 }}><div style={{ height: "100%", width: `${pct}%`, background: BRAND.green, borderRadius: 20 }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 11.5, color: BRAND.green, fontWeight: 700 }}>{toFaInt(Math.round(pct))}% تکمیل</span>
            <div style={{ display: "flex", gap: 6 }}><button onClick={() => changeSaved(g.id, -100000)} style={miniBtn}>−۱۰۰هزار</button><button onClick={() => changeSaved(g.id, 100000)} style={{ ...miniBtn, color: BRAND.green }}>+۱۰۰هزار</button></div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}
