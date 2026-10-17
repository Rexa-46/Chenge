/* ---------------------------------------------------------
   Bank card carousel — swipeable, with a show/hide-balance eye
--------------------------------------------------------- */
// تاریخ انقضا: ۴ رقم و یک «/» بین دو رقم اول و دو رقم دوم (مثلا 04/08)
export const toEnDigits = (v) => String(v || "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
export function fmtExpiry4(v) { const d = toEnDigits(v).replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
export function expiryFromStored(v) { let d = toEnDigits(v).replace(/\D/g, ""); if (d.length >= 6) d = d.slice(2, 6); return fmtExpiry4(d); } // مقدارهای قدیمی مثل 1406/08 → 06/08
