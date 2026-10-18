import { addMonths, jalaliParts, jalaliToGregorian, todayISO } from "../utils/dates.js";
import { uid } from "../utils/id.js";

/* ---------------------------------------------------------
   Loans Manager
--------------------------------------------------------- */
/* وام‌ها به حساب بانکی وصل‌اند: دریافت وام = افزایش موجودی، هر قسط = کاهش موجودی (به‌صورت تراکنش‌های واقعی با برچسب «وام») */
export const LOAN_CAT_RECEIPT = "cat-loan-receipt", LOAN_CAT_INSTALL = "cat-loan-installment";

/* --- سررسید اقساط: ماه‌به‌ماه بر اساس تقویم شمسی (همان روز هر ماه شمسی) --- */
const pad2 = (n) => String(n).padStart(2, "0");
const jMonthLen = (y, m) => {
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  try {
    const [gy, gm, gd] = jalaliToGregorian(y, 12, 30);
    return jalaliParts(new Date(Date.UTC(gy, gm - 1, gd, 12))).m === 12 ? 30 : 29;
  } catch { return 29; }
};
export function addJalaliMonths(iso, n) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  try {
    const p = jalaliParts(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)));
    const idx = p.y * 12 + (p.m - 1) + Number(n || 0);
    const y = Math.floor(idx / 12), mo = (idx % 12) + 1;
    const day = Math.min(p.day, jMonthLen(y, mo));
    const [gy, gm, gd] = jalaliToGregorian(y, mo, day);
    return `${gy}-${pad2(gm)}-${pad2(gd)}`;
  } catch { return addMonths(iso, Number(n || 0)); }
}
/* سررسید قسط شماره (k+1)؛ k پیش‌فرض تعداد اقساط پرداخت‌شده است (یعنی سررسید قسط بعدی).
   وام‌های قدیمی که «سررسید اولین قسط» ندارند مثل قبل از تاریخ شروع حساب می‌شوند. */
export const loanDueDate = (l, k = Number(l?.paidCount || 0)) => (l?.firstDueDate ? addJalaliMonths(l.firstDueDate, k) : addMonths(l?.startDate, k));

export const loanReceiptTx = (l, id, createdAt) => ({ id: id || uid(), type: "income", amount: l.principal, categoryId: LOAN_CAT_RECEIPT, accountId: l.accountId, date: l.startDate, time: "08:00", note: `دریافت وام «${l.title}»`, tags: ["وام"], loanId: l.id, loanRole: "receipt", isFinancing: true, pnlAmount: 0, sourceType: "loan_receipt", sourceId: l.id, contraAccount: "ledger:loan-liability", createdAt: createdAt || new Date().toISOString() });
/* opts.date / opts.accountId: تاریخ و حساب پرداخت قسط (پیش‌فرض: امروز و حساب وام) */
export const loanInstallmentTx = (l, seq, opts = {}) => {
  const totalInterest = Math.max(0, Number(l.installments || 0) * Number(l.monthlyPayment || 0) - Number(l.principal || 0));
  const interestPerInstallment = l.installments ? totalInterest / Number(l.installments) : 0;
  const principalPart = Math.max(0, Number(l.monthlyPayment || 0) - interestPerInstallment);
  const date = opts.date || todayISO();
  const time = date === todayISO() ? new Date().toTimeString().slice(0, 5) : "09:00";
  return { id: uid(), type: "expense", amount: l.monthlyPayment, pnlAmount: interestPerInstallment, categoryId: LOAN_CAT_INSTALL, accountId: opts.accountId || l.accountId, date, time, note: `قسط ${seq} از ${l.installments} وام «${l.title}»`, tags: ["وام", "قسط"], loanId: l.id, loanRole: "installment", loanSeq: seq, isFinancing: true, principalPart, interestPart: interestPerInstallment, sourceType: "loan_installment", sourceId: `${l.id}:${seq}`, contraAccount: "ledger:loan-liability", createdAt: new Date().toISOString() };
};
