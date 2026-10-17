import { useMemo } from "react";

import { accountFlow, accTypeFa, balanceAtDate, catTotals, pctText } from "../../domain/reportMath.js";
import { useRangeState } from "../../hooks/useRangeState.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { jf } from "../../utils/dates.js";
import { DocView } from "./DocView.jsx";
import { ExportBar } from "./ExportBar.jsx";
import { PieBlock } from "./PieBlock.jsx";
import { RangePicker } from "./RangePicker.jsx";

export function IncomeExpenseReport({ accounts, transactions, categories }) {
  const st = useStyles();
  const rs = useRangeState("month");
  const { from, to } = rs.range;
  const d = useMemo(() => {
    const txs = transactions.filter((x) => x.date >= from && x.date <= to);
    const inc = catTotals(txs, "income", categories), exp = catTotals(txs, "expense", categories);
    const income = inc.reduce((s, x) => s + x.amount, 0), expense = exp.reduce((s, x) => s + x.amount, 0);
    const accRows = accounts.map((a) => { const f = accountFlow(a, transactions, from, to); return [a.name, accTypeFa(a.type), f.income, -f.expense, balanceAtDate(a, transactions, to)]; });
    return { inc, exp, income, expense, accRows };
  }, [accounts, transactions, categories, from, to]);
  const doc = {
    title: "گزارش هزینه و درآمد", subtitle: `از ${jf(from)} تا ${jf(to)}`,
    sections: [
      { title: "خلاصه", rows: [["جمع درآمد", d.income], ["جمع هزینه", -d.expense], ["خالص (سود / زیان)", d.income - d.expense]] },
      { title: "درآمد به تفکیک دسته", head: ["دسته", "مبلغ", "درصد"], rows: d.inc.map((c) => [c.name, c.amount, pctText(c.amount, d.income)]) },
      { title: "هزینه به تفکیک دسته", head: ["دسته", "مبلغ", "درصد"], rows: d.exp.map((c) => [c.name, -c.amount, pctText(c.amount, d.expense)]) },
      { title: "موجودی هر حساب در پایان بازه", head: ["حساب", "نوع", "دریافت", "پرداخت", "موجودی"], rows: d.accRows },
    ],
  };
  return (
    <div>
      <ExportBar doc={doc} />
      <div style={{ ...st.card, padding: 14, marginBottom: 14 }}><RangePicker rs={rs} /></div>
      <DocView doc={{ sections: [doc.sections[0]] }} />
      <PieBlock title="درآمد" data={d.inc} color={BRAND.darkgreen} />
      <PieBlock title="هزینه" data={d.exp} color={BRAND.crimson} />
      <DocView doc={{ sections: [doc.sections[3]] }} />
    </div>
  );
}
