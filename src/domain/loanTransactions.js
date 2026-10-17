import { todayISO } from "../utils/dates.js";
import { uid } from "../utils/id.js";

/* ---------------------------------------------------------
   Loans Manager
--------------------------------------------------------- */
/* وام‌ها به حساب بانکی وصل‌اند: دریافت وام = افزایش موجودی، هر قسط = کاهش موجودی (به‌صورت تراکنش‌های واقعی با برچسب «وام») */
export const LOAN_CAT_RECEIPT = "cat-loan-receipt", LOAN_CAT_INSTALL = "cat-loan-installment";
export const loanReceiptTx = (l, id, createdAt) => ({ id: id || uid(), type: "income", amount: l.principal, categoryId: LOAN_CAT_RECEIPT, accountId: l.accountId, date: l.startDate, time: "08:00", note: `دریافت وام «${l.title}»`, tags: ["وام"], loanId: l.id, loanRole: "receipt", isFinancing: true, pnlAmount: 0, sourceType: "loan_receipt", sourceId: l.id, contraAccount: "ledger:loan-liability", createdAt: createdAt || new Date().toISOString() });
export const loanInstallmentTx = (l, seq) => {
  const totalInterest = Math.max(0, Number(l.installments || 0) * Number(l.monthlyPayment || 0) - Number(l.principal || 0));
  const interestPerInstallment = l.installments ? totalInterest / Number(l.installments) : 0;
  const principalPart = Math.max(0, Number(l.monthlyPayment || 0) - interestPerInstallment);
  return { id: uid(), type: "expense", amount: l.monthlyPayment, pnlAmount: interestPerInstallment, categoryId: LOAN_CAT_INSTALL, accountId: l.accountId, date: todayISO(), time: new Date().toTimeString().slice(0, 5), note: `قسط ${seq} از ${l.installments} وام «${l.title}»`, tags: ["وام", "قسط"], loanId: l.id, loanRole: "installment", loanSeq: seq, isFinancing: true, principalPart, interestPart: interestPerInstallment, sourceType: "loan_installment", sourceId: `${l.id}:${seq}`, contraAccount: "ledger:loan-liability", createdAt: new Date().toISOString() };
};
