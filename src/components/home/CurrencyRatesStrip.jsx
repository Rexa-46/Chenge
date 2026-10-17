import { DollarSign, RefreshCw } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { toFaInt } from "../../utils/format.js";

export function CurrencyRatesStrip({ rates, fetchRates }) {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, fontSize: 12, color: t.sub }}>
      <DollarSign size={13} />
      {rates?.usd ? (
        <span>هر دلار ≈ {toFaInt(Math.round(rates.usd))} ریال {rates.source === "tgju" ? "· بازار آزاد TGJU" : rates.source === "manual" ? "(دستی)" : ""}</span>
      ) : (
        <span>نرخ ارز در دسترس نیست</span>
      )}
      <button onClick={fetchRates} style={{ background: "none", border: "none", cursor: "pointer", color: t.sub, display: "flex" }}><RefreshCw size={13} /></button>
    </div>
  );
}
