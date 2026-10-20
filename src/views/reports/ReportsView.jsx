import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ExpenseDistribution } from "../../components/charts/ExpenseDistribution.jsx";
import { ExplodingPie } from "../../components/charts/ExplodingPie.jsx";
import { GaugeSpeedometer } from "../../components/charts/GaugeSpeedometer.jsx";
import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { accTypeFa } from "../../domain/reportMath.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { addDays, faLongDate, jalaliMonthRange, jalaliYear, jf, parseISO, todayISO } from "../../utils/dates.js";
import { formatMoney, toFaInt } from "../../utils/format.js";
import { BalanceSheetReport } from "./BalanceSheetReport.jsx";
import { BalancesReport } from "./BalancesReport.jsx";
import { ExportBar } from "./ExportBar.jsx";
import { IncomeExpenseReport } from "./IncomeExpenseReport.jsx";
import { REPORT_TILES, ReportTiles } from "./ReportTiles.jsx";
import { StatementReport } from "./StatementReport.jsx";
import { SummaryReport } from "./SummaryReport.jsx";

export function ReportsView({ members = [], events = [], projects = [], loans = [], assets = [], bills = [], categories = [], expenseByCategory, incomeByCategory, totalIncomeYear, totalExpenseYear, accounts, accountBalance, updateAccount, netWorthTrend, exportExcel, expenseByMember, expenseByEvent, expenseByProject, checks = [], debts = [], totalAssets = 0, currency, usdRate, transactions = [] }) {
  const st = useStyles();
  const [sub, setSub] = useState(null);
  const [period, setPeriod] = useState("year");
  const [selectedAccount, setSelectedAccount] = useState(null); const [selectedMember, setSelectedMember] = useState(null); const [editBalance, setEditBalance] = useState("");
  const periodTx = useMemo(() => {
    const today = todayISO();
    if (period === "day") return transactions.filter((x) => String(x.date).slice(0, 10) === today);
    if (period === "month") { const { start, end } = jalaliMonthRange(today); return transactions.filter((x) => { const d = String(x.date).slice(0, 10); return d >= start && d <= end; }); }   // ماه شمسی
    if (period === "week") { const st = addDays(today, -6); return transactions.filter((x) => { const d = String(x.date).slice(0, 10); return d >= st && d <= today; }); }
    return transactions.filter((x) => jalaliYear(parseISO(x.date)) === jalaliYear(parseISO(today)));
  }, [transactions, period]);
  const reportIncome = periodTx.filter((x) => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const reportExpense = periodTx.filter((x) => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const incomeExpensePie = [{ name: "درآمد", amount: reportIncome }, { name: "هزینه", amount: reportExpense }].filter((d) => d.amount > 0);
  const profit = reportIncome - reportExpense;
  const reportExpenseByCategory = useMemo(() => {
    const map = {};
    periodTx.filter((x) => x.type === "expense").forEach((x) => { map[x.categoryId] = (map[x.categoryId] || 0) + x.amount; });
    return Object.entries(map).map(([catId, amount]) => ({ name: categories.find((c) => c.id === catId)?.name || "بدون دسته", amount, catId })).sort((a,b) => b.amount-a.amount);
  }, [periodTx, categories]);
  const accountDetails = useMemo(() => {
    if (!selectedAccount) return { income: 0, expense: 0, transfersIn: 0, transfersOut: 0, txs: [] };
    const txs = periodTx.filter((x) => x.accountId === selectedAccount.id || x.toAccountId === selectedAccount.id);
    return {
      income: txs.filter((x) => x.type === "income" && x.accountId === selectedAccount.id).reduce((s,x)=>s+x.amount,0),
      expense: txs.filter((x) => x.type === "expense" && x.accountId === selectedAccount.id).reduce((s,x)=>s+x.amount,0),
      transfersIn: txs.filter((x) => x.type === "transfer" && x.toAccountId === selectedAccount.id).reduce((s,x)=>s+x.amount,0),
      transfersOut: txs.filter((x) => x.type === "transfer" && x.accountId === selectedAccount.id).reduce((s,x)=>s+x.amount,0),
      txs
    };
  }, [periodTx, selectedAccount]);
  const memberDetails = useMemo(() => {
    if (!selectedMember) return [];
    return periodTx.filter((x) => x.type === "expense" && x.memberId === selectedMember.id);
  }, [periodTx, selectedMember]);

  const checkStats = useMemo(() => {
    const pending = checks.filter((c) => c.status === "pending").length;
    const cashed = checks.filter((c) => c.status === "cashed").length;
    const bounced = checks.filter((c) => c.status === "bounced").length;
    const resolved = cashed + bounced;
    const pct = resolved > 0 ? (cashed / resolved) * 100 : 0;
    return { pending, cashed, bounced, pct };
  }, [checks]);

  const periodLabel = { day: "روزانه", week: "هفتگی", month: "ماهیانه", year: "سالیانه" }[period];
  const overviewDoc = {
    title: `گزارش مالی ${periodLabel}`, subtitle: faLongDate(new Date()),
    sections: [
      { title: "تراز کلی مالی", rows: [
        ["موجودی حساب‌ها", accounts.reduce((s2, a) => s2 + accountBalance(a.id), 0)], ["دارایی‌ها", totalAssets],
        ["طلب‌ها", debts.filter((d) => !d.settled && d.kind === "receivable").reduce((s2, d) => s2 + Number(d.amount || 0), 0)],
        ["بدهی‌ها", debts.filter((d) => !d.settled && d.kind === "payable").reduce((s2, d) => s2 + Number(d.amount || 0), 0)],
        ["درآمد این دوره", reportIncome], ["هزینه این دوره", -reportExpense], ["سود / زیان خالص", profit]] },
      { title: "هزینه به تفکیک دسته", head: ["دسته", "مبلغ"], rows: reportExpenseByCategory.map((x) => [x.name, x.amount]) },
      { title: "موجودی حساب‌ها", head: ["حساب", "نوع", "موجودی"], rows: accounts.map((a) => [a.name, accTypeFa(a.type), accountBalance(a.id)]) },
      { title: "تراکنش‌های این دوره", head: ["تاریخ", "نوع", "مبلغ", "دسته", "حساب", "یادداشت"], rows: [...periodTx].sort((x, y) => y.date.localeCompare(x.date)).map((x) => [jf(x.date), x.type === "income" ? "دریافت" : x.type === "expense" ? "پرداخت" : "انتقال", x.amount, categories.find((c) => c.id === x.categoryId)?.name || "", accounts.find((a) => a.id === x.accountId)?.name || "", x.note || ""]) },
    ],
  };
  if (sub) {
    const tile = REPORT_TILES.find((x) => x.key === sub);
    const common = { accounts, transactions, categories };
    return (
      <div style={{ padding: "16px" }}>
        <button onClick={() => setSub(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 800, color: "inherit", padding: 0, marginBottom: 14 }}>
          <ChevronRight size={22} /> {tile?.title}
        </button>
        {sub === "summary" && <SummaryReport {...common} />}
        {sub === "incexp" && <IncomeExpenseReport {...common} />}
        {sub === "balances" && <BalancesReport {...common} />}
        {sub === "statement" && <StatementReport {...common} members={members} projects={projects} events={events} />}
        {sub === "balsheet" && <BalanceSheetReport {...common} assets={assets} debts={debts} loans={loans} checks={checks} bills={bills} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <ExportBar doc={overviewDoc} />
      <ReportTiles onOpen={setSub} />

      <div className="no-print" style={{ display: "flex", gap: 6, marginBottom: 18, background: "#f1eef4", borderRadius: 10, padding: 4 }}>
        {[{ k: "day", l: "روزانه" }, { k: "week", l: "هفتگی" }, { k: "month", l: "ماهیانه" }, { k: "year", l: "سالیانه" }].map((p) => (
          <button key={p.k} onClick={() => setPeriod(p.k)} style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: "none", cursor: "pointer", background: period === p.k ? BRAND.header : "transparent", color: period === p.k ? "#fff" : "#3E1461", fontWeight: 700, fontSize: 12 }}>{p.l}</button>
        ))}
      </div>
      {period !== "year" && (
        <div style={{ fontSize: 11.5, color: "#8a8194", marginBottom: 14, textAlign: "center" }}>
          تمام ارقام و جزئیات این گزارش بر اساس بازه انتخاب‌شده محاسبه شده‌اند.
        </div>
      )}

      <SectionTitle text="تراز کلی مالی" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["موجودی حساب‌ها", accounts.reduce((s,a)=>s+accountBalance(a.id),0), BRAND.violet],
            ["بانک و کارت", accounts.filter(a=>a.type === "bank" || a.type === "card").reduce((s,a)=>s+accountBalance(a.id),0), BRAND.violet],
            ["صندوق‌ها", accounts.filter(a=>a.type === "fund").reduce((s,a)=>s+accountBalance(a.id),0), BRAND.gold],
            ["دارایی‌ها", totalAssets, BRAND.teal],
            ["طلب‌ها", debts.filter(d=>!d.settled && d.kind === "receivable").reduce((s,d)=>s+Number(d.amount||0),0), BRAND.darkgreen],
            ["بدهی‌ها", debts.filter(d=>!d.settled && d.kind === "payable").reduce((s,d)=>s+Number(d.amount||0),0), BRAND.crimson],
            ["درآمد این دوره", reportIncome, BRAND.darkgreen],
            ["هزینه این دوره", reportExpense, BRAND.crimson],
          ].map(([label,val,color]) => <div key={label} style={{ padding: 10, borderRadius: 12, background: "#f8f6fa" }}>
            <div style={{ fontSize: 11.5, color: "#8a8194" }}>{label}</div><div style={{ fontSize: 14, fontWeight: 800, color, marginTop: 4 }}>{formatMoney(val,currency,usdRate)}</div>
          </div>)}
        </div>
      </div>

      <SectionTitle text="سود و زیان سالانه" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <Row title="مجموع درآمد" value={formatMoney(reportIncome, currency, usdRate)} valueColor={BRAND.darkgreen} chevron={null} />
        <Row title="مجموع هزینه" value={formatMoney(reportExpense, currency, usdRate)} valueColor={BRAND.crimson} chevron={null} />
        <Row title="سود / زیان خالص" value={formatMoney(profit, currency, usdRate)} valueColor={profit >= 0 ? BRAND.darkgreen : BRAND.crimson} chevron={null} />
      </div>

      <SectionTitle text="روند دارایی خالص (۸ ماه اخیر)" />
      <div style={{ ...st.card, padding: 12, marginBottom: 18 }}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={netWorthTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontFamily: FONT, fontSize: 11 }} />
            <YAxis tick={{ fontFamily: FONT, fontSize: 10 }} width={44} />
            <Tooltip formatter={(v) => toFaInt(v)} contentStyle={{ fontFamily: FONT, direction: "rtl" }} />
            <Line type="monotone" dataKey="مانده" stroke={BRAND.violet} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle text="درآمد و هزینه" />
      <div style={{ ...st.card, padding: 12, marginBottom: 18 }}>
        <ExplodingPie data={incomeExpensePie} currency={currency} usdRate={usdRate} />
      </div>

      <SectionTitle text="توزیع هزینه‌ها بر اساس دسته" />
      <div style={{ marginBottom: 18 }}>
        <ExpenseDistribution data={reportExpenseByCategory} transactions={transactions} currency={currency} usdRate={usdRate} />
      </div>

      <SectionTitle text="گزارش چک‌ها" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.gold }}>{toFaInt(checkStats.pending)}</div>
            <div style={{ fontSize: 11.5, color: "#8a8194" }}>در جریان وصول</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.darkgreen }}>{toFaInt(checkStats.cashed)}</div>
            <div style={{ fontSize: 11.5, color: "#8a8194" }}>وصول شده</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.crimson }}>{toFaInt(checkStats.bounced)}</div>
            <div style={{ fontSize: 11.5, color: "#8a8194" }}>برگشت خورده</div>
          </div>
        </div>
        {(checkStats.cashed + checkStats.bounced) > 0 && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GaugeSpeedometer pct={checkStats.pct} label="نسبت چک‌های وصول‌شده به کل تسویه‌شده‌ها" />
          </div>
        )}
        {checks.length === 0 && <EmptyRow text="چکی ثبت نشده" />}
      </div>

      <SectionTitle text="گزارش مانده حساب‌ها" />
      <div style={{ ...st.card, padding: "4px 12px", marginBottom: expenseByMember?.length || expenseByEvent?.length || expenseByProject?.length ? 18 : 0 }}>
        {accounts.map((a) => <Row key={a.id} title={a.name} subtitle={`${a.type === "bank" ? "بانک" : a.type === "card" ? "کارت" : "صندوق"} · لمس برای جزئیات`} value={formatMoney(accountBalance(a.id), currency, usdRate)} valueColor={accountBalance(a.id) >= 0 ? BRAND.darkgreen : BRAND.crimson} onClick={() => { setSelectedAccount(a); setEditBalance(String(accountBalance(a.id))); }} />)}
      </div>

      {expenseByMember?.length > 0 && (
        <>
          <SectionTitle text="گزارش هزینه به‌تفکیک اعضای خانواده" />
          <div style={{ ...st.card, padding: "4px 12px", marginBottom: 18 }}>
            {expenseByMember.map((m) => <Row key={m.id} title={m.name} subtitle="لمس برای مشاهده ریز هزینه‌ها" value={formatMoney(m.amount, currency, usdRate)} valueColor={BRAND.crimson} onClick={() => setSelectedMember(m)} />)}
          </div>
        </>
      )}
      {expenseByEvent?.length > 0 && (
        <>
          <SectionTitle text="گزارش هزینه به‌تفکیک رویداد" />
          <div style={{ ...st.card, padding: "4px 12px", marginBottom: 18 }}>
            {expenseByEvent.map((m) => <Row key={m.id} title={m.name} value={formatMoney(m.amount, currency, usdRate)} valueColor={BRAND.crimson} chevron={null} />)}
          </div>
        </>
      )}
      {expenseByProject?.length > 0 && (
        <>
          <SectionTitle text="گزارش هزینه به‌تفکیک پروژه" />
          <div style={{ ...st.card, padding: "4px 12px" }}>
            {expenseByProject.map((m) => <Row key={m.id} title={m.name} value={formatMoney(m.amount, currency, usdRate)} valueColor={BRAND.crimson} chevron={null} />)}
          </div>
        </>
      )}
      {selectedAccount && <div onClick={() => setSelectedAccount(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 310, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px,100vw)", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: "18px 18px 0 0", padding: 18, paddingBottom: "calc(24px + env(safe-area-inset-bottom,0px))" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>تراز {selectedAccount.name}</div>
          <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 12 }}>مانده فعلی: {formatMoney(accountBalance(selectedAccount.id), currency, usdRate)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#eef9f0", borderRadius: 10, padding: 10 }}><div style={{fontSize:11,color:"#6b756d"}}>دریافت</div><b style={{color:BRAND.darkgreen}}>{formatMoney(accountDetails.income,currency,usdRate)}</b></div>
            <div style={{ background: "#fff0f3", borderRadius: 10, padding: 10 }}><div style={{fontSize:11,color:"#756b6e"}}>هزینه</div><b style={{color:BRAND.crimson}}>{formatMoney(accountDetails.expense,currency,usdRate)}</b></div>
            <div style={{ background: "#f2eff8", borderRadius: 10, padding: 10 }}><div style={{fontSize:11,color:"#6f6876"}}>انتقال ورودی</div><b>{formatMoney(accountDetails.transfersIn,currency,usdRate)}</b></div>
            <div style={{ background: "#f2eff8", borderRadius: 10, padding: 10 }}><div style={{fontSize:11,color:"#6f6876"}}>انتقال خروجی</div><b>{formatMoney(accountDetails.transfersOut,currency,usdRate)}</b></div>
          </div>
          <SectionTitle text={`ریز تراکنش‌های ${selectedAccount.name}`} />
          <div style={{ ...st.card, padding: "4px 10px", marginBottom: 14 }}>
            {accountDetails.txs.length === 0 ? <EmptyRow text="در این دوره تراکنشی ثبت نشده" /> : accountDetails.txs.slice(0,30).map(tx => <Row key={tx.id} title={categories.find(c=>c.id===tx.categoryId)?.name || (tx.type === "transfer" ? "انتقال" : "بدون دسته")} subtitle={`${tx.date || ""} · ${tx.note || ""}`} value={`${tx.type === "expense" ? "−" : "+"}${toFaInt(tx.amount)} ریال`} valueColor={tx.type === "expense" ? BRAND.crimson : BRAND.darkgreen} chevron={null} />)}
          </div>
          <label style={st.label}>اصلاح مانده حساب</label>
          <AmountInput value={editBalance} onChange={setEditBalance} placeholder="مانده جدید" style={st.input} />
          <button onClick={() => { const target = Number(editBalance || 0); updateAccount?.(selectedAccount.id, { initial: (selectedAccount.initial || 0) + target - accountBalance(selectedAccount.id) }); setSelectedAccount(null); }} style={st.primaryBtn}>ذخیره اصلاح مانده</button>
          <button onClick={() => setSelectedAccount(null)} style={{ ...st.primaryBtn, background: "#eee", color: "#333", marginTop: 8 }}>بستن</button>
        </div>
      </div>}
      {selectedMember && <div onClick={() => setSelectedMember(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 310, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e)=>e.stopPropagation()} style={{ width:"min(480px,100vw)", maxHeight:"82vh", overflowY:"auto", background:"#fff", borderRadius:"18px 18px 0 0", padding:18 }}>
          <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>ریز هزینه‌های {selectedMember.name}</div>
          <div style={{fontSize:12,color:"#8a8194",marginBottom:12}}>جمع: {formatMoney(selectedMember.amount,currency,usdRate)}</div>
          <div style={{ ...st.card, padding:"4px 10px" }}>
            {memberDetails.map(tx => <Row key={tx.id} title={categories.find(c=>c.id===tx.categoryId)?.name || "بدون دسته"} subtitle={`${tx.date || ""} · ${tx.note || ""}`} value={formatMoney(tx.amount,currency,usdRate)} valueColor={BRAND.crimson} chevron={null} />)}
          </div>
          <button onClick={()=>setSelectedMember(null)} style={{...st.primaryBtn,background:"#eee",color:"#333",marginTop:10}}>بستن</button>
        </div>
      </div>}
    </div>
  );
}
