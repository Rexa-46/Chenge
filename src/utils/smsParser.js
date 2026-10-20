// Parses Persian number WORDS ("دویست و پنجاه هزار") into a numeric value.
// Needed because voice transcripts contain spoken numbers as words, not digits —
// the plain digit-regex below only catches typed/pasted numbers.
const FA_NUM_WORDS = {
  "صفر": 0, "یک": 1, "یه": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5, "شش": 6, "شیش": 6,
  "هفت": 7, "هشت": 8, "نه": 9, "ده": 10, "یازده": 11, "دوازده": 12, "سیزده": 13, "چهارده": 14,
  "پانزده": 15, "شانزده": 16, "هفده": 17, "هجده": 18, "نوزده": 19,
  "بیست": 20, "سی": 30, "چهل": 40, "پنجاه": 50, "شصت": 60, "هفتاد": 70, "هشتاد": 80, "نود": 90,
  "صد": 100, "یکصد": 100, "دویست": 200, "سیصد": 300, "چهارصد": 400, "پانصد": 500,
  "ششصد": 600, "هفتصد": 700, "هشتصد": 800, "نهصد": 900,
};
const FA_MULTIPLIERS = { "هزار": 1000, "میلیون": 1000000, "میلیارد": 1000000000 };
function persianWordsToNumber(text) {
  const words = text.replace(/[،,]/g, " ").split(/\s+/).filter(Boolean);
  let total = 0, current = 0, found = false;
  for (const w of words) {
    if (w === "و") continue;
    if (Object.prototype.hasOwnProperty.call(FA_NUM_WORDS, w)) { current += FA_NUM_WORDS[w]; found = true; }
    else if (Object.prototype.hasOwnProperty.call(FA_MULTIPLIERS, w)) { current = (current || 1) * FA_MULTIPLIERS[w]; total += current; current = 0; found = true; }
  }
  total += current;
  return found ? total : null;
}
export function normalizeDigitsText(text = "") {
  return String(text)
    .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, (d) => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
}
const AMOUNT_KEYWORDS = /مبلغ|واریز|برداشت|خرید|پرداخت|انتقال|هزینه|دریافت|کسر|اعتبار|بدهکار|بستانکار|amount|credit|debit|deposit/i;
const SKIP_BEFORE = /(?:کارت|شماره|شناسه|حساب|پیگیری|مرجع|رهگیری|شبا|تلفن|موبایل|کد|مانده|موجودی|باقیمانده|بالانس|balance|ref|iban)\s*[:：]?\s*[*xX\-\s]*$/i;
const INCOME_RE = /واریز|دریافت|حقوق|دستمزد|درآمد|طلب|سود|بستانکار|credit|deposit|income/gi;
const EXPENSE_RE = /برداشت|خرید|خرج|پرداخت|هزینه|دادم|داد|کرایه|بنزین|رستوران|شام|ناهار|کارمزد|کسر|بدهکار|debit|purchase|expense/gi;
// عدد = مبلغ، فقط وقتی با ریال/تومان همراه باشد یا کنار کلمه‌ی مبلغ بیاید؛ شماره کارت، تاریخ، ساعت، مانده و شماره پیگیری مبلغ حساب نمی‌شوند
function pickAmount(normalized) {
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(میلیارد|میلیون|هزار)?\s*(تومان|تومن|ریال)?/g;
  const cands = [];
  let m;
  while ((m = re.exec(normalized))) {
    const start = m.index, end = start + m[0].length;
    const numText = m[1].replace(/,/g, "");
    const before = normalized.slice(Math.max(0, start - 24), start);
    const prevCh = normalized[start - 1] || "", nextCh = normalized[start + m[1].length] || "";
    if (/[\/:\-]\d$/.test(before.slice(-2)) || /^[\/:]\d/.test(normalized.slice(start + m[1].length, start + m[1].length + 2))) continue;   // تاریخ یا ساعت
    if (/\*|x/i.test(prevCh) || /\*/.test(nextCh)) continue;                                              // ****1234
    if (!m[3] && !m[2] && (numText.length >= 13 || numText.length === 4 && /(?:کارت|حساب)\D{0,6}$/.test(before))) continue;
    if (!m[2] && !m[3] && /^\d{10,}$/.test(numText)) continue;                                              // شماره حساب/پیگیری/کارت
    if (SKIP_BEFORE.test(before) && !m[3]) continue;                                                       // مانده، کد پیگیری، ...
    if (/(مانده|موجودی|باقیمانده)\s*[:：]?\s*[+\-]?\s*$/.test(before)) continue;                           // مانده حتی با ریال
    let value = Number(numText);
    if (!Number.isFinite(value) || value <= 0) continue;
    value *= { "هزار": 1e3, "میلیون": 1e6, "میلیارد": 1e9 }[m[2]] || 1;
    const unit = m[3] || "";
    let score = 0;
    if (unit) score += 3;
    if (m[2]) score += 1;
    if (/,/.test(m[1])) score += 1;                                  // جداکننده‌ی هزارگان
    if (AMOUNT_KEYWORDS.test(before.slice(-16))) score += 3;
    if (/[+\-]\s*$/.test(before)) score += 1;
    cands.push({ value, unit, hasMult: !!m[2], start, end, score, sign: /\+\s*$/.test(before) ? "+" : /-\s*$/.test(before) ? "-" : "" });
  }
  if (!cands.length) return null;
  return cands.reduce((best, c) => (c.score > best.score ? c : best), cands[0]);   // برابر بودن امتیاز → اولین عدد
}
function pickType(raw, amountPos, sign) {
  if (sign === "+") return "income";
  if (sign === "-") return "expense";
  const hits = [];
  for (const [re, type] of [[INCOME_RE, "income"], [EXPENSE_RE, "expense"]]) { re.lastIndex = 0; let k; while ((k = re.exec(raw))) hits.push({ type, dist: Math.abs(k.index - amountPos) }); }
  if (!hits.length) return "expense";
  hits.sort((a, b) => a.dist - b.dist);
  return hits[0].type;   // نزدیک‌ترین کلمه‌ی کلیدی به مبلغ تعیین می‌کند (نه ترتیب بازنویسی)
}
/* opts.voice: متن گفتاری است. فقط در این حالت «۳۵۰ تومن» (بدون هزار/میلیون) به‌صورت حدسی ۳۵۰ هزار تومان گرفته می‌شود و scaleGuessed=true برمی‌گردد.
   برای پیامک بانکی هیچ حدس مقیاسی انجام نمی‌شود؛ عدد بدون واحد ریال فرض می‌شود. */
export function parseBankSms(text, opts = {}) {
  const raw = String(text || "").trim();
  const normalized = normalizeDigitsText(raw).replace(/[٬،]/g, ",");
  const pick = pickAmount(normalized);
  let amount = null, fromWords = false, scaleGuessed = false, pos = 0, sign = "";
  if (pick) {
    amount = pick.value; pos = pick.start; sign = pick.sign;
    if (pick.unit === "تومان" || pick.unit === "تومن") {
      if (opts.voice && !pick.hasMult && amount < 10000) { amount *= 1000; scaleGuessed = true; }
      amount *= 10;   // تومان → ریال
    }
  }
  if (!amount || !Number.isFinite(amount)) {
    const wordAmount = persianWordsToNumber(normalized);
    if (wordAmount !== null && wordAmount > 0) { amount = wordAmount; fromWords = true; if (/تومان|تومن/.test(normalized)) amount *= 10; }
  }
  const type = pickType(raw, pos, sign);
  const CATEGORY_HINTS = [
    { re: /بنزین|سوخت|پمپ/, name: "بنزین" },
    { re: /رستوران|غذا|شام|ناهار|صبحانه|کافه|سوپرمارکت|خرید خوراک|بازار/, name: "خوراک و بازار" },
    { re: /قبض|آب|برق|گاز|اینترنت|تلفن|شارژ/, name: "قبوض" },
    { re: /تاکسی|اسنپ|تپسی|اتوبوس|مترو|کرایه|حمل/, name: "حمل و نقل" },
    { re: /دارو|دکتر|درمان|بیمارستان|پزشک/, name: "درمان" },
    { re: /حقوق|دستمزد|مزایا|فیش حقوقی/, name: "حقوق" },
    { re: /فروش|فروش کالا|فروش محصول/, name: "درآمد متفرقه" },
  ];
  const hint = CATEGORY_HINTS.find((h) => h.re.test(raw));
  return { amount: amount && Number.isFinite(amount) ? Math.round(amount) : null, type, note: raw.replace(/\s+/g, " ").slice(0, 160), categoryHint: hint?.name, fromWords, scaleGuessed };
}
