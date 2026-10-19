import { daysUntil } from "../utils/dates.js";
import { toFaInt } from "../utils/format.js";
import { loanDueDate } from "./loanTransactions.js";

/* ---------------------------------------------------------
   آلارم‌های نوار بالا: چک، قبض، قسط وام و یادآوری‌های نزدیک (یا عقب‌افتاده)
--------------------------------------------------------- */
export const ALARM_WINDOW_DAYS = 7;
export const dueText = (d) => (d < 0 ? `${toFaInt(-d)} روز عقب‌افتاده` : d === 0 ? "امروز" : d === 1 ? "فردا" : `${toFaInt(d)} روز دیگر`);

export function buildAlarms({ checks = [], bills = [], loans = [], reminders = [], checkDays = 0 }) {
  const items = [];
  const win = Math.max(ALARM_WINDOW_DAYS, Number(checkDays) || 0);
  checks.filter((c) => c.status === "pending" && c.dueDate).forEach((c) => {
    const d = daysUntil(c.dueDate);
    if (d <= win) items.push({ key: `chk-${c.id}`, kind: "check", id: c.id, view: "checks", title: `چک ${c.type === "received" ? "دریافتی" : "پرداختی"} — ${c.payee || ""}`, amount: c.amount, d });
  });
  bills.filter((b) => !b.paid && b.dueDate).forEach((b) => {
    const d = daysUntil(b.dueDate);
    if (d <= ALARM_WINDOW_DAYS) items.push({ key: `bill-${b.id}`, kind: "bill", id: b.id, view: "bills", title: `قبض ${b.title || ""}`, amount: b.amount, d });
  });
  loans.filter((l) => l.startDate && Number(l.paidCount || 0) < Number(l.installments || 0)).forEach((l) => {
    const due = loanDueDate(l);
    if (!due) return;
    const d = daysUntil(due);
    if (d <= ALARM_WINDOW_DAYS) items.push({ key: `loan-${l.id}`, kind: "loan", id: l.id, view: "loans", title: `قسط ${toFaInt(Number(l.paidCount || 0) + 1)} وام «${l.title || ""}»`, amount: l.monthlyPayment, d });
  });
  reminders.filter((r) => !r.done && r.date).forEach((r) => {
    const d = daysUntil(r.date);
    if (d <= ALARM_WINDOW_DAYS) items.push({ key: `rem-${r.id}`, kind: "reminder", id: r.id, view: null, title: r.text || "یادآوری", amount: 0, d });
  });
  return items.sort((a, b) => a.d - b.d);
}
