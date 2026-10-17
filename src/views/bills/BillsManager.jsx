import { useState } from "react";
import { postOnce } from "../../domain/financialEngine.js";
import { Trash2 } from "lucide-react";

import { DetailBox } from "../../components/common/DetailBox.jsx";
import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { useFocusItem } from "../../hooks/useFocusItem.js";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { addMonths, daysUntil, faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Bills Manager
--------------------------------------------------------- */
const BILL_CATS = ["آب", "برق", "گاز", "اینترنت", "تلفن", "سایر"];
export function BillsManager({ bills, setBills, accounts = [], setTransactions, focusId, setFocusId }) {
  const st = useStyles();
  const [expandedId, setExpandedId] = useState(null);
  useFocusItem(focusId, setFocusId, setExpandedId);
  const [form, setForm] = useState({ title: "آب", amount: "", dueDate: todayISO(), recurringMonthly: true, accountId: "" });
  function add() {
    setBills((p) => [...p, { id: uid(), title: form.title, amount: Number(form.amount || 0), dueDate: form.dueDate, recurringMonthly: form.recurringMonthly, accountId: form.accountId || "", paid: false, createdAt: new Date().toISOString() }]);
    setForm({ ...form, amount: "" });
  }
  function markPaid(b) {
    if (!b.amount || !b.accountId) { alert("برای ثبت پرداخت، مبلغ و حساب پرداخت را مشخص کنید."); return; }
    const tx = { id: uid(), type: "expense", amount: Number(b.amount), accountId: b.accountId, date: todayISO(), time: new Date().toTimeString().slice(0,5), note: `پرداخت قبض ${b.title}`, sourceType: "bill", sourceId: `${b.id}:${Date.now()}`, billId: b.id, categoryId: "cat-bill-payment", isPnlExcluded: false };
    setTransactions?.((prev) => postOnce(prev, tx));
    setBills((prev) => prev.map((x) => x.id === b.id ? (x.recurringMonthly ? { ...x, dueDate: addMonths(x.dueDate, 1), paid: false, lastPaymentTxId: tx.id } : { ...x, paid: true, lastPaymentTxId: tx.id }) : x));
  }
  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن قبض</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {BILL_CATS.map((c) => <button key={c} onClick={() => setForm({ ...form, title: c })} style={{ ...pillStyle(form.title === c), flex: "none", padding: "7px 12px" }}>{c}</button>)}
        </div>
        <AmountInput placeholder="مبلغ (اختیاری)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} style={st.input} />
        <label style={st.label}>حساب مقصد / پرداخت</label>
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}><option value="">انتخاب حساب</option>{accounts.filter(a => a.active !== false).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label style={st.label}>تاریخ سررسید</label>
        <JalaliDateInput value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} style={st.input} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 12 }}>
          <input type="checkbox" checked={form.recurringMonthly} onChange={(e) => setForm({ ...form, recurringMonthly: e.target.checked })} /> یادآوری ماهانه تکرار شود
        </label>
        <button onClick={add} style={st.primaryBtn}>افزودن قبض</button>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {bills.length === 0 && <EmptyRow text="قبضی ثبت نشده" />}
        {[...bills].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((b) => {
          const d = daysUntil(b.dueDate);
          return (
            <div key={b.id} id={`item-${b.id}`}>
            <div onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", borderBottom: "1px solid #f0eef3" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{b.title}{b.amount ? ` — ${toFaInt(b.amount)} ریال` : ""}</div>
                <div style={{ fontSize: 12, color: b.paid ? BRAND.darkgreen : d < 0 ? BRAND.crimson : "#8a8194" }}>
                  {faLongDate(new Date(b.dueDate))} · {b.paid ? "پرداخت شده" : d < 0 ? "سررسید گذشته" : `${toFaInt(d)} روز مانده`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!b.paid && <button onClick={(e) => { e.stopPropagation(); markPaid(b); }} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>ثبت پرداخت</button>}
                <button onClick={(e) => { e.stopPropagation(); setBills((p) => p.filter((x) => x.id !== b.id)); setTransactions?.((p) => p.filter((t) => !(t.sourceType === "bill" && (t.billId === b.id || String(t.sourceId || "").startsWith(`${b.id}:`))))); }} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
            </div>
            {expandedId === b.id && (
              <DetailBox lines={[
                ["نوع قبض", b.title],
                ["مبلغ", b.amount ? `${toFaInt(b.amount)} ریال` : "ثبت نشده"],
                ["سررسید", b.dueDate ? faLongDate(new Date(b.dueDate)) : "—"],
                ["وضعیت", b.paid ? "پرداخت شده" : d < 0 ? "سررسید گذشته" : `${toFaInt(d)} روز مانده`],
                ["تکرار ماهانه", b.recurringMonthly ? "بله" : "خیر"],
                ["حساب پرداخت", accounts.find((a) => a.id === b.accountId)?.name || "انتخاب نشده"],
              ]} />
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
