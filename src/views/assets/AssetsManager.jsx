import { useState } from "react";
import { postOnce } from "../../domain/financialEngine.js";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { RefreshCw, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles, miniBtn } from "../../theme/styles.js";
import { todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";
import { AssetPriceEdit } from "./AssetPriceEdit.jsx";

export function AssetsManager({ assets, setAssets, accounts = [], setTransactions }) {
  const [refreshing, setRefreshing] = useState(false);
  const st = useStyles();
  const [form, setForm] = useState({ kind: "crypto", symbol: "", quantity: "", avgPrice: "", currentPrice: "", accountId: "" });
  const total = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  function add() {
    if (!form.symbol || !form.quantity) return;
    const assetId = uid();
    const qty = Number(form.quantity), avg = Number(form.avgPrice || 0), cost = qty * avg;
    setAssets((p) => [...p, { id: assetId, kind: form.kind, symbol: form.symbol, quantity: qty, avgPrice: avg, currentPrice: Number(form.currentPrice || avg || 0), accountId: form.accountId || "", createdAt: new Date().toISOString() }]);
    if (cost > 0 && form.accountId) setTransactions?.((prev) => postOnce(prev, { type: "expense", amount: cost, accountId: form.accountId, date: todayISO(), time: new Date().toTimeString().slice(0,5), note: `خرید دارایی ${form.symbol}`, sourceType: "asset_purchase", sourceId: assetId, assetId, categoryId: "cat-asset-purchase", isPnlExcluded: true }));
    setForm({ ...form, symbol: "", quantity: "", avgPrice: "", currentPrice: "" });
  }
  return (
    <div>
      <div style={{ background: "#eef8f1", border: "1px solid #cde7d4", borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 12, color: "#28633a", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span>قیمت دارایی‌های شناخته‌شده ارز دیجیتال را می‌توانی لحظه‌ای بروزرسانی کنی.</span>
        <button disabled={refreshing} onClick={async () => {
          setRefreshing(true);
          try {
            const ids = { BTC: "bitcoin", ETH: "ethereum", USDT: "tether", BNB: "binancecoin", XRP: "ripple", SOL: "solana" };
            for (const a of assets.filter((x) => x.kind === "crypto")) {
              const coin = ids[String(a.symbol).toUpperCase()]; if (!coin) continue;
              const data = Capacitor.isNativePlatform()
                ? (await CapacitorHttp.get({ url: `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=irr` })).data
                : await (await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=irr`)).json();
              const price = Number(data?.[coin]?.irr);
              if (price > 0) setAssets((p) => p.map((x) => x.id === a.id ? { ...x, currentPrice: price, priceUpdatedAt: new Date().toISOString() } : x));
            }
          } catch {} finally { setRefreshing(false); }
        }} style={{ ...miniBtn, width: 38, height: 38, background: BRAND.green, color: "#fff" }}><RefreshCw size={15} /></button>
      </div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن دارایی</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setForm({ ...form, kind: "crypto" })} style={pillStyle(form.kind === "crypto")}>ارز دیجیتال</button>
          <button onClick={() => setForm({ ...form, kind: "stock" })} style={pillStyle(form.kind === "stock")}>بورس</button>
        </div>
        <input placeholder="نماد (مثلا BTC یا فولاد)" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} style={st.input} />
        <KeypadInput kind="decimal" placeholder="تعداد / مقدار" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={st.input} inputMode="decimal" />
        <AmountInput placeholder="قیمت خرید (ریال)" value={form.avgPrice} onChange={(v) => setForm({ ...form, avgPrice: v })} style={st.input} />
        <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}><option value="">حساب پرداخت خرید (اختیاری)</option>{accounts.filter(a => a.active !== false).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <AmountInput placeholder="قیمت فعلی (ریال)" value={form.currentPrice} onChange={(v) => setForm({ ...form, currentPrice: v })} style={st.input} />
        <button onClick={add} style={st.primaryBtn}>افزودن دارایی</button>
      </div>
      <SectionTitle text={`ارزش کل: ${toFaInt(total)} ریال`} />
      <div style={{ ...st.card, padding: "4px 12px" }}>
        {assets.length === 0 && <EmptyRow text="دارایی‌ای ثبت نشده" />}
        {assets.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", borderBottom: "1px solid #f0eef3" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.symbol} <span style={{ fontSize: 11, color: "#8a8194" }}>({a.kind === "crypto" ? "ارز دیجیتال" : "بورس"})</span></div>
              <div style={{ fontSize: 12, color: "#8a8194" }}>تعداد: {a.quantity} · ارزش: {toFaInt(a.quantity * a.currentPrice)} ریال</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <AssetPriceEdit asset={a} setAssets={setAssets} st={st} />
              <button onClick={() => { setAssets((p) => p.filter((x) => x.id !== a.id)); setTransactions?.((p) => p.filter((t) => !(t.sourceType === "asset_purchase" && t.sourceId === a.id))); }} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
