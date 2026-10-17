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
export function parseBankSms(text) {
  const raw = String(text || "").trim();
  const normalized = normalizeDigitsText(raw).replace(/[٬,،]/g, "");
  const amountMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|هزار)?\s*(تومان|تومن|ریال)?/);
  let amount = null;
  let fromWords = false;
  if (amountMatch) {
    amount = Number(amountMatch[1]);
    const mult = { "هزار": 1e3, "میلیون": 1e6, "میلیارد": 1e9 }[amountMatch[2]] || 1;
    amount *= mult;
    if (amountMatch[3] === "تومان" || amountMatch[3] === "تومن") {
      // In spoken Persian, "۳۵۰ تومن" is commonly shorthand for 350 thousand Toman.
      if (!amountMatch[2] && amount < 10000) amount *= 1000;
      amount *= 10;
    }
  }
  if (!amount || !Number.isFinite(amount)) {
    const wordAmount = persianWordsToNumber(normalized);
    if (wordAmount !== null && wordAmount > 0) { amount = wordAmount; fromWords = true; }
  }
  if (amount === null) {
    const fallback = normalized.match(/\d+/);
    if (fallback) amount = Number(fallback[0]);
  }
  let type = "expense";
  if (/واریز|دریافت|حقوق|دستمزد|درآمد|طلب|credit|deposit|income/i.test(raw)) type = "income";
  if (/برداشت|خرید|خرج|پرداخت|هزینه|دادم|داد|کرایه|بنزین|رستوران|شام|ناهار|debit|purchase|expense/i.test(raw)) type = "expense";
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
  return { amount: amount && Number.isFinite(amount) ? Math.round(amount) : null, type, note: raw.replace(/\s+/g, " ").slice(0, 160), categoryHint: hint?.name, fromWords };
}
