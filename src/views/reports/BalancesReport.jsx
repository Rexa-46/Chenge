import { useMemo } from "react";

import { accountFlow, accTypeFa, balanceAtDate } from "../../domain/reportMath.js";
import { useRangeState } from "../../hooks/useRangeState.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { addDays, jf } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { DocView } from "./DocView.jsx";
import { ExportBar } from "./ExportBar.jsx";
import { RangePicker } from "./RangePicker.jsx";

export function BalancesReport({ accounts, transactions }) {
  const st = useStyles(); const t = useT();
  const rs = useRangeState("day", "balances");
  const { from, to } = rs.range;
  const rows = useMemo(() => accounts.map((a) => {
    const opening = balanceAtDate(a, transactions, addDays(from, -1)), f = accountFlow(a, transactions, from, to);
    return [a.name, accTypeFa(a.type), opening, f.income + f.tin, -(f.expense + f.tout), opening + f.income + f.tin - f.expense - f.tout];
  }), [accounts, transactions, from, to]);
  const sum = (i) => rows.reduce((s, r) => s + r[i], 0);
  const doc = {
    title: "گزارش مانده حساب‌ها", subtitle: `از ${jf(from)} تا ${jf(to)}`,
    sections: [{ title: "همه‌ی حساب‌ها", head: ["حساب", "نوع", "مانده ابتدا", "دریافت", "پرداخت", "مانده پایان"], rows: [...rows, ["جمع کل", "", sum(2), sum(3), sum(4), sum(5)]] }],
  };
  return (
    <div>
      <ExportBar doc={doc} />
      <div style={{ ...st.card, padding: 14, marginBottom: 14 }}><RangePicker rs={rs} /></div>
      <div style={{ ...st.card, padding: 16, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: t.sub }}>جمع مانده‌ی همه‌ی حساب‌ها در پایان بازه</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: sum(5) >= 0 ? BRAND.darkgreen : BRAND.crimson, marginTop: 4 }}>{toFaInt(sum(5))} <span style={{ fontSize: 12 }}>ریال</span></div>
      </div>
      <DocView doc={doc} />
    </div>
  );
}
