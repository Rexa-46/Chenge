/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
export const toFaInt = (n) => Math.round(Number(n || 0)).toLocaleString("fa-IR");
const FA_DIGIT_MAP = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
export const faDigits = (n) => String(n).split("").map((ch) => (/[0-9]/.test(ch) ? FA_DIGIT_MAP[+ch] : ch)).join("");

// Currency display: base unit stored everywhere internally is always Rial.
// This only affects how numbers are *shown*, so data entry / storage stays consistent.
// usdRialRate = how many Rials one US Dollar costs right now (from the live rates widget,
// or the manual value the user entered in Settings if the live fetch didn't work).
export function formatMoney(amount, currency, usdRialRate) {
  const n = Number(amount || 0);
  if (currency === "toman") return `${toFaInt(Math.round(n / 10))} تومان`;
  if (currency === "usd") {
    if (!usdRialRate) return `${toFaInt(n)} ریال`; // no rate yet, fall back to Rial rather than guess
    return `$${(n / usdRialRate).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  return `${toFaInt(n)} ریال`;
}

// مبلغ را به دو بخش «عدد» و «واحد» می‌شکند (واحد در کادر به‌صورت عمودی نوشته می‌شود)
export function moneyParts(amount, currency, usdRate) {
  const n = Number(amount || 0);
  if (currency === "toman") return { num: toFaInt(Math.round(n / 10)), unit: "تومان" };
  if (currency === "usd" && usdRate) return { num: (n / usdRate).toLocaleString("en-US", { maximumFractionDigits: 2 }), unit: "$" };
  return { num: toFaInt(n), unit: "ریال" };
}
