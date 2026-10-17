import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { SourceAccountField } from "../../components/inputs/SourceAccountField.jsx";
import {
  LOAN_CAT_INSTALL, LOAN_CAT_RECEIPT, loanInstallmentTx, loanReceiptTx,
} from "../../domain/loanTransactions.js";
import { useFocusItem } from "../../hooks/useFocusItem.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { addMonths, faLongDate, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

export function LoansManager({ loans, setLoans, accounts = [], categories = [], addCategory, setTransactions, focusId, setFocusId }) {
  const st = useStyles();
  const [expandedId, setExpandedId] = useState(null);
  useFocusItem(focusId, setFocusId, setExpandedId);
  const emptyForm = () => ({ title: "", principal: "", installments: "", monthlyPayment: "", startDate: todayISO(), spent: false, accountId: "" });
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const ensureLoanCats = () => {
    if (!categories.some((c) => c.id === LOAN_CAT_RECEIPT)) addCategory?.({ id: LOAN_CAT_RECEIPT, name: "دریافت وام", kind: "liability" });
    if (!categories.some((c) => c.id === LOAN_CAT_INSTALL)) addCategory?.({ id: LOAN_CAT_INSTALL, name: "قسط وام", kind: "liability" });
  };
  const accName = (id) => accounts.find((a) => a.id === id)?.name || "";
  function submit() {
    if (!form.title || !form.principal || !form.installments || !form.monthlyPayment) return;
    const base = { title: form.title.trim(), principal: Number(form.principal), installments: Number(form.installments), monthlyPayment: Number(form.monthlyPayment), startDate: form.startDate, spent: !!form.spent, accountId: form.accountId || "" };
    ensureLoanCats();
    if (editingId) {
      const old = loans.find((x) => x.id === editingId); if (!old) return;
      const next = { ...old, ...base, paidCount: Math.min(old.paidCount || 0, base.installments) };
      setLoans((p) => p.map((x) => x.id === old.id ? next : x));
      setTransactions?.((prev) => {
        const oldReceipt = prev.find((t) => t.loanId === old.id && t.loanRole === "receipt");
        let list = prev.filter((t) => !(t.loanId === old.id && t.loanRole === "receipt") && !(t.loanId === old.id && t.loanRole === "installment" && t.loanSeq > next.paidCount));
        list = list.map((t) => t.loanId === old.id && t.loanRole === "installment" ? { ...t, ...(next.accountId ? { accountId: next.accountId } : {}), note: `قسط ${t.loanSeq} از ${next.installments} وام «${next.title}»` } : t);
        if (!next.spent && next.accountId) list = [loanReceiptTx(next, oldReceipt?.id, oldReceipt?.createdAt), ...list];   // وام قدیمی/خرج‌شده موجودی را زیاد نمی‌کند
        return list;
      });
      setEditingId(null);
    } else {
      const loan = { id: uid(), ...base, paidCount: 0 };
      setLoans((p) => [...p, loan]);
      if (!loan.spent && loan.accountId) setTransactions?.((prev) => [loanReceiptTx(loan), ...prev]);
    }
    setForm(emptyForm());
  }
  function startEdit(l) {
    setForm({ title: l.title, principal: String(l.principal), installments: String(l.installments), monthlyPayment: String(l.monthlyPayment), startDate: l.startDate, spent: !!l.spent, accountId: l.accountId || "" });
    setEditingId(l.id);
    setTimeout(() => { try { document.getElementById("loan-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} }, 60);
  }
  function removeLoan(l) {
    if (!window.confirm(`وام «${l.title}» با تراکنش‌های دریافت و اقساط مرتبطش حذف شود؟`)) return;
    setLoans((p) => p.filter((x) => x.id !== l.id));
    setTransactions?.((prev) => prev.filter((t) => t.loanId !== l.id));
    if (editingId === l.id) { setEditingId(null); setForm(emptyForm()); }
  }
  function payInstallment(l) {
    if (l.paidCount >= l.installments) return;
    const seq = l.paidCount + 1;
    ensureLoanCats();
    setLoans((p) => p.map((x) => x.id === l.id ? { ...x, paidCount: seq } : x));
    if (l.accountId) setTransactions?.((prev) => [loanInstallmentTx(l, seq), ...prev]);
  }
  function undoLast(l) {
    if (!l.paidCount) return;
    if (!window.confirm(`قسط شماره ${l.paidCount} برگردانده شود؟${l.accountId ? " مبلغ آن به حساب بانکی برمی‌گردد." : ""}`)) return;
    setLoans((p) => p.map((x) => x.id === l.id ? { ...x, paidCount: x.paidCount - 1 } : x));
    setTransactions?.((prev) => prev.filter((t) => !(t.loanId === l.id && t.loanRole === "installment" && t.loanSeq === l.paidCount)));
  }
  return (
    <div>
      <div id="loan-form" style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>{editingId ? "ویرایش وام" : "ثبت وام جدید"}</div>
        <input placeholder="عنوان وام (مثلا وام خودرو)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={st.input} />
        <AmountInput placeholder="مبلغ اصل وام" value={form.principal} onChange={(v) => setForm({ ...form, principal: v })} style={st.input} />
        <KeypadInput kind="digits" placeholder="تعداد اقساط" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value.replace(/[^0-9]/g, "") })} style={st.input} inputMode="numeric" />
        <AmountInput placeholder="مبلغ هر قسط" value={form.monthlyPayment} onChange={(v) => setForm({ ...form, monthlyPayment: v })} style={st.input} />
        <label style={st.label}>تاریخ شروع (تاریخ دریافت وام)</label>
        <JalaliDateInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} style={st.input} />
        <label style={st.label}>حساب بانکی</label>
        <SourceAccountField accounts={accounts} categories={categories} accountId={form.accountId} fromCategoryId="" allowTwoWay={false} title="انتخاب حساب بانکی" onChange={(v) => setForm({ ...form, accountId: v.accountId })} st={st} />
        <div style={{ fontSize: 11.5, color: "#8a8194", lineHeight: 1.9, margin: "-2px 0 8px" }}>دریافت وام به موجودی این حساب اضافه و هر قسط از آن کم می‌شود. اگر انتخاب نکنی، تراکنشی در حساب بانکی ثبت نمی‌شود.</div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "4px 0 14px", fontSize: 13, fontWeight: 700, lineHeight: 1.9, cursor: "pointer" }}>
          <input type="checkbox" checked={!!form.spent} onChange={(e) => setForm({ ...form, spent: e.target.checked })} style={{ width: 20, height: 20, marginTop: 4, flexShrink: 0 }} />
          <span>مبلغ این وام قبلاً دریافت و خرج شده است (وام قدیمی)<br /><span style={{ fontWeight: 500, fontSize: 11.5, color: "#8a8194" }}>موجودی بانک را افزایش نمی‌دهد و در ترازنامه ناترازی ایجاد نمی‌کند؛ اقساط بعدی همچنان از حساب کم می‌شود.</span></span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} style={st.primaryBtn}>{editingId ? "ذخیره تغییرات" : "ثبت وام"}</button>
          {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm()); }} style={{ ...st.primaryBtn, background: "#e9e5ef", color: "#3E1461", width: "auto", padding: "0 18px" }}>انصراف</button>}
        </div>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {loans.length === 0 && <EmptyRow text="وامی ثبت نشده" />}
        {loans.map((l) => {
          const remaining = l.principal - l.paidCount * l.monthlyPayment;
          const nextDue = addMonths(l.startDate, l.paidCount);
          return (
            <div key={l.id} id={`item-${l.id}`} style={{ padding: "12px 4px", borderBottom: "1px solid #f0eef3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{l.title}{l.spent && <span style={{ marginRight: 8, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#f1eef4", color: "#6b6377" }}>خرج‌شده</span>}</span>
                <span style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} aria-label="جزئیات" title="جزئیات کامل" style={{ background: expandedId === l.id ? BRAND.violet : "#f1eef4", color: expandedId === l.id ? "#fff" : "#5f566b", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{expandedId === l.id ? "بستن" : "جزئیات"}</button>
                  <button onClick={() => startEdit(l)} aria-label="ویرایش" style={{ background: "none", border: "none", color: BRAND.violet, cursor: "pointer" }}><Pencil size={15} /></button>
                  <button onClick={() => removeLoan(l)} aria-label="حذف" style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "#8a8194", marginBottom: 4 }}>قسط {toFaInt(l.paidCount)} از {toFaInt(l.installments)} پرداخت شده — سررسید بعدی: {l.paidCount < l.installments ? faLongDate(new Date(nextDue)) : "تسویه شده"}</div>
              <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 6 }}>{l.accountId && accName(l.accountId) ? `حساب بانکی: ${accName(l.accountId)}` : "بدون اتصال به حساب بانکی"}</div>
              {expandedId === l.id && (() => {
                const totalPaid = Number(l.paidCount || 0) * Number(l.monthlyPayment || 0);
                const totalInterest = Math.max(0, Number(l.installments || 0) * Number(l.monthlyPayment || 0) - Number(l.principal || 0));
                const remainingInstallments = Math.max(0, Number(l.installments || 0) - Number(l.paidCount || 0));
                return (
                  <div style={{ margin: "8px 0 10px", padding: 12, borderRadius: 10, background: "#f8f6fa", border: "1px solid #ebe6f0", fontSize: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 9 }}>جزئیات کامل وام</div>
                    {[
                      ["اصل وام", `${toFaInt(l.principal)} ریال`],
                      ["مبلغ هر قسط", `${toFaInt(l.monthlyPayment)} ریال`],
                      ["کل اقساط", toFaInt(l.installments)],
                      ["اقساط پرداخت‌شده", toFaInt(l.paidCount)],
                      ["اقساط باقی‌مانده", toFaInt(remainingInstallments)],
                      ["مجموع پرداخت‌شده", `${toFaInt(totalPaid)} ریال`],
                      ["سود/هزینه تأمین مالی", `${toFaInt(totalInterest)} ریال`],
                      ["مانده بدهی", `${toFaInt(Math.max(remaining, 0))} ریال`],
                      ["حساب بانکی", accName(l.accountId) || "انتخاب نشده"],
                      ["تاریخ شروع", l.startDate ? faLongDate(new Date(l.startDate)) : "—"],
                      ["سررسید بعدی", l.paidCount < l.installments ? faLongDate(new Date(nextDue)) : "تسویه شده"],
                      ["وضعیت", l.paidCount >= l.installments ? "تسویه شده" : (l.spent ? "وام قدیمی / خرج‌شده" : "فعال")],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #ece8ef" }}>
                        <span style={{ color: "#81788c" }}>{k}</span><strong>{v}</strong>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, color: remaining > 0 ? BRAND.crimson : BRAND.darkgreen }}>باقی‌مانده: {toFaInt(Math.max(remaining, 0))} ریال</span>
                <span style={{ display: "flex", gap: 6 }}>
                  {l.paidCount > 0 && <button onClick={() => undoLast(l)} style={{ background: "#f1eef4", color: BRAND.header, border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>اصلاح آخرین قسط</button>}
                  {l.paidCount < l.installments && <button onClick={() => payInstallment(l)} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>ثبت پرداخت قسط</button>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
