import { useState } from "react";

import { AmountInput } from "../../components/inputs/AmountInput.jsx";

/* ---------------------------------------------------------
   Assets Manager
--------------------------------------------------------- */
export function AssetPriceEdit({ asset, setAssets, st }) {
  const [val, setVal] = useState(String(asset.currentPrice));
  return (
    <AmountInput value={val} onChange={(v) => { setVal(v); setAssets((p) => p.map((x) => x.id === asset.id ? { ...x, currentPrice: Number(v || 0) } : x)); }} style={{ ...st.input, margin: 0, width: 110 }} />
  );
}
