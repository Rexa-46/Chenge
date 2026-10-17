import { useState } from "react";
import { postOnce } from "../../domain/financialEngine.js";
import { Check } from "lucide-react";

import { DetailBox } from "../../components/common/DetailBox.jsx";
import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { useFocusItem } from "../../hooks/useFocusItem.js";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles, miniBtn } from "../../theme/styles.js";
import { faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

export function DebtsManager({ debts, setDebts, persons, accounts, setTransactions, focusId, setFocusId }) {
  const st = useStyles();
  const [expandedId, setExpandedId] = useState(null);
  useFocusItem(focusId, setFocusId, setExpandedId);
  const [form, setForm] = useState({ personId: "", kind: "receivable", amount: "", dueDate: todayISO(), note: "", accountId: "" });
  function add() {
    const amount = Number(form.amount || 0); if (!form.personId || !amount) return;
    setDebts((p) => [{ id: uid(), ...form, amount, settled: false, createdAt: new Date().toISOString() }, ...p]);
    setForm({ personId: "", kind: "receivable", amount: "", dueDate: todayISO(), note: "", accountId: "" });
  }
  const open = debts.filter((d) => !d.settled);
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>ثبت بدهی / طلب</div>
      <select value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })} style={st.input}><option value="">انتخاب طرف حساب</option>{persons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}><button onClick={() => setForm({ ...form, kind: "receivable" })} style={pillStyle(form.kind === "receivable")}>طلب از دیگران</button><button onClick={() => setForm({ ...form, kind: "payable" })} style={pillStyle(form.kind === "payable")}>بدهی به دیگران</button></div>
      <AmountInput placeholder="مبلغ" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} style={st.input} />
      <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}><option value="">حساب تسویه</option>{accounts.filter(a => a.active !== false).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <JalaliDateInput value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} style={st.input} />
      <input placeholder="توضیحات" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={st.input} />
      <button onClick={add} style={st.primaryBtn}>ثبت</button>
    </div>
    <div style={{ ...st.card, padding: "4px 12px" }}>
      {open.length === 0 && <EmptyRow text="بدهی یا طلب باز وجود ندارد" />}
      {open.map((d) => { const person = persons.find((p) => p.id === d.personId); return <div key={d.id} id={`item-${d.id}`}><Row onClick={() => setExpandedId(expandedId === d.id ? null : d.id)} title={person?.name || "طرف حساب حذف‌شده"} subtitle={`${d.kind === "receivable" ? "طلب" : "بدهی"} · سررسید ${faLongDate(new Date(d.dueDate))}`} value={`${toFaInt(d.amount)} ریال`} valueColor={d.kind === "receivable" ? BRAND.darkgreen : BRAND.crimson}
        extra={<button onClick={(e) => { e.stopPropagation();
          if (!d.accountId) { alert("حساب تسویه برای این بدهی انتخاب نشده است."); return; }
          const tx = { id: uid(), type: d.kind === "receivable" ? "income" : "expense", amount: d.amount, accountId: d.accountId, date: todayISO(), time: new Date().toTimeString().slice(0,5), note: `${d.kind === "receivable" ? "وصول طلب" : "پرداخت بدهی"} - ${person?.name || "طرف حساب"}`, sourceType: "debt", sourceId: d.id, debtId: d.id, categoryId: d.kind === "receivable" ? "cat-debt-receivable" : "cat-debt-payable", isPnlExcluded: true };
          setTransactions?.((prev) => postOnce(prev, tx));
          setDebts((p) => p.map((x) => x.id === d.id ? { ...x, settled: true, settledAt: todayISO(), settlementTransactionId: tx.id } : x));
        }} style={{ ...miniBtn, color: BRAND.green }}><Check size={14}/></button>} chevron={null} />{expandedId === d.id && <DetailBox lines={[
        ["طرف حساب", person?.name || "طرف حساب حذف‌شده"],
        ["نوع", d.kind === "receivable" ? "طلب از دیگران" : "بدهی به دیگران"],
        ["مبلغ", `${toFaInt(d.amount)} ریال`],
        ["سررسید", d.dueDate ? faLongDate(new Date(d.dueDate)) : "—"],
        ["حساب تسویه", accounts.find((a) => a.id === d.accountId)?.name || "انتخاب نشده"],
        ["توضیحات", d.note || "—"],
      ]} />}</div>; })}
    </div>
  </div>;
}
