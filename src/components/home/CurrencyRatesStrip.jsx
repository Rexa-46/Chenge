import { DollarSign, RefreshCw } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { faDigits, toFaInt } from "../../utils/format.js";

const TAG = { market: "بازار آزاد", cached: "آخرین نرخ ذخیره‌شده", manual: "دستی", approx: "تقریبی؛ نه بازار آزاد" };
const timeOf = (iso) => { try { return faDigits(new Date(iso).toTimeString().slice(0, 5)); } catch { return ""; } };
const dayOf = (iso) => { try { return new Intl.DateTimeFormat("fa-IR", { month: "2-digit", day: "2-digit" }).format(new Date(iso)); } catch { return ""; } };

export function CurrencyRatesStrip({ rates, fetchRates }) {
  const t = useT();
  const usd = rates?.usd ? Math.round(rates.usd) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, fontSize: 12, color: t.sub, flexWrap: "wrap" }}>
      <DollarSign size={13} />
      {usd ? (
        <span style={{ textAlign: "center", lineHeight: 1.8 }}>
          هر دلار ≈ {toFaInt(usd)} ریال ({toFaInt(usd / 10)} تومان)
          <br /><span style={{ fontSize: 10.5 }}>{TAG[rates.source] || ""}{rates.source === "cached" ? ` · ${dayOf(rates.fetchedAt)} ${timeOf(rates.fetchedAt)}` : rates.source === "market" ? ` · ${timeOf(rates.fetchedAt)}` : ""}</span>
        </span>
      ) : (
        <span>نرخ ارز در دسترس نیست</span>
      )}
      <button onClick={fetchRates} aria-label="به‌روزرسانی نرخ" style={{ background: "none", border: "none", cursor: "pointer", color: t.sub, display: "flex" }}><RefreshCw size={13} /></button>
    </div>
  );
}
