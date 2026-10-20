import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { SourceAccountField } from "../../components/inputs/SourceAccountField.jsx";
import {
  LOAN_CAT_INSTALL, LOAN_CAT_RECEIPT, addJalaliMonths, loanDueDate, loanInstallmentTx, loanReceiptTx,
} from "../../domain/loanTransactions.js";
import { useFocusItem } from "../../hooks/useFocusItem.js";
import { consumePendingLoanPay, onLoanPayRequest } from "../../services/notifications.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { daysUntil, faLongDate, jalaliParts, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";
import { useBackClose } from "../../hooks/useBackClose.js";
import { toBody } from "../../utils/portal.js";

/* سررسید قسط بعدی نسبت به ماه شمسی جاری: «ماه جاری» / «ماه بعد» / عقب‌افتاده / نام ماه */
function dueMonthTag(iso) {
  if (!iso) return "";
  try {
    const a = jalaliParts(new Date(`${iso}T12:00:00Z`)), b = jalaliParts(new Date());
    const diff = (a.y - b.y) * 12 + (a.m - b.m);
    if (diff === 0) return "ماه جاری";
    if (diff === 1) return "ماه بعد";
    if (diff < 0) return diff === -1 ? "ماه گذشته" : "گذشته";
    return new Intl.DateTimeFormat("fa-IR", { month: "long" }).format(new Date(`${iso}T12:00:00Z`));
  } catch { return ""; }
}

export function LoansManager({ loans, setLoans, accounts = [], categories = [], addCategory, setTransactions, focusId, setFocusId }) {
  const st = useStyles();
  const [expandedId, setExpandedId] = useState(null);
  useFocusItem(focusId, setFocusId, setExpandedId);
  const emptyForm = () => { const s = todayISO(); return { title: "", principal: "", installments: "", monthlyPayment: "", startDate: s, firstDueDate: addJalaliMonths(s, 1), prepaid: "", spent: false, accountId: "" }; };
  const [form, setForm] = useState(emptyForm());
  const [firstTouched, setFirstTouched] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pay, setPay] = useState(null); // { id, date, accountId } — پنجره‌ی ثبت پرداخت قسط
  const loansRef = useRef(loans);
  loansRef.current = loans;

  const ensureLoanCats = () => {
    if (!categories.some((c) => c.id === LOAN_CAT_RECEIPT)) addCategory?.({ id: LOAN_CAT_RECEIPT, name: "دریافت وام", kind: "liability" });
    if (!categories.some((c) => c.id === LOAN_CAT_INSTALL)) addCategory?.({ id: LOAN_CAT_INSTALL, name: "قسط وام", kind: "liability" });
  };
  const accName = (id) => accounts.find((a) => a.id === id)?.name || "";
  const editingLoan = editingId ? loans.find((x) => x.id === editingId) : null;
  const registeredInApp = editingLoan ? Math.max(0, Number(editingLoan.paidCount || 0) - Number(editingLoan.prepaidCount || 0)) : 0;
  const canEditPrepaid = form.spent && registeredInApp === 0;

  // باز شدن پنجره‌ی ثبت قسط از روی اعلان سررسید (برنامه بسته بوده یا باز)
  function startPay(l) {
    if (!l || Number(l.paidCount || 0) >= Number(l.installments || 0)) return;
    setPay({ id: l.id, date: todayISO(), accountId: l.accountId || "" });
  }
  useEffect(() => {
    const openById = (id) => {
      consumePendingLoanPay();
      const l = loansRef.current.find((x) => x.id === id);
      if (!l) return;
      setExpandedId(l.id);
      startPay(l);
      setTimeout(() => { try { document.getElementById(`item-${l.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }, 200);
    };
    const first = consumePendingLoanPay();
    if (first) openById(first);
    return onLoanPayRequest(openById);
    // eslint-disable-next-line
  }, []);

  function submit() {
    if (!form.title || !form.principal || !form.installments || !form.monthlyPayment) return;
    const installments = Number(form.installments);
    const prepaidCount = form.spent ? Math.min(Math.max(0, Number(form.prepaid || 0)), installments) : 0;
    const base = { title: form.title.trim(), principal: Number(form.principal), installments, monthlyPayment: Number(form.monthlyPayment), startDate: form.startDate, firstDueDate: form.firstDueDate || addJalaliMonths(form.startDate, 1), spent: !!form.spent, accountId: form.accountId || "" };
    ensureLoanCats();
    if (editingId) {
      const old = loans.find((x) => x.id === editingId); if (!old) return;
      const oldPrepaid = Number(old.prepaidCount || 0);
      const nextPrepaid = canEditPrepaid ? prepaidCount : oldPrepaid;
      const paidCount = Math.min(Math.max(0, Number(old.paidCount || 0) - oldPrepaid + nextPrepaid), base.installments);
      const next = { ...old, ...base, prepaidCount: nextPrepaid, paidCount };
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
      const loan = { id: uid(), ...base, prepaidCount, paidCount: prepaidCount };
      setLoans((p) => [...p, loan]);
      if (!loan.spent && loan.accountId) setTransactions?.((prev) => [loanReceiptTx(loan), ...prev]);
    }
    setForm(emptyForm());
    setFirstTouched(false);
  }
  function startEdit(l) {
    setForm({ title: l.title, principal: String(l.principal), installments: String(l.installments), monthlyPayment: String(l.monthlyPayment), startDate: l.startDate, firstDueDate: l.firstDueDate || loanDueDate(l, 0), prepaid: l.prepaidCount ? String(l.prepaidCount) : "", spent: !!l.spent, accountId: l.accountId || "" });
    setFirstTouched(true);
    setEditingId(l.id);
    setTimeout(() => { try { document.getElementById("loan-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {} }, 60);
  }
  function cancelEdit() { setEditingId(null); setForm(emptyForm()); setFirstTouched(false); }
  function removeLoan(l) {
    if (!window.confirm(`وام «${l.title}» با تراکنش‌های دریافت و اقساط مرتبطش حذف شود؟`)) return;
    setLoans((p) => p.filter((x) => x.id !== l.id));
    setTransactions?.((prev) => prev.filter((t) => t.loanId !== l.id));
    if (editingId === l.id) cancelEdit();
    if (pay?.id === l.id) setPay(null);
  }
  function confirmPay() {
    const l = loans.find((x) => x.id === pay?.id);
    if (!l || Number(l.paidCount || 0) >= Number(l.installments || 0)) { setPay(null); return; }
    if (!pay.accountId) { window.alert("حساب بانکی پرداخت قسط را انتخاب کنید."); return; }
    const seq = Number(l.paidCount || 0) + 1;
    ensureLoanCats();
    setLoans((p) => p.map((x) => x.id === l.id ? { ...x, paidCount: seq, accountId: x.accountId || pay.accountId } : x));
    setTransactions?.((prev) => [loanInstallmentTx(l, seq, { date: pay.date, accountId: pay.accountId }), ...prev]);
    setPay(null);
  }
  function undoLast(l) {
    if (!l.paidCount) return;
    if (l.paidCount <= Number(l.prepaidCount || 0)) { window.alert("این قسط قبل از ثبت وام در برنامه پرداخت شده بود. برای تغییر آن، وام را ویرایش کنید."); return; }
    if (!window.confirm(`قسط شماره ${l.paidCount} برگردانده شود؟ مبلغ آن به حساب بانکی برمی‌گردد.`)) return;
    setLoans((p) => p.map((x) => x.id === l.id ? { ...x, paidCount: x.paidCount - 1 } : x));
    setTransactions?.((prev) => prev.filter((t) => !(t.loanId === l.id && t.loanRole === "installment" && t.loanSeq === l.paidCount)));
  }

  const payLoan = pay ? loans.find((x) => x.id === pay.id) : null;
  useBackClose(!!pay, () => setPay(null));   // دکمه‌ی برگشت اندروید پنجره‌ی ثبت قسط را می‌بندد

  return (
    <div>
      <div id="loan-form" style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>{editingId ? "ویرایش وام" : "ثبت وام جدید"}</div>
        <input placeholder="عنوان وام (مثلا وام خودرو)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={st.input} />
        <AmountInput placeholder="مبلغ اصل وام" value={form.principal} onChange={(v) => setForm({ ...form, principal: v })} style={st.input} />
        <KeypadInput kind="digits" placeholder="تعداد اقساط" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value.replace(/[^0-9]/g, "") })} style={st.input} inputMode="numeric" />
        <AmountInput placeholder="مبلغ هر قسط" value={form.monthlyPayment} onChange={(v) => setForm({ ...form, monthlyPayment: v })} style={st.input} />
        <label style={st.label}>تاریخ دریافت وام</label>
        <JalaliDateInput value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v, ...(firstTouched ? {} : { firstDueDate: addJalaliMonths(v, 1) }) })} style={st.input} />
        <label style={st.label}>سررسید اولین قسط (بعد از آن، هر ماه شمسی در همین روز)</label>
        <JalaliDateInput value={form.firstDueDate} onChange={(v) => { setFirstTouched(true); setForm({ ...form, firstDueDate: v }); }} style={st.input} />
        <label style={st.label}>حساب بانکی</label>
        <SourceAccountField accounts={accounts} categories={categories} accountId={form.accountId} fromCategoryId="" allowTwoWay={false} title="انتخاب حساب بانکی" onChange={(v) => setForm({ ...form, accountId: v.accountId })} st={st} />
        <div style={{ fontSize: 11.5, color: "#8a8194", lineHeight: 1.9, margin: "-2px 0 8px" }}>هر قسط از موجودی این حساب کم می‌شود (هنگام ثبت قسط می‌توانی حساب دیگری هم انتخاب کنی). دریافت وام هم به موجودی همین حساب اضافه می‌شود، مگر اینکه وام «خرج‌شده» باشد.</div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "4px 0 14px", fontSize: 13, fontWeight: 700, lineHeight: 1.9, cursor: "pointer" }}>
          <input type="checkbox" checked={!!form.spent} onChange={(e) => setForm({ ...form, spent: e.target.checked })} style={{ width: 20, height: 20, marginTop: 4, flexShrink: 0 }} />
          <span>مبلغ این وام قبلاً دریافت و خرج شده است<br /><span style={{ fontWeight: 500, fontSize: 11.5, color: "#8a8194" }}>موجودی بانک را افزایش نمی‌دهد؛ ولی اقساط ماهانه همچنان سررسید و اعلان دارند و با ثبت هر قسط از حساب بانکی کم می‌شوند.</span></span>
        </label>
        {form.spent && (
          <div>
            <label style={st.label}>تعداد اقساطی که تا امروز پرداخت کرده‌ای</label>
            <KeypadInput kind="digits" placeholder="مثلا ۵ (اگر هنوز هیچ‌کدام: خالی)" value={form.prepaid} onChange={(e) => setForm({ ...form, prepaid: e.target.value.replace(/[^0-9]/g, "") })} style={{ ...st.input, ...(canEditPrepaid ? {} : { opacity: 0.55 }) }} inputMode="numeric" disabled={!canEditPrepaid} />
            <div style={{ fontSize: 11.5, color: "#8a8194", lineHeight: 1.9, margin: "-2px 0 10px" }}>{canEditPrepaid ? "این اقساط فقط در شمارش وام حساب می‌شوند و تراکنشی از حساب بانکی کم نمی‌کنند. «سررسید اولین قسط» را هم همان سررسید قسط اول وام بگذار." : "بعد از ثبت قسط در برنامه، این عدد قابل تغییر نیست."}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} style={st.primaryBtn}>{editingId ? "ذخیره تغییرات" : "ثبت وام"}</button>
          {editingId && <button onClick={cancelEdit} style={{ ...st.primaryBtn, background: "#e9e5ef", color: "#3E1461", width: "auto", padding: "0 18px" }}>انصراف</button>}
        </div>
      </div>
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {loans.length === 0 && <EmptyRow text="وامی ثبت نشده" />}
        {loans.map((l) => {
          const remaining = l.principal - l.paidCount * l.monthlyPayment;
          const settled = l.paidCount >= l.installments;
          const nextDue = loanDueDate(l);
          const overdue = !settled && nextDue && daysUntil(nextDue) < 0;
          const dueToday = !settled && nextDue && daysUntil(nextDue) === 0;
          return (
            <div key={l.id} id={`item-${l.id}`} style={{ padding: "12px 4px", borderBottom: "1px solid #f0eef3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{l.title}{l.spent && <span style={{ marginRight: 8, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#f1eef4", color: "#6b6377" }}>خرج‌شده</span>}{overdue && <span style={{ marginRight: 8, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#fde8ea", color: BRAND.crimson }}>عقب‌افتاده</span>}{dueToday && <span style={{ marginRight: 8, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#fff1d6", color: "#8a5a00" }}>سررسید امروز</span>}</span>
                <span style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} aria-label="جزئیات" title="جزئیات کامل" style={{ background: expandedId === l.id ? BRAND.violet : "#f1eef4", color: expandedId === l.id ? "#fff" : "#5f566b", border: "none", borderRadius: 7, padding: "5px 9px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{expandedId === l.id ? "بستن" : "جزئیات"}</button>
                  <button onClick={() => startEdit(l)} aria-label="ویرایش" style={{ background: "none", border: "none", color: BRAND.violet, cursor: "pointer" }}><Pencil size={15} /></button>
                  <button onClick={() => removeLoan(l)} aria-label="حذف" style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: overdue ? BRAND.crimson : "#8a8194", marginBottom: 4 }}>قسط {toFaInt(l.paidCount)} از {toFaInt(l.installments)} پرداخت شده</div>
              {!settled && <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12.5, fontWeight: 700, color: overdue ? BRAND.crimson : BRAND.header, marginBottom: 4 }}>
                <span>سررسید قسط بعدی ({toFaInt(Number(l.paidCount || 0) + 1)}): {faLongDate(new Date(nextDue))}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 9px", borderRadius: 10, background: overdue ? "#fde8ea" : dueMonthTag(nextDue) === "ماه جاری" ? "#e8f7ee" : "#eee9f6", color: overdue ? BRAND.crimson : dueMonthTag(nextDue) === "ماه جاری" ? BRAND.darkgreen : BRAND.violet }}>{dueMonthTag(nextDue)}</span>
              </div>}
              {settled && <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.darkgreen, marginBottom: 4 }}>تسویه شده</div>}
              <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 6 }}>{l.accountId && accName(l.accountId) ? `حساب بانکی: ${accName(l.accountId)}` : "حساب بانکی: هنگام ثبت قسط انتخاب می‌شود"}</div>
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
                      ["تاریخ دریافت وام", l.startDate ? faLongDate(new Date(l.startDate)) : "—"],
                      ["سررسید بعدی", !settled ? faLongDate(new Date(nextDue)) : "تسویه شده"],
                      ["وضعیت", settled ? "تسویه شده" : (overdue ? "قسط عقب‌افتاده" : (l.spent ? "وام قدیمی / خرج‌شده" : "فعال"))],
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
                  {l.paidCount > Number(l.prepaidCount || 0) && <button onClick={() => undoLast(l)} style={{ background: "#f1eef4", color: BRAND.header, border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>اصلاح آخرین قسط</button>}
                  {!settled && <button onClick={() => startPay(l)} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>ثبت پرداخت قسط</button>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {pay && payLoan && toBody(
        <div dir="rtl" onClick={() => setPay(null)} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
          <div onClick={(e) => e.stopPropagation()} style={{ ...st.card, width: "100%", maxWidth: 480, borderRadius: "18px 18px 0 0", padding: "16px 16px calc(18px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>ثبت پرداخت قسط</div>
            <div style={{ fontSize: 12.5, color: "#8a8194", lineHeight: 1.9, marginBottom: 12 }}>
              وام «{payLoan.title}» — قسط {toFaInt(Number(payLoan.paidCount || 0) + 1)} از {toFaInt(payLoan.installments)}<br />
              مبلغ: <strong style={{ color: BRAND.crimson }}>{toFaInt(payLoan.monthlyPayment)} ریال</strong> — سررسید: {faLongDate(new Date(loanDueDate(payLoan)))}
            </div>
            <label style={st.label}>پرداخت از حساب</label>
            <SourceAccountField accounts={accounts} categories={categories} accountId={pay.accountId} fromCategoryId="" allowTwoWay={false} title="انتخاب حساب بانکی" onChange={(v) => setPay((p) => ({ ...p, accountId: v.accountId }))} st={st} />
            <label style={st.label}>تاریخ پرداخت</label>
            <JalaliDateInput value={pay.date} onChange={(v) => setPay((p) => ({ ...p, date: v }))} style={st.input} />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button onClick={confirmPay} style={{ ...st.primaryBtn, background: BRAND.green }}>ثبت قسط</button>
              <button onClick={() => setPay(null)} style={{ ...st.primaryBtn, background: "#e9e5ef", color: "#3E1461", width: "auto", padding: "0 18px" }}>بعداً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
