import { accountPath } from "./accountTree.js";

/* کیلومترشمار: برای حساب‌های مرتبط با خودرو (بنزین، تعویض روغن، لاستیک، سرویس …) */
const VEHICLE_RE = /خودرو|ماشین|بنزین|سوخت|گازوئیل|روغن|لنت|لاستیک|تایر|فیلتر|سرویس|موتور|اتومبیل/;
export const isVehicleCategory = (categories, categoryId) => {
  const c = categories.find((x) => x.id === categoryId);
  return !!c && accountPath(categories, c).some((n) => VEHICLE_RE.test(n));
};
const stamp = (t) => `${t.date || ""}${t.time || ""}`;
const faToEn = (s) => String(s ?? "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[,٬\s]/g, "");
export const parseKm = (v) => { const n = Number(faToEn(v)); return Number.isFinite(n) && n > 0 ? n : 0; };

// آخرین کیلومتر ثبت‌شده (قبل از تاریخ/ساعت داده‌شده) و آخرین ثبتِ همین دسته
export function odometerContext(transactions, { categoryId, date, time, excludeId }) {
  const withKm = transactions.filter((t) => t.id !== excludeId && Number(t.odometer) > 0 && stamp(t) <= `${date || "9999"}${time || ""}`)
    .sort((a, b) => stamp(b).localeCompare(stamp(a)));
  const lastAny = withKm[0] || null;
  const lastSame = withKm.find((t) => t.categoryId === categoryId) || null;
  return { lastAny, lastSame };
}
