import { faDigits } from "./format.js";

export function jalaliYear(d) {
  try { return parseInt(new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric" }).format(d), 10); }
  catch { return new Date(d).getFullYear(); }
}
export function jalaliParts(d) {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d);
    return {
      y: +parts.find((p) => p.type === "year").value,
      m: +parts.find((p) => p.type === "month").value,
      day: +parts.find((p) => p.type === "day").value,
    };
  } catch { return { y: d.getFullYear(), m: d.getMonth() + 1, day: d.getDate() }; }
}
export function faLongDate(d) {
  try { return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d); }
  catch { return d.toDateString(); }
}
export function faMonthYear(d) {
  try { return new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric" }).format(d); }
  catch { return ""; }
}
export function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function findJalaliMonthStart(jYear, jMonth) {
  // Farvardin 1 (Jalali New Year) falls around March 21 of (jYear + 621) in the Gregorian
  // calendar, and each subsequent Jalali month is ~30 days later. This anchor gets us close
  // enough that a modest search window reliably lands on the true day 1 of the target month.
  const approxNewYear = new Date(Date.UTC(jYear + 621, 2, 21));
  const anchor = new Date(approxNewYear);
  anchor.setUTCDate(anchor.getUTCDate() + (jMonth - 1) * 30);
  for (let delta = -25; delta <= 25; delta++) {
    const d = new Date(anchor); d.setUTCDate(d.getUTCDate() + delta);
    const p = jalaliParts(d);
    if (p.y === jYear && p.m === jMonth && p.day === 1) return d;
  }
  return null;
}
export function getJalaliMonthCells(jYear, jMonth) {
  const start = findJalaliMonthStart(jYear, jMonth);
  if (!start) return [];
  const cells = []; let d = new Date(start);
  for (let i = 0; i < 32; i++) {
    const p = jalaliParts(d);
    if (p.y !== jYear || p.m !== jMonth) break;
    cells.push({ date: new Date(d), day: p.day, weekday: (d.getUTCDay() + 1) % 7 });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return cells;
}

/* ---------------------------------------------------------
   اسکن برگه پوز: عکس برگه → خواندن نام پذیرنده، مبلغ، تاریخ و ساعت
   → پیش‌نویس هزینه (دسته‌بندی خودکار)؛ کاربر فقط حساب را انتخاب و ثبت می‌کند.
--------------------------------------------------------- */
export function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  let gd = days + 1;
  const sal = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (; gm < 13 && gd > sal[gm]; gm++) gd -= sal[gm];
  return [gy, gm, gd];
}

function faDayMonth(dateStr) {
  try { return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(dateStr)); }
  catch { return dateStr; }
}
export function periodKey(rawDate, period) {
  const dateStr = String(rawDate || "").slice(0, 10); // اگر تاریخ همراه ساعت ذخیره شده باشد هم کار کند
  if (period === "day") return dateStr;
  const p = jalaliParts(new Date(dateStr));
  return period === "year" ? String(p.y) : `${p.y}-${p.m}`;
}
export function stepPeriod(dateStr, period, dir) {
  if (period === "day") return addDays(dateStr, dir);
  const k = periodKey(dateStr, period);
  let d = dateStr;
  for (let i = 0; i < 400; i++) { d = addDays(d, dir); if (periodKey(d, period) !== k) break; }
  return d;
}
export function periodLabel(dateStr, period) {
  if (period === "day") return faDayMonth(dateStr);
  if (period === "month") return faMonthYear(new Date(dateStr));
  return `سال ${faDigits(jalaliParts(new Date(dateStr)).y)}`;
}

// تاریخ «n ماه شمسی قبل» با همان روزِ ماه (مثل روش بانک‌ها: روزهای یکسان از ماه‌های مختلف)
export function jalaliMonthsAgoISO(iso, n) {
  const [Y, M, D] = iso.split("-").map(Number);
  const p = jalaliParts(new Date(Y, M - 1, D, 12));
  const total = p.y * 12 + (p.m - 1) - n;
  const y = Math.floor(total / 12), m = (total % 12 + 12) % 12 + 1;
  const toISO = ([gy, gm, gd]) => `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
  let day = p.day;
  while (day > 29) {   // اگر روز در ماه مقصد وجود نداشت (مثلا ۳۱ در مهر) به آخرین روز همان ماه برمی‌گردد
    const g = jalaliToGregorian(y, m, day);
    const back = jalaliParts(new Date(g[0], g[1] - 1, g[2], 12));
    if (back.m === m && back.day === day) break;
    day--;
  }
  return toISO(jalaliToGregorian(y, m, day));
}

/* ---------------------------------------------------------
   گزارش‌های جدید: خلاصه، هزینه/درآمد با نمودار، مانده حساب‌ها، صورتحساب، ترازنامه
   هر گزارش یک «سند» می‌سازد که هم روی صفحه نمایش داده می‌شود و هم به Excel و PDF می‌رود.
--------------------------------------------------------- */
export const jf = (iso) => { try { return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)); } catch { return iso; } };

export const isoOf = (d) => (d ? d.toISOString().slice(0, 10) : todayISO());
