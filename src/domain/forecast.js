import { addDays, addMonths, jalaliMonthRange, jalaliParts, parseISO, todayISO } from "../utils/dates.js";
import { loanDueDate } from "./loanTransactions.js";

/* پیش‌بینی پرداخت‌های یک ماه شمسی: اقساط وام، هزینه‌های تکرارشونده، قبض‌ها و چک‌های پرداختی */
export function forecastRange(offset = 0) {
  const base = offset ? addMonths(todayISO(), offset) : todayISO();
  return jalaliMonthRange(base);
}
export function buildForecast({ loans = [], recurring = [], bills = [], checks = [], categories = [], offset = 0 }) {
  const { start, end } = forecastRange(offset);
  const today = todayISO();
  const from = offset === 0 ? today : start;       // ماه جاری: فقط آنچه هنوز مانده (به‌علاوه‌ی عقب‌افتاده‌ها)
  const inRange = (d) => d >= from && d <= end;
  const overdue = (d) => offset === 0 && d < today;
  const catName = (id) => categories.find((c) => c.id === id)?.name || "";

  const loanItems = [];
  loans.forEach((l) => {
    if (!l.startDate) return;
    let k = Number(l.paidCount || 0), guard = 0;
    while (k < Number(l.installments || 0) && guard++ < 60) {
      const due = loanDueDate(l, k);
      if (!due || due > end) break;
      if (inRange(due) || overdue(due)) loanItems.push({ id: `${l.id}:${k + 1}`, title: `قسط ${k + 1} از ${l.installments} — ${l.title || "وام"}`, date: due, amount: Number(l.monthlyPayment || 0), late: overdue(due), ref: ["loans", l.id] });
      k++;
    }
  });

  const recItems = [];
  recurring.filter((r) => r.active !== false && r.nextDate && r.type === "expense").forEach((r) => {
    const anchor = jalaliParts(parseISO(r.startDate || r.nextDate)).day;
    let next = r.nextDate, guard = 0;
    while (next <= end && guard++ < 80) {
      if (inRange(next) || overdue(next)) recItems.push({ id: `${r.id}:${next}`, title: r.note || catName(r.categoryId) || "هزینه تکرارشونده", date: next, amount: Number(r.amount || 0), late: overdue(next), sub: r.interval === "weekly" ? "هفتگی" : "ماهانه" });
      next = r.interval === "weekly" ? addDays(next, 7) : addMonths(next, 1, anchor);
    }
  });

  const billItems = [];
  bills.filter((b) => !b.paid && b.dueDate).forEach((b) => {
    let due = b.dueDate, guard = 0;
    while (b.recurringMonthly && due < from && !overdue(due) && guard++ < 24) due = addMonths(due, 1);
    if (inRange(due) || overdue(due)) billItems.push({ id: b.id, title: `قبض ${b.title || ""}`, date: due, amount: Number(b.amount || 0), late: overdue(due), ref: ["bills", b.id] });
  });

  const checkItems = checks.filter((c) => c.status === "pending" && c.type === "paid" && c.dueDate && (inRange(c.dueDate) || overdue(c.dueDate)))
    .map((c) => ({ id: c.id, title: `چک پرداختی — ${c.payee || ""}`, date: c.dueDate, amount: Number(c.amount || 0), late: overdue(c.dueDate), ref: ["checks", c.id] }));

  const mk = (key, title, items) => ({ key, title, items: items.sort((a, b) => a.date.localeCompare(b.date)), total: items.reduce((s, x) => s + x.amount, 0) });
  const groups = [mk("loans", "اقساط وام", loanItems), mk("recurring", "هزینه‌های تکرارشونده", recItems), mk("bills", "قبض‌ها", billItems), mk("checks", "چک‌های پرداختی", checkItems)].filter((g) => g.items.length);
  return { start, end, groups, total: groups.reduce((s, g) => s + g.total, 0) };
}
