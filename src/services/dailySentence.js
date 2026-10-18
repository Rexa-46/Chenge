import { Capacitor, CapacitorHttp } from "@capacitor/core";

import { withTimeout } from "../utils/async.js";
import { todayISO } from "../utils/dates.js";

/* ---------------------------------------------------------
   جمله روزانه انگلیسی — اسپلاش هنگام هر بار باز شدن برنامه؛ جمله تا پایان همان روز ثابت است
   تلفظ با صدای دستگاه پخش می‌شود؛ ۲ ثانیه بعد از پایان تلفظ با فید وارد برنامه می‌شود.
--------------------------------------------------------- */
/* --- جمله روزانه: فقط از اینترنت، رایگان و نامحدود (Tatoeba — بدون کلید API) ---
   هیچ جمله‌ای داخل برنامه نیست. فقط جمله‌ی امروز تا پایان همان روز نگه داشته می‌شود تا عوض نشود،
   و شناسه‌ی جمله‌های قبلی برای تکراری نشدن. */
const SENTENCE_CACHE_KEY = "rexa:dailySentence";      // جمله امروز (تا پایان روز ثابت می‌ماند)
const SENTENCE_HISTORY_KEY = "rexa:dailySentenceIds"; // فقط شناسه‌ها
const readJson = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch { return d; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let _sentenceErr = "";
async function httpGetJson(url, ms = 5000) {
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.get({ url, headers: { Accept: "application/json" }, connectTimeout: ms, readTimeout: ms });
    if (r.status < 200 || r.status >= 300) throw new Error(`HTTP ${r.status}`);
    return typeof r.data === "string" ? JSON.parse(r.data) : r.data;
  }
  const r = await withTimeout(fetch(url, { headers: { Accept: "application/json" } }), ms);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}
const okEnglish = (en) => { const w = en.trim().split(/\s+/).length; return w >= 4 && w <= 16 && /^[A-Za-z]/.test(en) && !/[0-9@#<>]/.test(en); };
// منبع ۱: Tatoeba (جمله‌ی انگلیسی + ترجمه‌ی فارسی)، اول بدون کلمه، بعد با یک کلمه‌ی عمومی تصادفی
async function sentenceFromTatoeba(used, word) {
  const q = new URLSearchParams({ from: "eng", to: "pes", query: word || "", trans_filter: "limit", trans_to: "pes", sort: "random", orphans: "no", unapproved: "no" });
  const data = await httpGetJson(`https://tatoeba.org/en/api_v0/search?${q.toString()}`);
  const options = [];
  for (const it of data?.results || []) {
    const en = String(it?.text || "").trim();
    if (!okEnglish(en) || used.has(it.id)) continue;
    const fa = (it.translations || []).flat().find((tr) => tr?.lang === "pes" && String(tr.text || "").trim());
    if (fa) options.push({ id: it.id, en, faPron: "", fa: String(fa.text).trim() });
  }
  if (!options.length) throw new Error("نتیجه‌ای نبود");
  return options[Math.floor(Math.random() * options.length)];
}
// منبع ۲: یک جمله‌ی انگلیسی تصادفی از dummyjson + ترجمه‌ی فارسی با MyMemory (هر دو رایگان و بدون کلید)
async function sentenceFromQuoteApi(used) {
  for (let i = 0; i < 4; i++) {
    const q = await httpGetJson("https://dummyjson.com/quotes/random");
    const en = String(q?.quote || "").trim();
    if (!okEnglish(en) || used.has(`q${q.id}`)) continue;
    const tr = await httpGetJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(en)}&langpair=en|fa`);
    const fa = String(tr?.responseData?.translatedText || "").trim();
    if (!fa || /MYMEMORY|QUERY LENGTH/i.test(fa)) throw new Error("ترجمه‌ای نبود");
    return { id: `q${q.id}`, en, faPron: "", fa };
  }
  throw new Error("جمله‌ی مناسبی نبود");
}
async function fetchOnlineSentence(usedIds = []) {
  const used = new Set(usedIds);
  const WORDS = ["you", "I", "we", "they", "he", "she", "what", "where", "when", "how", "why", "can", "want", "like", "need", "go", "come", "make", "know", "think", "today", "tomorrow", "friend", "work", "home", "water", "time", "good", "very", "please"];
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const errs = [];
  // هر سه منبع هم‌زمان پرسیده می‌شوند و اولین جمله‌ی معتبر استفاده می‌شود؛ بنابراین یک منبع کند یا قطع، صفحه‌ی اول را معطل نمی‌کند
  const tasks = [["tatoeba", () => sentenceFromTatoeba(used, "")], ["tatoeba-word", () => sentenceFromTatoeba(used, word)], ["quote", () => sentenceFromQuoteApi(used)]]
    .map(([name, fn]) => withTimeout(fn(), 6000).catch((e) => { errs.push(`${name}: ${e?.message || e}`); throw e; }));
  try { return await Promise.any(tasks); }
  catch { _sentenceErr = errs.join(" | "); throw new Error(_sentenceErr); }
}
export const getSentenceError = () => _sentenceErr;
// جمله امروز؛ اگر اینترنت نبود null (برنامه بدون نمایش جمله وارد می‌شود)
let _todaySentencePromise = null;
export function resolveTodaySentence() {
  if (_todaySentencePromise) return _todaySentencePromise;
  _todaySentencePromise = (async () => {
    try { localStorage.removeItem("rexa:sentenceStash"); localStorage.removeItem("rexa:dailySentenceHistory"); } catch {}
    const today = todayISO();
    const cache = readJson(SENTENCE_CACHE_KEY, null);
    if (cache && cache.date === today && cache.en) return cache;
    const ids = readJson(SENTENCE_HISTORY_KEY, []);
    try {
      const pick = await withTimeout(fetchOnlineSentence(ids), 8000);
      writeJson(SENTENCE_HISTORY_KEY, [...ids, pick.id].slice(-300));
      const out = { date: today, ...pick, source: "online" };
      writeJson(SENTENCE_CACHE_KEY, out);
      return out;
    } catch { return cache && cache.en ? cache : null; }   // اینترنت نبود/کند بود: آخرین جمله‌ی ذخیره‌شده، وگرنه ورود بدون جمله
  })();
  return _todaySentencePromise;
}
