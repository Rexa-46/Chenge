import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { JalaliDateInput } from "../../components/inputs/JalaliDateInput.jsx";
import { balanceAtDate } from "../../domain/reportMath.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { addDays, jalaliMonthsAgoISO, todayISO } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { normalizeDigitsText } from "../../utils/smsParser.js";

export function AccountAveragePanel({ account, transactions = [], accountBalance, onClose }) {
  const st = useStyles();
  const t = useT();
  const [period, setPeriod] = useState("3m");
  const [from, setFrom] = useState(addDays(todayISO(), -89));
  const [to, setTo] = useState(todayISO());
  const [target, setTarget] = useState("");
  const [goalDays, setGoalDays] = useState("90");

  const range = useMemo(() => {
    if (period === "custom") return { from, to: from <= to ? to : from };
    const months = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
    const today = todayISO();
    return { from: addDays(jalaliMonthsAgoISO(today, months), 1), to: today };
  }, [period, from, to]);

  // بانک مهر ایران معدل را بر مبنای مانده پایان روز در بازه محاسبه می‌کند.
  // این تابع همان منطق را روی اطلاعات ثبت‌شده داخل اپ شبیه‌سازی می‌کند.
  const averageData = useMemo(() => {
    const start = range.from <= range.to ? range.from : range.to;
    const end = range.from <= range.to ? range.to : range.from;
    const rows = [];
    let d = start;
    while (d <= end) {
      rows.push({ date: d, balance: Number(balanceAtDate(account, transactions, d) || 0) });
      d = addDays(d, 1);
    }
    const total = rows.reduce((sum, r) => sum + r.balance, 0);
    const days = rows.length || 1;
    return {
      rows,
      days,
      total,
      average: total / days,
      startBalance: rows[0]?.balance || 0,
      endBalance: rows.length ? rows[rows.length - 1].balance : 0,
      min: rows.length ? Math.min(...rows.map(r => r.balance)) : 0,
      max: rows.length ? Math.max(...rows.map(r => r.balance)) : 0,
    };
  }, [account, transactions, range.from, range.to]);

  // مانده فعلی = مانده تا پایان امروز (تراکنش‌های با تاریخ آینده حساب نمی‌شوند)
  const currentBalance = useMemo(() => Number(balanceAtDate(account, transactions, todayISO()) || 0), [account, transactions]);

  const goal = useMemo(() => {
    const wanted = Number(normalizeDigitsText(String(target)).replace(/[,٬،]/g, ""));
    const days = Math.max(1, Number(goalDays || 90));
    if (!wanted || wanted <= 0) return null;

    // امروز را به عنوان یک روز واقعی با مانده فعلی در نظر می‌گیریم؛
    // از فردا تا پایان هدف، مانده ثابت موردنیاز را به‌صورت سناریوی پایه محاسبه می‌کنیم.
    const current = currentBalance;
    const today = todayISO();
    const futureDates = [];
    for (let i = 1; i < days; i++) futureDates.push(addDays(today, i));
    const weightedToday = current;
    const remainingWeight = wanted * days - weightedToday;
    const requiredFutureBalance = futureDates.length ? remainingWeight / futureDates.length : wanted;
    const extraNow = Math.max(0, requiredFutureBalance - current);
    const alreadyAbove = requiredFutureBalance <= current;
    const projectedAverageIfCurrentHeld = (current * days) / days;
    const feasibleWithoutDeposit = current >= wanted;
    return { wanted, days, current, requiredFutureBalance, extraNow, alreadyAbove, projectedAverageIfCurrentHeld, feasibleWithoutDeposit };
  }, [target, goalDays, currentBalance]);

  const money = (n) => `${toFaInt(Math.round(n || 0))} ریال`;
  const num = (n) => toFaInt(Math.round(n || 0));

  return (
    <div style={{ ...st.card, padding: 14, margin: "8px 0 14px", border: `1px solid ${BRAND.violet}33` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>معدل حساب · {account.name}</div>
          <div style={{ fontSize: 11.5, color: t.sub, marginTop: 3 }}>محاسبه بر اساس مانده پایان هر روز</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.sub, cursor: "pointer" }}><X size={18} /></button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {[['1m','۱ ماه'],['3m','۳ ماه'],['6m','۶ ماه'],['1y','۱۲ ماه'],['custom','دلخواه']].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ ...pillStyle(period === k), fontSize: 11.5 }}>{l}</button>
        ))}
      </div>
      {period === "custom" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div><label style={st.label}>از تاریخ</label><JalaliDateInput value={from} onChange={setFrom} style={st.input} /></div>
          <div><label style={st.label}>تا تاریخ</label><JalaliDateInput value={to} onChange={setTo} style={st.input} /></div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: `${BRAND.violet}12`, borderRadius: 12, padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: t.sub }}>معدل حساب</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: BRAND.violet, marginTop: 3 }}>{num(averageData.average)}</div>
        </div>
        <div style={{ background: `${BRAND.darkgreen}12`, borderRadius: 12, padding: 12, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: t.sub }}>مانده فعلی</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: BRAND.darkgreen, marginTop: 3 }}>{num(currentBalance)}</div>
        </div>
        <div style={{ padding: 10, border: `1px solid ${t.border}`, borderRadius: 10 }}><span style={{ fontSize: 11, color: t.sub }}>کمترین مانده</span><div style={{ fontWeight: 800 }}>{money(averageData.min)}</div></div>
        <div style={{ padding: 10, border: `1px solid ${t.border}`, borderRadius: 10 }}><span style={{ fontSize: 11, color: t.sub }}>بیشترین مانده</span><div style={{ fontWeight: 800 }}>{money(averageData.max)}</div></div>
      </div>

      <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.9, marginBottom: 14 }}>
        این عدد از جمع مانده پایان {toFaInt(averageData.days)} روز تقسیم بر تعداد روزهای بازه به‌دست آمده است. هر روزی که پول مدت بیشتری در حساب بماند، اثر بیشتری روی معدل دارد.
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 4 }}>🎯 رسیدن به معدل هدف</div>
        <div style={{ fontSize: 11.5, color: t.sub, marginBottom: 10 }}>هدف معدل و مدت موردنظر را وارد کن تا حداقل مانده پیشنهادی برای رسیدن به آن محاسبه شود.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 8 }}>
          <AmountInput value={target} onChange={setTarget} placeholder="معدل هدف (ریال)" style={st.input} />
          <select value={goalDays} onChange={e => setGoalDays(e.target.value)} style={st.input}>
            <option value="30">۳۰ روز</option><option value="60">۶۰ روز</option><option value="90">۹۰ روز</option><option value="180">۱۸۰ روز</option><option value="365">۳۶۵ روز</option>
          </select>
        </div>
        {goal && (
          <div style={{ marginTop: 10, background: goal.alreadyAbove ? `${BRAND.darkgreen}12` : `${BRAND.gold}18`, borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 900, color: goal.alreadyAbove ? BRAND.darkgreen : BRAND.header }}>
              {goal.alreadyAbove ? "با حفظ مانده فعلی، رسیدن به این معدل امکان‌پذیر است." : `برای رسیدن به معدل هدف، مانده روزانه را حدود ${money(goal.requiredFutureBalance)} نگه دار.`}
            </div>
            {!goal.alreadyAbove && goal.extraNow > 0 && <div style={{ fontSize: 12, lineHeight: 1.9, marginTop: 6 }}>در سناریوی ثابت، حدود <b>{money(goal.extraNow)}</b> افزایش نسبت به مانده فعلی لازم است؛ بعد از آن بهتر است مانده حساب زیر این سطح نیاید.</div>}
            {goal.alreadyAbove && <div style={{ fontSize: 12, lineHeight: 1.9, marginTop: 6 }}>اگر مانده فعلی تا پایان دوره حفظ شود، معدل هدف از نظر ریاضی پوشش داده می‌شود. برداشت‌های بزرگ می‌توانند این نتیجه را تغییر دهند.</div>}
            <div style={{ marginTop: 8, fontSize: 11, color: t.sub }}>محاسبه برنامه‌ریزی است و به تراکنش‌های آینده یا تصمیم نهایی بانک متصل نیست.</div>
          </div>
        )}
      </div>
    </div>
  );
}
