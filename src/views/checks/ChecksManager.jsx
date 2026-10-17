import { useState } from "react";
import { postOnce } from "../../domain/financialEngine.js";
import { BellRing, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { useFocusItem } from "../../hooks/useFocusItem.js";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { daysUntil, faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

/* ---------------------------------------------------------
   Checks Manager
--------------------------------------------------------- */
export function ChecksManager({ checks, setChecks, accounts = [], setTransactions, focusId, setFocusId }) {
  const st = useStyles();
  const [expandedId, setExpandedId] = useState(null);
  useFocusItem(focusId, setFocusId, setExpandedId);
  const [form, setForm] = useState({ type: "received", payee: "", amount: "", dueDate: todayISO(), note: "", sayadId: "", checkNumber: "", accountId: "" });
  function add() {
    if (!form.payee || !form.amount || !form.checkNumber || form.sayadId.length < 16 || form.sayadId.length > 20) return;
    setChecks((p) => [{ id: uid(), ...form, amount: Number(form.amount), status: "pending", createdAt: new Date().toISOString() }, ...p]);
    setForm({ ...form, payee: "", amount: "", note: "", sayadId: "", checkNumber: "" });
  }
  const canAdd = form.payee && form.amount && form.checkNumber && form.accountId && form.sayadId.length >= 16 && form.sayadId.length <= 20;
  const statusColor = { pending: BRAND.gold, cashed: BRAND.darkgreen, paid: BRAND.darkgreen, bounced: BRAND.crimson };
  const statusLabel = { pending: "در انتظار", cashed: "وصول شده", paid: "پرداخت شده", bounced: "برگشتی" };
  const sorted = [...checks].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const dueSoon = sorted.filter((c) => c.status === "pending" && daysUntil(c.dueDate) <= 7);
  return (
    <div>
      {dueSoon.length > 0 && (
        <div style={{ background: "#fff6ea", border: "1px solid #f0d9a8", borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: BRAND.orange, fontWeight: 700, fontSize: 13, marginBottom: 6 }}><BellRing size={16} /> یادآوری سررسید چک‌ها</div>
          {dueSoon.map((c) => (
            <div key={c.id} style={{ fontSize: 12.5, color: "#6b4c14" }}>
              {c.payee} — {toFaInt(c.amount)} ریال — {daysUntil(c.dueDate) < 0 ? "سررسید گذشته" : daysUntil(c.dueDate) === 0 ? "امروز سررسید است" : `${toFaInt(daysUntil(c.dueDate))} روز مانده`}
            </div>
          ))}
        </div>
      )}
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>ثبت چک جدید</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setForm({ ...form, type: "received" })} style={pillStyle(form.type === "received")}>دریافتی</button>
          <button onClick={() => setForm({ ...form, type: "paid" })} style={pillStyle(form.type === "paid")}>پرداختی</button>
        </div>
        <input placeholder="نام طرف حساب" value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} style={st.input} />
        <AmountInput placeholder="مبلغ" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} style={st.input} />
        <label style={st.label}>شناسه صیادی (۱۶ رقم)</label>
        <KeypadInput kind="digits" digitsMax={16} placeholder="شناسه ۱۶ رقمی روی چک" value={form.sayadId}
          onChange={(e) => setForm({ ...form, sayadId: e.target.value.replace(/[^0-9]/g, "").slice(0, 20) })}
          style={{ ...st.input, direction: "ltr", textAlign: "right", borderColor: form.sayadId && form.sayadId.length < 16 ? BRAND.crimson : st.input.border }} inputMode="numeric" maxLength={20} />
        {form.sayadId && form.sayadId.length < 16 && <div style={{ fontSize: 11, color: BRAND.crimson, marginTop: -6, marginBottom: 10 }}>شناسه صیادی باید حداقل ۱۶ رقم باشد ({toFaInt(form.sayadId.length)}/۱۶)</div>}
        <label style={st.label}>شماره چک</label>
        <input placeholder="شماره سریال چک" value={form.checkNumber} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} style={{ ...st.input, direction: "ltr", textAlign: "right" }} />
        <label style={st.label}>حساب مقصد / پرداخت</label>
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}><option value="">انتخاب حساب</option>{accounts.filter(a => a.active !== false).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label style={st.label}>تاریخ سررسید</label>
        <JalaliDateInput value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} style={st.input} />
        <input placeholder="یادداشت (اختیاری)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={st.input} />
        <button onClick={add} disabled={!canAdd} style={{ ...st.primaryBtn, opacity: canAdd ? 1 : 0.5 }}>ثبت چک</button>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {checks.length === 0 && <EmptyRow text="چکی ثبت نشده" />}
        {sorted.map((c) => {
          const d = daysUntil(c.dueDate);
          const urgent = c.status === "pending" && d <= 7;
          return (
          <div key={c.id} id={`item-${c.id}`} style={{ padding: "12px 4px", borderBottom: "1px solid #f0eef3" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{c.payee} ({c.type === "received" ? "دریافتی" : "پرداختی"})</span>
              <span style={{ fontWeight: 700 }}>{toFaInt(c.amount)} ریال</span>
            </div>
            {(c.sayadId || c.checkNumber) && (
              <div style={{ fontSize: 11, color: "#8a8194", marginBottom: 4, direction: "ltr", textAlign: "right" }}>
                {c.sayadId && `شناسه صیادی: ${c.sayadId}`}{c.sayadId && c.checkNumber ? " · " : ""}{c.checkNumber && `شماره چک: ${c.checkNumber}`}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: urgent ? (d < 0 ? BRAND.crimson : BRAND.orange) : "#8a8194", fontWeight: urgent ? 700 : 400 }}>
                سررسید: {faLongDate(new Date(c.dueDate))}{c.status === "pending" ? ` (${d < 0 ? "گذشته" : d === 0 ? "امروز" : `${toFaInt(d)} روز مانده`})` : ""}
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <StatusBadge text={statusLabel[c.status]} color={statusColor[c.status]} />
                <button onClick={() => setExpandedId(expandedId === c.id ? null : c.id)} style={{ background: expandedId === c.id ? BRAND.violet : "#f1eef4", color: expandedId === c.id ? "#fff" : "#5f566b", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {expandedId === c.id ? "بستن جزئیات" : "جزئیات"}
                </button>
                <select value={c.status} onChange={(e) => {
                  const next = e.target.value;
                  setChecks((p) => p.map((x) => x.id === c.id ? { ...x, status: next, ...(next === "pending" ? { linkedTransactionId: "" } : {}) } : x));
                  setTransactions?.((prev) => {
                    let list = prev.filter((t) => !(t.sourceType === "check" && t.sourceId === c.id));
                    if (next === "cashed" && c.accountId) list = postOnce(list, { type: "income", amount: c.amount, accountId: c.accountId, date: c.dueDate, time: "12:00", note: `وصول چک ${c.checkNumber || c.sayadId} - ${c.payee}`, sourceType: "check", sourceId: c.id, checkId: c.id, categoryId: "cat-check-received", isPnlExcluded: true });
                    if (next === "bounced") return list;
                    if (next === "paid" && c.accountId) list = postOnce(list, { type: "expense", amount: c.amount, accountId: c.accountId, date: c.dueDate, time: "12:00", note: `پرداخت چک ${c.checkNumber || c.sayadId} - ${c.payee}`, sourceType: "check", sourceId: c.id, checkId: c.id, categoryId: "cat-check-paid", isPnlExcluded: true });
                    return list;
                  });
                }} style={{ fontSize: 11, borderRadius: 6, border: "1px solid #ddd" }}>
                  <option value="pending">در انتظار</option>{c.type === "received" ? <option value="cashed">وصول شده</option> : <option value="paid">پرداخت شده</option>}<option value="bounced">برگشتی</option>
                </select>
                <button onClick={() => { setChecks((p) => p.filter((x) => x.id !== c.id)); setTransactions?.((p) => p.filter((t) => !(t.sourceType === "check" && t.sourceId === c.id))); }} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
              </div>
            </div>
            {expandedId === c.id && (
              <div style={{ margin: "8px 0 2px", padding: 12, borderRadius: 10, background: "#f8f6fa", border: "1px solid #ebe6f0", fontSize: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 9 }}>جزئیات کامل چک</div>
                {[
                  ["نوع", c.type === "received" ? "چک دریافتی" : "چک پرداختی"],
                  ["طرف حساب", c.payee || "—"],
                  ["مبلغ", `${toFaInt(c.amount)} ریال`],
                  ["شناسه صیادی", c.sayadId || "—"],
                  ["شماره چک", c.checkNumber || "—"],
                  ["حساب", accounts.find(a => a.id === c.accountId)?.name || "انتخاب نشده"],
                  ["تاریخ سررسید", c.dueDate ? faLongDate(new Date(c.dueDate)) : "—"],
                  ["وضعیت", statusLabel[c.status] || "—"],
                  ["وضعیت سررسید", c.status === "pending" ? (d < 0 ? "سررسید گذشته" : d === 0 ? "امروز" : `${toFaInt(d)} روز مانده`) : "تعیین تکلیف شده"],
                  ["یادداشت", c.note || "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #ece8ef" }}>
                    <span style={{ color: "#81788c" }}>{k}</span><strong style={{ textAlign: "left", direction: k === "شناسه صیادی" || k === "شماره چک" ? "ltr" : "rtl" }}>{v}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
