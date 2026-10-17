import { addDays, findJalaliMonthStart, isoOf, jalaliParts, todayISO } from "../utils/dates.js";
import { faDigits } from "../utils/format.js";

const ACC_TYPE_FA = { bank: "بانک", card: "کارت", fund: "صندوق", cash: "نقد" };
export const accTypeFa = (ty) => ACC_TYPE_FA[ty] || "حساب";

export function reportRange(kind, from, to) {
  const today = todayISO();
  if (kind === "day") return { from: today, to: today };
  if (kind === "week") return { from: addDays(today, -6), to: today };
  if (kind === "month" || kind === "year") {
    const p = jalaliParts(new Date(today));
    return { from: isoOf(findJalaliMonthStart(p.y, kind === "year" ? 1 : p.m)), to: today };
  }
  const a = from || today, b = to || today;
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}
export const RANGE_KINDS = [["day", "امروز"], ["week", "هفتگی"], ["month", "ماهیانه"], ["year", "سالیانه"], ["custom", "بازه دلخواه"]];

export function txDelta(tx, accId) {
  if (tx.type === "expense" && tx.accountId === accId) return -tx.amount;
  if (tx.type === "income" && tx.accountId === accId) return tx.amount;
  if (tx.type === "transfer") return (tx.accountId === accId ? -tx.amount : 0) + (tx.toAccountId === accId ? tx.amount : 0);
  return 0;
}
export const balanceAtDate = (acc, txs, iso) => txs.reduce((b, tx) => (tx.date <= iso ? b + txDelta(tx, acc.id) : b), acc.initial || 0);
export function accountFlow(acc, txs, from, to) {
  const f = { income: 0, expense: 0, tin: 0, tout: 0, count: 0 };
  for (const tx of txs) {
    if (tx.date < from || tx.date > to) continue;
    if (tx.type === "income" && tx.accountId === acc.id) { f.income += tx.amount; f.count++; }
    else if (tx.type === "expense" && tx.accountId === acc.id) { f.expense += tx.amount; f.count++; }
    else if (tx.type === "transfer") {
      if (tx.accountId === acc.id) { f.tout += tx.amount; f.count++; }
      if (tx.toAccountId === acc.id) { f.tin += tx.amount; f.count++; }
    }
  }
  return f;
}

export const catTotals = (txs, type, categories) => {
  const map = {};
  txs.forEach((tx) => { if (tx.type === type) { const n = categories.find((c) => c.id === tx.categoryId)?.name || "بدون دسته"; map[n] = (map[n] || 0) + tx.amount; } });
  return Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
};
export const pctText = (v, total) => `${faDigits(total ? Math.round((v / total) * 100) : 0)}٪`;
