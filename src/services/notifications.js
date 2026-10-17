import { LocalNotifications } from "@capacitor/local-notifications";

import { addMonths } from "../utils/dates.js";
import { toFaInt } from "../utils/format.js";

/* ---------------------------------------------------------
   اعلان‌های واقعی سررسید (Android): چک، قبض، قسط وام و یادآوری‌ها
   ساعت ۹ صبح همان روز (و برای چک/قبض، قبل از سررسید) نمایش داده می‌شوند.
--------------------------------------------------------- */
const DUE_NOTIF_BASE = 710000000;
const DUE_NOTIF_MAX = 60;
function atNine(dateStr, daysBefore = 0) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ""));
  return m ? new Date(+m[1], +m[2] - 1, +m[3] - daysBefore, 9, 0, 0) : null;
}
export async function rescheduleDueNotifications({ enabled, checks, bills, loans, reminders, checkDays }) {
  const pending = await LocalNotifications.getPending();
  const mine = (pending.notifications || []).filter((n) => n.id >= DUE_NOTIF_BASE && n.id < DUE_NOTIF_BASE + 1000);
  if (mine.length) await LocalNotifications.cancel({ notifications: mine.map((n) => ({ id: n.id })) });
  if (!enabled) return;
  const items = [];
  const push = (when, title, body) => {
    if (!when || isNaN(when.getTime())) return;
    const t = when.getTime();
    if (t > Date.now() + 10000 && t < Date.now() + 120 * 86400000) items.push({ when, title, body });
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
  (loans || []).filter((l) => l.startDate && l.paidCount < l.installments).forEach((l) => {
    const due = addMonths(l.startDate, l.paidCount);
    const what = `قسط ${l.title || "وام"}${l.monthlyPayment ? ` — ${toFaInt(l.monthlyPayment)} ریال` : ""}`;
    push(atNine(due, 1), "یادآوری سررسید قسط", `${what} — فردا سررسید است`);
    push(atNine(due, 0), "امروز سررسید قسط است", what);
  });
  (reminders || []).filter((r) => !r.done && r.date).forEach((r) => push(atNine(r.date, 0), "یادآوری Rexa", r.text || ""));
  const list = items.sort((a, b) => a.when - b.when).slice(0, DUE_NOTIF_MAX);
  if (!list.length) return;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === "prompt" || perm.display === "prompt-with-rationale") perm = await LocalNotifications.requestPermissions();
  if (perm.display !== "granted") return;
  try { await LocalNotifications.createChannel({ id: "rexa-due", name: "سررسیدها و یادآوری‌ها", description: "چک، قبض، قسط و یادآوری‌ها", importance: 4, visibility: 1 }); } catch {}
  await LocalNotifications.schedule({
    notifications: list.map((it, i) => ({ id: DUE_NOTIF_BASE + i, title: it.title, body: it.body, schedule: { at: it.when }, channelId: "rexa-due" })),
  });
}
