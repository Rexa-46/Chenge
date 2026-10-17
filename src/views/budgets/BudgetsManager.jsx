import { useState } from "react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { useStyles } from "../../theme/styles.js";
import { BudgetRow } from "./BudgetRow.jsx";

export function BudgetsManager({ categories, budgets, upsertBudget, addCategory }) {
  const st = useStyles();
  const expenseCats = categories.filter((c) => c.kind === "expense");
  const [newName, setNewName] = useState("");
  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>افزودن آیتم بودجه جدید</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثلا آموزش" style={{ ...st.input, margin: 0, flex: 1 }} />
          <button onClick={() => { if (!newName.trim()) return; addCategory?.({ name: newName.trim(), kind: "expense" }); setNewName(""); }} style={{ ...st.primaryBtn, width: "auto", padding: "0 14px" }}>افزودن</button>
        </div>
      </div>
      <div style={{ ...st.card, padding: "8px 12px" }}>
      {expenseCats.length === 0 && <EmptyRow text="ابتدا یک دسته هزینه بسازید" />}
      {expenseCats.map((c) => {
        const b = budgets.find((bb) => bb.categoryId === c.id);
        return <BudgetRow key={c.id} category={c} budget={b} upsertBudget={upsertBudget} st={st} />;
      })}
      </div>
    </div>
  );
}
