import { useEffect, useState } from "react";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

/* ---------------------------------------------------------
   نرخ دلار «بازار آزاد» (ریال). ترتیب: منابع زنده‌ی بازار آزاد ← آخرین نرخ موفق ذخیره‌شده ← نرخ دستی ← (فقط در نبود هر چیز دیگر) نرخ جهانی تقریبی.
   نرخ جهانی/رسمی هرگز جای بازار آزاد نمی‌نشیند و همیشه با برچسب «تقریبی» نشان داده می‌شود.
--------------------------------------------------------- */
const LAST_RATE_KEY = "rexa:lastUsdRate";
const saveLastRate = (usd, fetchedAt) => { try { localStorage.setItem(LAST_RATE_KEY, JSON.stringify({ usd, fetchedAt })); } catch {} };
const readLastRate = () => { try { const v = JSON.parse(localStorage.getItem(LAST_RATE_KEY) || "null"); return v?.usd > 0 ? v : null; } catch { return null; } };

const toNum = (v) => { const n = Number(String(v ?? "").replace(/[,٬\s]/g, "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))); return Number.isFinite(n) ? n : 0; };
const MIN_RIAL = 200000, MAX_RIAL = 100000000;   // بازه‌ی منطقی نرخ دلار به ریال؛ بیرون از آن عدد رد می‌شود

async function httpGet(url, accept) {
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.get({ url, headers: { Accept: accept, "Cache-Control": "no-cache" }, connectTimeout: 7000, readTimeout: 9000 });
    return typeof r.data === "string" ? r.data : JSON.stringify(r.data);
  }
  const r = await fetch(url, { cache: "no-store", headers: { Accept: accept } });
  return await r.text();
}

// هر منبع یک عدد (ریال یا تومان) برمی‌گرداند؛ تشخیص واحد و اعتبار بعداً انجام می‌شود
const MARKET_SOURCES = [
  { label: "TGJU · دلار آزاد", url: "https://call4.tgju.org/ajax.json", accept: "application/json",
    parse: (txt) => { const j = JSON.parse(txt); const c = j?.current?.price_dollar_rl; return toNum(c?.p ?? c?.price ?? c); } },
  { label: "TGJU · دلار آزاد", url: "https://call3.tgju.org/ajax.json", accept: "application/json",
    parse: (txt) => { const j = JSON.parse(txt); const c = j?.current?.price_dollar_rl; return toNum(c?.p ?? c?.price ?? c); } },
  { label: "TGJU · دلار آزاد", url: "https://www.tgju.org/profile/price_dollar_rl", accept: "text/html",
    parse: (html) => {
      const pats = [/data-col="info\.last_trade\.PDrCotVal"[^>]*>\s*([0-9,٬۰-۹]{6,})/, /نرخ فعلی[^0-9۰-۹]{0,80}([0-9,٬۰-۹]{6,})/, /price_dollar_rl[^0-9]{0,120}([0-9,]{6,})/];
      for (const re of pats) { const m = html.match(re); if (m) { const n = toNum(m[1]); if (n > 0) return n; } }
      return 0;
    } },
];

// اگر عدد به تومان آمده بود (یا ده‌برابر شده بود) نسبت به نرخ مرجع به ریال درستش می‌کنیم؛ عدد نامعتبر ۰ می‌شود
function sane(v, ref) {
  let n = toNum(v);
  if (!(n > 0)) return 0;
  if (ref) {
    if (n * 10 >= ref * 0.65 && n * 10 <= ref * 1.35) n *= 10;           // به تومان آمده بود
    else if (n < ref * 0.5 || n > ref * 2) return 0;                       // با آخرین نرخ بازار جور نیست
  }
  return n >= MIN_RIAL && n <= MAX_RIAL ? Math.round(n) : 0;
}

async function fetchApprox() {
  const txt = await httpGet("https://open.er-api.com/v6/latest/USD", "application/json");
  return toNum(JSON.parse(txt)?.rates?.IRR);
}

export function useExchangeRates({ loaded, settings, setSettings }) {
  const [rates, setRates] = useState(null); // { usd: rialsPerUsd, fetchedAt, source, sourceLabel }

  async function fetchRates() {
    const last = readLastRate();
    for (const src of MARKET_SOURCES) {
      try {
        const raw = src.parse(await httpGet(src.url, src.accept));
        const irr = sane(raw, last?.usd);
        if (!irr) continue;
        const fetchedAt = new Date().toISOString();
        setRates({ usd: irr, fetchedAt, source: "market", sourceLabel: src.label });
        saveLastRate(irr, fetchedAt);
        setSettings((prev) => ({ ...prev, lastRatesUpdate: fetchedAt }));
        return;
      } catch { /* منبع بعدی */ }
    }
    // هیچ منبع زنده‌ای جواب نداد: آخرین نرخ بازار → نرخ دستی → نرخ جهانی تقریبی
    if (last) { setRates({ usd: last.usd, fetchedAt: last.fetchedAt, source: "cached", sourceLabel: "آخرین نرخ ذخیره‌شده" }); return; }
    const manual = toNum(settings.manualUsdRate);
    if (manual > 0) { setRates({ usd: manual, fetchedAt: new Date().toISOString(), source: "manual", sourceLabel: "دستی" }); return; }
    try {
      const approx = await fetchApprox();
      if (approx >= MIN_RIAL && approx <= MAX_RIAL) { setRates({ usd: Math.round(approx), fetchedAt: new Date().toISOString(), source: "approx", sourceLabel: "نرخ جهانی (تقریبی، نه بازار آزاد)" }); return; }
    } catch {}
    setRates((prev) => prev?.usd ? prev : { usd: null, fetchedAt: new Date().toISOString(), source: "failed", sourceLabel: "" });
  }
  // یک‌بار بعد از بارگذاری نرخ ارز گرفته می‌شود (fetchRates عمداً در وابستگی‌ها نیست)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (loaded) fetchRates(); }, [loaded]);
  useEffect(() => {
    if (!loaded || settings.manualUsdRate === undefined) return;
    const manual = toNum(settings.manualUsdRate);
    if (manual > 0 && rates?.source === "manual") setRates((r) => ({ ...r, usd: manual }));
  }, [settings.manualUsdRate, loaded]);

  return { rates, fetchRates };
}
