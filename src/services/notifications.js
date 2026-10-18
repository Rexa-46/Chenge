import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

import { loanDueDate } from "../domain/loanTransactions.js";
import { toFaInt } from "../utils/format.js";

/* ---------------------------------------------------------
   اعلان‌های واقعی سررسید (Android): چک، قبض، قسط وام و یادآوری‌ها
   ساعت ۹ صبح همان روز (و برای چک/قبض/قسط، قبل از سررسید) نمایش داده می‌شوند.
   اعلان قسط وام دکمه‌ی «ثبت پرداخت قسط» دارد؛ با لمس اعلان یا دکمه، برنامه باز می‌شود
   و پنجره‌ی ثبت همان قسط نمایش داده می‌شود.
--------------------------------------------------------- */
const DUE_NOTIF_BASE = 710000000;
const DUE_NOTIF_MAX = 60;
const LOAN_ACTION_TYPE = "rexa-loan-due";
const LOAN_ACTION_PAY = "pay";

function atNine(dateStr, daysBefore = 0) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ""));
  return m ? new Date(+m[1], +m[2] - 1, +m[3] - daysBefore, 9, 0, 0) : null;
}
// نزدیک‌ترین ساعت ۹ صبحِ آینده (برای قسط عقب‌افتاده)
function nextNine() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  if (d.getTime() <= Date.now() + 60000) d.setDate(d.getDate() + 1);
  return d;
}

/* --- تحویل درخواست «ثبت قسط» از اعلان به صفحه‌ی وام‌ها --- */
let pendingLoanId = null;
const loanPaySubs = new Set();
export const consumePendingLoanPay = () => { const v = pendingLoanId; pendingLoanId = null; return v; };
export function onLoanPayRequest(fn) { loanPaySubs.add(fn); return () => loanPaySubs.delete(fn); }
let actionListenerReady = false;
export async function listenNotificationActions() {
  if (actionListenerReady || !Capacitor.isNativePlatform()) return;
  actionListenerReady = true;
  try {
    await LocalNotifications.addListener("localNotificationActionPerformed", (ev) => {
      const extra = ev?.notification?.extra || {};
      if (!extra.loanId || ev?.actionId === "dismiss") return;
      pendingLoanId = String(extra.loanId);
      loanPaySubs.forEach((fn) => { try { fn(pendingLoanId); } catch {} });
    });
  } catch {}
}

export async function rescheduleDueNotifications({ enabled, checks, bills, loans, reminders, checkDays }) {
  const pending = await LocalNotifications.getPending();
  const mine = (pending.notifications || []).filter((n) => n.id >= DUE_NOTIF_BASE && n.id < DUE_NOTIF_BASE + 1000);
  if (mine.length) await LocalNotifications.cancel({ notifications: mine.map((n) => ({ id: n.id })) });
  if (!enabled) return;
  const items = [];
  const push = (when, title, body, extra) => {
    if (!when || isNaN(when.getTime())) return;
    const t = when.getTime();
    if (t > Date.now() + 10000 && t < Date.now() + 120 * 86400000) items.push({ when, title, body, extra });
  };
  (checks || []).filter((c) => c.status === "pending" && c.dueDate).forEach((c) => {
    const what = `چک ${c.type === "received" ? "دریافتی" : "پرداختی"} ${c.payee || ""} — ${toFaInt(c.amount)} ریال`;
    if (checkDays > 0) push(atNine(c.dueDate, checkDays), "یادآوری سررسید چک", `${what} — ${toFaInt(checkDays)} روز دیگر سررسید می‌شود`);
    push(atNine(c.dueDate, 0), "امروز سررسید چک است", what);
  });
  (bills || []).filter((b) => !b.paid && b.dueDate).forEach((b) => {
    const what = `قبض ${b.title || ""}${b.amount ? ` — ${toFaInt(b.amount)} ریال` : ""}`;
    push(atNine(b.dueDate, 1), "یادآوری سررسید قبض", `${what} — فردا سررسید است`);
    push(atNine(b.dueDate, 0), "امروز سررسید قبض است", what);
  });
  // قسط وام: چه وام تازه باشد چه «خرج‌شده»، هر قسط پرداخت‌نشده سررسید و اعلان دارد
  (loans || []).filter((l) => l.startDate && Number(l.paidCount || 0) < Number(l.installments || 0)).forEach((l) => {
    const due = loanDueDate(l);
    const seq = Number(l.paidCount || 0) + 1;
    const what = `قسط ${seq} ${l.title || "وام"}${l.monthlyPayment ? ` — ${toFaInt(l.monthlyPayment)} ریال` : ""}`;
    const extra = { loanId: String(l.id), seq };
    const dueAt = atNine(due, 0);
    if (dueAt && dueAt.getTime() < Date.now() - 60000) {
      push(nextNine(), "قسط وام عقب افتاده", `${what} — سررسید گذشته؛ برای ثبت پرداخت لمس کنید`, extra);
      return;
    }
    push(atNine(due, 1), "یادآوری سررسید قسط", `${what} — فردا سررسید است`, extra);
    push(dueAt, "امروز سررسید قسط است", `${what} — برای ثبت پرداخت لمس کنید`, extra);
  });
  (reminders || []).filter((r) => !r.done && r.date).forEach((r) => push(atNine(r.date, 0), "یادآوری Rexa", r.text || ""));
  const list = items.sort((a, b) => a.when - b.when).slice(0, DUE_NOTIF_MAX);
  if (!list.length) return;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === "prompt" || perm.display === "prompt-with-rationale") perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return;
  try { await LocalNotifications.createChannel({ id: "rexa-due", name: "سررسیدها و یادآوری‌ها", description: "چک، قبض، قسط و یادآوری‌ها", importance: 4, visibility: 1 }); } catch {}
  try { await LocalNotifications.registerActionTypes({ types: [{ id: LOAN_ACTION_TYPE, actions: [{ id: LOAN_ACTION_PAY, title: "ثبت پرداخت قسط" }] }] }); } catch {}
  await LocalNotifications.schedule({
    notifications: list.map((it, i) => ({
      id: DUE_NOTIF_BASE + i, title: it.title, body: it.body, schedule: { at: it.when }, channelId: "rexa-due",
      ...(it.extra ? { actionTypeId: LOAN_ACTION_TYPE, extra: it.extra } : {}),
    })),
  });
}
