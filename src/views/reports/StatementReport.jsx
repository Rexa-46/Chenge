import { useMemo, useState } from "react";

import { balanceAtDate, txDelta } from "../../domain/reportMath.js";
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

export function StatementReport({ accounts, transactions, categories, members, projects, events }) {
  const st = useStyles(); const t = useT();
  const rs = useRangeState("month", "statement");
  const [accId, setAccId] = useState("__all");
  const [opt, setOpt] = useState({ note: true, category: false, member: false, project: false, event: false, tags: false });
  const { from, to } = rs.range;
  const single = accId !== "__all" ? accounts.find((a) => a.id === accId) : null;
  const nameOf = (list, id) => list.find((x) => x.id === id)?.name || "";
  const doc = useMemo(() => {
    const txs = transactions
      .filter((x) => x.date >= from && x.date <= to && (!single || x.accountId === single.id || x.toAccountId === single.id))
      .sort((a, b) => (a.date + (a.time || "") + (a.createdAt || "")).localeCompare(b.date + (b.time || "") + (b.createdAt || "")));
    let bal = single ? balanceAtDate(single, transactions, addDays(from, -1)) : 0;
    const opening = bal;
    const head = ["تاریخ", "نوع", ...(single ? [] : ["حساب"]), "مبلغ", ...(single ? ["مانده"] : []),
      ...(opt.note ? ["شرح"] : []), ...(opt.category ? ["دسته"] : []), ...(opt.member ? ["عضو خانواده"] : []),
      ...(opt.project ? ["پروژه"] : []), ...(opt.event ? ["رویداد"] : []), ...(opt.tags ? ["برچسب"] : [])];
    let inc = 0, exp = 0;
    const rows = txs.map((x) => {
      const typeFa = x.type === "income" ? "دریافت" : x.type === "expense" ? "پرداخت" : "انتقال";
      let amount;
      if (single) { const dlt = txDelta(x, single.id); bal += dlt; amount = dlt; if (dlt >= 0) inc += dlt; else exp += -dlt; }
      else { amount = x.type === "income" ? x.amount : x.type === "expense" ? -x.amount : toFaInt(x.amount); if (x.type === "income") inc += x.amount; if (x.type === "expense") exp += x.amount; }
      const accCell = x.type === "transfer" ? `${nameOf(accounts, x.accountId)} ← ${nameOf(accounts, x.toAccountId)}` : nameOf(accounts, x.accountId);
      return [jf(x.date), typeFa, ...(single ? [] : [accCell]), amount, ...(single ? [bal] : []),
        ...(opt.note ? [x.note || ""] : []), ...(opt.category ? [nameOf(categories, x.categoryId)] : []), ...(opt.member ? [nameOf(members, x.memberId)] : []),
        ...(opt.project ? [nameOf(projects, x.projectId)] : []), ...(opt.event ? [nameOf(events, x.eventId)] : []), ...(opt.tags ? [(x.tags || []).join("، ")] : [])];
    });
    const sumRows = single
      ? [["مانده ابتدای دوره", opening], ["جمع ورودی", inc], ["جمع خروجی", -exp], ["مانده پایان دوره", bal], ["تعداد تراکنش", toFaInt(txs.length)]]
      : [["جمع دریافت‌ها", inc], ["جمع پرداخت‌ها", -exp], ["تعداد تراکنش", toFaInt(txs.length)]];
    return {
      title: `صورتحساب - ${single ? single.name : "همه حساب‌ها"}`, subtitle: `از ${jf(from)} تا ${jf(to)}`,
      sections: [{ title: "جمع‌بندی", rows: sumRows }, { title: "ریز تراکنش‌ها", head, rows }],
    };
  }, [transactions, accounts, categories, members, projects, events, single, from, to, opt]);
  const chips = [["note", "شرح"], ["category", "دسته"], ["member", "عضو خانواده"], ["project", "پروژه"], ["event", "رویداد"], ["tags", "برچسب"]];
  return (
    <div>
      <ExportBar doc={doc} />
      <div style={{ ...st.card, padding: 14, marginBottom: 14 }}>
        <AccountPicker accounts={accounts} value={accId} onChange={setAccId} allowAll />
        <RangePicker rs={rs} />
        <div style={{ fontSize: 12.5, fontWeight: 700, color: t.sub, marginBottom: 8 }}>نمایش در صورتحساب (با تیک زدن اضافه می‌شود)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {chips.map(([k, l]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 10px", borderRadius: 16, background: opt[k] ? `${BRAND.header}22` : t.input, cursor: "pointer", fontWeight: 600 }}>
              <input type="checkbox" checked={opt[k]} onChange={() => setOpt((o) => ({ ...o, [k]: !o[k] }))} style={{ accentColor: BRAND.header }} />{l}
            </label>
          ))}
        </div>
      </div>
      <DocView doc={doc} />
    </div>
  );
}
