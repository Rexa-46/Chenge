import { toEnDigits } from "../utils/cardFormat.js";
import { jalaliToGregorian } from "../utils/dates.js";

// تاریخ چاپ‌شده روی برگه (شمسی یا میلادی) → YYYY-MM-DD میلادی؛ اگر نامعتبر بود null
function slipDateToISO(raw) {
  const m = toEnDigits(raw || "").match(/(\d{2,4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,4})/);
  if (!m) return null;
  let y, mo, d;
  if (m[1].length === 4 || +m[1] > 31) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if (m[3].length === 4 || +m[3] > 31) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else { y = 1400 + +m[1]; mo = +m[2]; d = +m[3]; }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let g;
  if (y >= 1700) g = [y, mo, d];
  else if (y >= 1300 && y <= 1500) g = jalaliToGregorian(y, mo, d);
  else return null;
  const dt = new Date(Date.UTC(g[0], g[1] - 1, g[2]));
  if (dt.getUTCMonth() !== g[1] - 1) return null;                  // مثلا ۳۱ شهریور
  if (dt.getTime() > Date.now() + 2 * 86400000) return null;       // تاریخ آینده = خوانش اشتباه
  return `${g[0]}-${String(g[1]).padStart(2, "0")}-${String(g[2]).padStart(2, "0")}`;
}
function slipTimeToHHMM(raw) {
  const m = toEnDigits(raw || "").match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (!m || +m[1] > 23 || +m[2] > 59) return null;
  return `${String(+m[1]).padStart(2, "0")}:${m[2]}`;
}
// اگر دسته‌بندی از اسکن به‌دست نیامد، از روی نام فروشگاه حدس بزن
export function guessExpenseCategoryId(categories, merchant) {
  const exp = categories.filter((c) => c.kind === "expense");
  const hay = String(merchant || "");
  const rules = [
    [/نان|نانوایی|بیکری|قنادی|شیرین|سوپر|مارکت|خوار|رستوران|کافه|کباب|پیتزا|ساندویچ|فست|میوه|سبزی|گوشت|مرغ|لبنی|قهوه|آبمیوه|ماهی|بستنی|چلو|برنج/, /خوراک|غذا|بازار|رستوران|سوپر/],
    [/بنزین|پمپ|سوخت|cng/i, /بنزین|سوخت|خودرو/],
    [/داروخانه|دارو|درمان|کلینیک|بیمارستان|دندان|آزمایش|پزشک/, /درمان|دارو|سلامت|بهداشت/],
    [/پوشاک|لباس|کفش|کیف|مزون/, /پوشاک|لباس/],
    [/تاکسی|اسنپ|تپسی|مترو|اتوبوس|بلیط/, /حمل|تاکسی|ایاب/],
  ];
  for (const [merchantRe, catRe] of rules) {
    if (!merchantRe.test(hay)) continue;
    const matches = exp.filter((c) => catRe.test(c.name));
    const leaf = matches.find((c) => !exp.some((x) => x.parentId === c.id));
    const pick = leaf || matches[0];
    if (pick) return pick.id;
  }
  return null;
}

const SLIP_NOISE = /رسید|خرید|بانک|کارت|شماره|پیگیری|مرجع|ترمینال|پایانه|پذیرنده|مبلغ|تاریخ|ساعت|موفق|پرداخت|تراکنش|مانده|سپاس|تشکر|شاپرک|پوز|ریال|تومان|کد\b|www|http|pos\b/i;
const SLIP_NUM_SKIP = /مانده|موجودی|کارت|شماره|پیگیری|مرجع|ترمینال|پایانه|پذیرنده|سریال|کد|rrn|stan/i;
function slipNumbersIn(line) {
  const clean = line
    .replace(/\d{2,4}\s*[\/\-]\s*\d{1,2}\s*[\/\-]\s*\d{1,4}/g, " ")   // تاریخ
    .replace(/\d{1,2}\s*:\s*\d{2}(?:\s*:\s*\d{2})?/g, " ");            // ساعت
  const out = [];
  const re = /\d{1,3}(?:[,.\s]\d{3})+|\d+/g; let m;
  while ((m = re.exec(clean))) {
    const digits = m[0].replace(/[,.\s]/g, "");
    if (digits.length < 4 || digits.length > 11) continue;               // کوتاه‌تر از ۱۰۰۰ یا شبیه شماره کارت/پیگیری
    out.push(Number(digits));
  }
  return out;
}
// متن خام OCR → { merchant, amount, date, time, categoryId }
export function parseSlipText(raw, categories) {
  const text = toEnDigits(String(raw || "")).replace(/[٬،]/g, ",").replace(/٫/g, ".");
  const lines = text.split(/\r?\n/).map((l) => l.replace(/[|_~=*\u200c\u200f\u200e]+/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  // مبلغ
  let amount = 0;
  const KEY = /مبلغ|مبلع|مبل[غع]|amount|قابل\s*پرداخت|جمع\s*کل|خرید\s*[:：]/i;
  for (let i = 0; i < lines.length && !amount; i++) {
    if (!KEY.test(lines[i]) || /مانده|موجودی/.test(lines[i])) continue;
    const nums = slipNumbersIn(lines[i]); const next = lines[i + 1] ? slipNumbersIn(lines[i + 1]) : [];
    amount = nums[0] || next[0] || 0;
  }
  if (!amount) {
    const cands = [];
    lines.forEach((l) => { if (SLIP_NUM_SKIP.test(l)) return; slipNumbersIn(l).forEach((n) => cands.push({ n, hot: /ریال|تومان|rial/i.test(l) })); });
    const hot = cands.filter((c) => c.hot);
    const pool = hot.length ? hot : cands;
    if (pool.length) amount = Math.max(...pool.map((c) => c.n));
  }
  if (amount && /تومان/.test(text) && !/ریال/.test(text)) amount *= 10;
  // تاریخ و ساعت
  let date = null;
  for (const m of text.matchAll(/\d{2,4}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{1,4}/g)) { date = slipDateToISO(m[0]); if (date) break; }
  let time = null;
  for (const m of text.matchAll(/\d{1,2}\s*:\s*\d{2}/g)) { time = slipTimeToHHMM(m[0]); if (time) break; }
  // نام فروشگاه
  const cleanName = (v) => String(v || "").replace(/[^\u0600-\u06FFA-Za-z0-9\s\-\.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  let merchant = "";
  for (let i = 0; i < lines.length && !merchant; i++) {
    const m = lines[i].match(/(?:نام\s*)?(?:پذیرنده|فروشگاه|فروشنده|واحد\s*صنفی|نام\s*واحد)\s*[:：]?\s*(.*)$/);
    if (m) { const cand = cleanName(m[1] || lines[i + 1] || ""); if (/[\u0600-\u06FF]{2,}/.test(cand) && !/^\d+$/.test(cand)) merchant = cand; }
  }
  if (!merchant) {
    for (const l of lines.slice(0, 10)) {
      const persian = (l.match(/[\u0600-\u06FF]/g) || []).length, digits = (l.match(/\d/g) || []).length;
      if (persian >= 3 && digits <= 2 && !SLIP_NOISE.test(l)) { merchant = cleanName(l); break; }
    }
  }
  return { merchant, amount: Math.round(amount) || 0, date, time, categoryId: guessExpenseCategoryId(categories, merchant) };
}
