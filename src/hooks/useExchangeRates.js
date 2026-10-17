import { useEffect, useState } from "react";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

/* ---------------------------------------------------------
   نرخ دلار بازار آزاد: یک‌بار بعد از بارگذاری گرفته می‌شود و با نرخ دستی هماهنگ می‌ماند
--------------------------------------------------------- */
export function useExchangeRates({ loaded, settings, setSettings }) {
  const [rates, setRates] = useState(null); // { usd: rialsPerUsd, fetchedAt }

  // نرخ دلار بازار آزاد از TGJU؛ در APK با CapacitorHttp مستقیم به اینترنت وصل می‌شویم.
  // اگر TGJU موقتاً در دسترس نباشد، نرخ قبلی/دستی حفظ می‌شود تا عدد اشتباه نمایش داده نشود.
  async function fetchRates() {
    const url = "https://gem.tgju.org/profile/price_dollar_rl";
    try {
      let html = "";
      if (Capacitor.isNativePlatform()) {
        const r = await CapacitorHttp.get({ url, headers: { Accept: "text/html" } });
        html = String(r?.data || "");
      } else {
        const r = await fetch(url, { cache: "no-store" });
        html = await r.text();
      }
      const patterns = [
        /نرخ فعلی[^0-9]{0,80}([0-9,]{6,})/i,
        /نرخ فعلی\s*:\s*([0-9,]{6,})/i,
        /Last[^0-9]{0,40}([0-9,]{6,})/i,
        /price_dollar_rl[^0-9]{0,120}([0-9,]{6,})/i
      ];
      let irr = 0;
      for (const re of patterns) {
        const m = html.match(re);
        if (m) { irr = Number(String(m[1]).replace(/,/g, "")); if (irr > 0) break; }
      }
      if (!Number.isFinite(irr) || irr <= 0) throw new Error("TGJU dollar rate not found");
      const fetchedAt = new Date().toISOString();
      setRates({ usd: irr, fetchedAt, source: "tgju", sourceLabel: "TGJU · دلار آزاد" });
      setSettings((prev) => ({ ...prev, lastRatesUpdate: fetchedAt }));
    } catch {
      const manual = Number(String(settings.manualUsdRate || "").replace(/,/g, ""));
      setRates((prev) => prev?.usd ? { ...prev, source: prev.source || "cached", fetchedAt: prev.fetchedAt || new Date().toISOString() } : { usd: manual > 0 ? manual : null, fetchedAt: new Date().toISOString(), source: manual > 0 ? "manual" : "failed", sourceLabel: manual > 0 ? "دستی" : "" });
    }
  }
  // یک‌بار بعد از بارگذاری نرخ ارز گرفته می‌شود (fetchRates عمداً در وابستگی‌ها نیست)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (loaded) fetchRates(); }, [loaded]);
  useEffect(() => {
    if (!loaded || settings.manualUsdRate === undefined) return;
    const manual = Number(String(settings.manualUsdRate || "").replace(/,/g, ""));
    if (manual > 0 && rates?.source === "manual") setRates((r) => ({ ...r, usd: manual }));
  }, [settings.manualUsdRate, loaded]);

  return { rates, fetchRates };
}
