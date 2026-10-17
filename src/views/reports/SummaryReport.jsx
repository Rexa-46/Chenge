import { useMemo, useState } from "react";

import { accountFlow, balanceAtDate, catTotals, pctText } from "../../domain/reportMath.js";
import { useRangeState } from "../../hooks/useRangeState.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { addDays, jf } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { AccountPicker } from "./AccountPicker.jsx";
import { DocView } from "./DocView.jsx";
import { ExportBar } from "./ExportBar.jsx";
import { RangePicker } from "./RangePicker.jsx";

export function SummaryReport({ accounts, transactions, categories }) {
  const st = useStyles(); const t = useT();
  const rs = useRangeState("month");
  const [accId, setAccId] = useState(accounts[0]?.id || null);
  const acc = accounts.find((a) => a.id === accId);
  const { from, to } = rs.range;
  const data = useMemo(() => {
    if (!acc) return null;
    const opening = balanceAtDate(acc, transactions, addDays(from, -1));
    const f = accountFlow(acc, transactions, from, to);
    const closing = opening + f.income + f.tin - f.expense - f.tout;
    const cats = catTotals(transactions.filter((x) => x.accountId === acc.id && x.date >= from && x.date <= to), "expense", categories);
    return { opening, f, closing, cats };
  }, [acc, transactions, categories, from, to]);
  const doc = data && {
    title: `خلاصه گزارش - ${acc.name}`, subtitle: `از ${jf(from)} تا ${jf(to)}`,
    sections: [
      { title: "خلاصه", rows: [["مانده ابتدای دوره", data.opening], ["جمع دریافت‌ها", data.f.income], ["جمع پرداخت‌ها", -data.f.expense], ["انتقال به این حساب", data.f.tin], ["انتقال از این حساب", -data.f.tout], ["مانده پایان دوره", data.closing], ["تعداد تراکنش", toFaInt(data.f.count)]] },
      { title: "هزینه به تفکیک دسته", head: ["دسته", "مبلغ", "درصد"], rows: data.cats.map((c) => [c.name, c.amount, pctText(c.amount, data.f.expense)]) },
    ],
  };
  return (
    <div>
      <ExportBar doc={doc} />
      <div style={{ ...st.card, padding: 14, marginBottom: 14 }}>
        <AccountPicker accounts={accounts} value={accId} onChange={setAccId} />
        <RangePicker rs={rs} />
      </div>
      {data ? (
        <>
          <div style={{ ...st.card, padding: 16, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: t.sub }}>مانده پایان دوره — {acc.name}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: data.closing >= 0 ? BRAND.darkgreen : BRAND.crimson, marginTop: 4 }}>{toFaInt(data.closing)} <span style={{ fontSize: 12 }}>ریال</span></div>
          </div>
          <DocView doc={doc} />
        </>
      ) : <div style={{ textAlign: "center", color: t.sub, padding: 20 }}>ابتدا یک حساب تعریف کنید.</div>}
    </div>
  );
}
