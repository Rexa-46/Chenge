import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { toFaInt } from "../../utils/format.js";

/* ---------------------------------------------------------
   Transactions View
--------------------------------------------------------- */
export function TransactionSummaryChart({ transactions, onSelect }) {
  const t = useT();
  const [selected, setSelected] = useState(null);
  const summary = useMemo(() => {
    const incomeTx = transactions.filter((x) => x.type === "income");
    const expenseTx = transactions.filter((x) => x.type === "expense");
    return [
      { name: "هزینه", amount: expenseTx.reduce((s, x) => s + x.amount, 0), type: "expense", count: expenseTx.length },
      { name: "درآمد", amount: incomeTx.reduce((s, x) => s + x.amount, 0), type: "income", count: incomeTx.length },
    ];
  }, [transactions]);
  if (!summary.some((x) => x.amount > 0)) return null;
  const detail = selected ? summary.find((x) => x.type === selected) : null;
  return <div style={{ background: t.card, borderRadius: 14, padding: 12, margin: "8px 14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
    <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 6 }}>خلاصه همه تراکنش‌ها</div>
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={summary} onClick={(e) => { const p = e?.activePayload?.[0]?.payload; if (p) { setSelected(p.type); onSelect?.(p.type); } }}>
        <XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11 }} />
        <YAxis tick={{ fontFamily: FONT, fontSize: 10 }} width={45} />
        <Tooltip formatter={(v) => `${toFaInt(v)} ریال`} contentStyle={{ fontFamily: FONT, direction: "rtl" }} />
        <Bar dataKey="amount" radius={[8,8,0,0]} cursor="pointer">
          {summary.map((x, i) => <Cell key={i} fill={x.type === "income" ? BRAND.darkgreen : BRAND.crimson} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
    {detail ? (
      <div style={{ background: detail.type === "income" ? "#eef8f1" : "#fff0f3", borderRadius: 10, padding: 10, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: detail.type === "income" ? BRAND.darkgreen : BRAND.crimson }}>
        {detail.name}: {toFaInt(detail.amount)} ریال · {toFaInt(detail.count)} تراکنش
      </div>
    ) : <div style={{ textAlign: "center", color: t.sub, fontSize: 11.5 }}>روی ستون درآمد یا هزینه لمس کن تا جزئیات و همان موارد را ببینی.</div>}
  </div>;
}
