import { useState } from "react";

import { AmountInput } from "../../components/inputs/AmountInput.jsx";

export function BudgetRow({ category, budget, upsertBudget, st }) {
  const [val, setVal] = useState(budget ? String(budget.amount) : "");
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderBottom: "1px solid #f0eef3", gap: 10 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>{category.name}</span>
      <AmountInput placeholder="بودجه ماهانه" value={val} onChange={(v) => { setVal(v); upsertBudget(category.id, Number(v || 0)); }} style={{ ...st.input, margin: 0, width: 150 }} />
    </div>
  );
}
