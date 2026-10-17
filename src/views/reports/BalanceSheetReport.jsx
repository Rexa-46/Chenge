import { useMemo, useState } from "react";

import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { accTypeFa, balanceAtDate } from "../../domain/reportMath.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { jf, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { DocView } from "./DocView.jsx";
import { ExportBar } from "./ExportBar.jsx";

export function BalanceSheetReport({ accounts, transactions, assets, debts, loans, checks, bills }) {
  const st = useStyles(); const t = useT();
  const [asOf, setAsOf] = useState(todayISO());
  const doc = useMemo(() => {
    const accRows = accounts.map((a) => [`${a.name} (${accTypeFa(a.type)})`, balanceAtDate(a, transactions, asOf)]);
    const accTotal = accRows.reduce((s, r) => s + r[1], 0);
    const assetRows = (assets || []).map((x) => [x.name || x.title || "دارایی", (Number(x.quantity) * Number(x.currentPrice)) || 0]).filter((r) => r[1]);
    const receivable = (debts || []).filter((d) => !d.settled && d.kind === "receivable").reduce((s, d) => s + Number(d.amount || 0), 0);
    const checksIn = (checks || []).filter((c) => c.status === "pending" && c.type === "received").reduce((s, c) => s + Number(c.amount || 0), 0);
    const assetLines = [...accRows, ...assetRows, ["طلب‌ها (بدهکاران)", receivable], ["چک‌های دریافتی در جریان", checksIn]].filter((r, i) => i < accRows.length || r[1]);
    const totalAssets = accTotal + assetRows.reduce((s, r) => s + r[1], 0) + receivable + checksIn;
    const payable = (debts || []).filter((d) => !d.settled && d.kind === "payable").reduce((s, d) => s + Number(d.amount || 0), 0);
    const loanRows = (loans || []).filter((l) => !l.spent).map((l) => [`وام: ${l.title}`, Math.max(0, Number(l.principal || 0) - (l.paidCount || 0) * Number(l.monthlyPayment || 0))]).filter((r) => r[1]);
    const checksOut = (checks || []).filter((c) => c.status === "pending" && c.type !== "received").reduce((s, c) => s + Number(c.amount || 0), 0);
    const unpaidBills = (bills || []).filter((b) => !b.paid).reduce((s, b) => s + Number(b.amount || 0), 0);
    const liabLines = [["بدهی‌ها (بستانکاران)", payable], ...loanRows, ["چک‌های پرداختی در جریان", checksOut], ["قبض‌های پرداخت‌نشده", unpaidBills]].filter((r) => r[1]);
    const totalLiab = liabLines.reduce((s, r) => s + r[1], 0);
    const spentLoanRows = (loans || []).filter((l) => l.spent).map((l) => [`وام: ${l.title}`, Math.max(0, Number(l.principal || 0) - (l.paidCount || 0) * Number(l.monthlyPayment || 0))]).filter((r) => r[1]);
    return {
      title: "ترازنامه", subtitle: `تا تاریخ ${jf(asOf)}`,
      sections: [
        { title: "دارایی‌ها", head: ["شرح", "مبلغ"], rows: [...assetLines, ["جمع دارایی‌ها", totalAssets]] },
        { title: "بدهی‌ها", head: ["شرح", "مبلغ"], rows: [...liabLines, ["جمع بدهی‌ها", -totalLiab]] },
        { title: "خالص دارایی (حقوق صاحب)", rows: [["دارایی‌ها − بدهی‌ها", totalAssets - totalLiab]] },
        ...(spentLoanRows.length ? [{ title: "وام‌های خرج‌شده (جزو جمع‌ها نیست)", head: ["شرح", "باقی‌مانده"], rows: spentLoanRows }] : []),
      ],
      net: totalAssets - totalLiab,
    };
  }, [accounts, transactions, assets, debts, loans, checks, bills, asOf]);
  return (
    <div>
      <ExportBar doc={doc} />
      <div style={{ ...st.card, padding: 14, marginBottom: 14 }}>
        <label style={st.label}>تا تاریخ</label>
        <JalaliDateInput value={asOf} onChange={setAsOf} style={st.input} />
        {asOf !== todayISO() && <div style={{ fontSize: 11.5, color: t.sub }}>موجودی حساب‌ها تا همین تاریخ حساب می‌شود؛ دارایی‌ها، وام‌ها، چک‌ها و قبض‌ها وضعیت فعلی هستند.</div>}
      </div>
      <div style={{ ...st.card, padding: 16, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: t.sub }}>خالص دارایی</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: doc.net >= 0 ? BRAND.darkgreen : BRAND.crimson, marginTop: 4 }}>{toFaInt(doc.net)} <span style={{ fontSize: 12 }}>ریال</span></div>
      </div>
      <DocView doc={doc} />
    </div>
  );
}
