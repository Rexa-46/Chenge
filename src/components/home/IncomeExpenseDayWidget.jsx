import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";

import { ColorPie } from "../charts/ColorPie.jsx";
import { SmileFrownArc } from "../charts/SmileFrownArc.jsx";
import { DayArrowBtn } from "./DayArrowBtn.jsx";
import { TotalBox } from "./TotalBox.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { EXPENSE_COLORS, INCOME_COLORS } from "../../theme/chartColors.js";
import { BRAND } from "../../theme/palette.js";
import { periodKey, periodLabel, stepPeriod, todayISO } from "../../utils/dates.js";
import { faDigits, formatMoney } from "../../utils/format.js";

export function IncomeExpenseDayWidget({ day, setDay, transactions, catById, currency, usdRate, bills = [], checks = [], onOpenTransactions }) {
  const t = useT();
  const [show, setShow] = useState({ expense: true, income: true });
  const [period, setPeriod] = useState("month");
  const [selected, setSelected] = useState(null);
  const touchX = useRef(null);
  useEffect(() => { setSelected(null); }, [day, show, period]);
  // اگر امروز تراکنشی نیست، یک بار به آخرین روزی که تراکنش دارد برو تا نمودار خالی نماند
  const autoJumped = useRef(false);
  useEffect(() => {
    if (autoJumped.current || !transactions.length) return;
    autoJumped.current = true;
    if (transactions.some((tx) => periodKey(tx.date, period) === periodKey(day, period))) return;
    const dates = transactions.filter((tx) => tx.type === "income" || tx.type === "expense").map((tx) => tx.date).filter(Boolean).sort();
    if (dates.length) setDay(dates[dates.length - 1]);
    // eslint-disable-next-line
  }, [transactions]);

  const dayKey = periodKey(day, period);
  const dayTx = useMemo(() => transactions.filter((tx) => tx.date && periodKey(tx.date, period) === dayKey), [transactions, dayKey, period]);
  const income = dayTx.filter((tx) => tx.type === "income").reduce((s, tx) => s + Number(tx.amount || 0), 0);
  const expense = dayTx.filter((tx) => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount || 0), 0);
  // یک نمودار برای هر دو: برش‌های هزینه و درآمد کنار هم
  const pieData = useMemo(() => {
    const build = (type, colors) => {
      const map = {};
      dayTx.filter((tx) => tx.type === type).forEach((tx) => {
        const name = catById(tx.categoryId)?.name || "بدون دسته";
        map[name] = (map[name] || 0) + Number(tx.amount || 0);
      });
      let all = Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));
      if (all.length > 6) all = [...all.slice(0, 5), { name: "سایر", amount: all.slice(5).reduce((x, d) => x + d.amount, 0) }];
      return all.map((d, k) => ({ ...d, type, color: colors[k % colors.length] }));
    };
    return [...(show.expense ? build("expense", EXPENSE_COLORS) : []), ...(show.income ? build("income", INCOME_COLORS) : [])];
  }, [dayTx, show, catById]);
  const toggleKind = (k) => setShow((p) => {
    const other = k === "expense" ? "income" : "expense";
    return p[k] && !p[other] ? p : { ...p, [k]: !p[k] }; // حداقل یکی همیشه روشن می‌ماند
  });

  const dueCount = bills.filter((b) => !b.paid && b.dueDate && periodKey(b.dueDate, period) === dayKey).length + checks.filter((c) => c.status === "pending" && c.dueDate && periodKey(c.dueDate, period) === dayKey).length;
  const sel = selected != null ? pieData[selected] : null;

  const prev = () => setDay(stepPeriod(day, period, -1));
  const next = () => setDay(stepPeriod(day, period, 1));
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 55) { dx > 0 ? prev() : next(); }
  };

  return (
    <div style={{ background: t.card, borderRadius: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", direction: "rtl" }}>
      {/* هدر */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${t.border}` }}>
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: t.inputBorder, color: t.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
          {faDigits(dueCount)}
        </span>
        <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 800, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          سررسیدهای، <span onClick={() => setDay(todayISO())} style={{ color: BRAND.violet, cursor: "pointer" }}>{periodLabel(day, period)}</span>
        </div>
        <button onClick={onOpenTransactions} aria-label="تراکنش‌ها" style={{ border: "none", background: "transparent", color: t.text, display: "flex", padding: 4, cursor: "pointer" }}>
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* بازه: روز / ماه / سال */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 12 }}>
        {[["day", "روز"], ["month", "ماه"], ["year", "سال"]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "5px 16px", borderRadius: 14, background: period === k ? BRAND.violet : t.inputBorder, color: period === k ? "#fff" : t.sub }}>{l}</button>
        ))}
      </div>

      <SmileFrownArc income={income} expense={expense} />

      {/* نمودار + فلش‌ها */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px 8px" }}>
        <DayArrowBtn dir="right" onClick={prev} />
        <div style={{ flex: 1, maxWidth: 290, margin: "0 auto", touchAction: "pan-y" }}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
          <ColorPie data={pieData} selected={selected} onSelect={setSelected} />
        </div>
        <DayArrowBtn dir="left" onClick={next} />
      </div>
      {sel && (
        <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 700, color: sel.color, padding: "0 12px 4px" }}>
          {sel.name} — {formatMoney(sel.amount, currency, usdRate)}
        </div>
      )}

      {/* جمع درآمدها / هزینه‌ها */}
      <div style={{ display: "flex", gap: 12, padding: "14px 12px 14px" }}>
        <TotalBox kind="expense" active={show.expense} amount={expense} currency={currency} usdRate={usdRate} onClick={() => toggleKind("expense")} />
        <TotalBox kind="income" active={show.income} amount={income} currency={currency} usdRate={usdRate} onClick={() => toggleKind("income")} />
      </div>
    </div>
  );
}
