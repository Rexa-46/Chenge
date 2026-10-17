import { useState } from "react";
import { isPnlTransaction, pnlAmount } from "../../domain/financialEngine.js";
import {
  ArrowLeftRight, Bell, BellRing, Bitcoin, CalendarDays, ChevronLeft, ChevronRight, DollarSign,
  FileSpreadsheet, Grid3x3, Landmark, Landmark as Bank, LayoutGrid, LayoutList, Plus, Receipt, Repeat,
  Save, Tag, Target, TrendingDown, TrendingUp, Type, Users,
} from "lucide-react";

import { BankCardCarousel } from "../../components/cards/BankCardCarousel.jsx";
import { AddLink } from "../../components/common/AddLink.jsx";
import { CollapsibleSection } from "../../components/common/CollapsibleSection.jsx";
import { detailActionBtn, DetailBox } from "../../components/common/DetailBox.jsx";
import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { CurrencyRatesStrip } from "../../components/home/CurrencyRatesStrip.jsx";
import { DateQuickBox } from "../../components/home/DateQuickBox.jsx";
import { IncomeExpenseDayWidget } from "../../components/home/IncomeExpenseDayWidget.jsx";
import { normalizeHomeSections } from "../../domain/seeds.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { expiryFromStored } from "../../utils/cardFormat.js";
import { daysUntil, faLongDate } from "../../utils/dates.js";
import { faDigits, formatMoney, toFaInt } from "../../utils/format.js";
import { AddShortcutTile } from "../../components/shortcuts/AddShortcutTile.jsx";
import { ShortcutTile } from "../../components/shortcuts/ShortcutTile.jsx";
import { navArrowStyle } from "../../theme/styles.js";


export function HomeView({
  year, setYear, totalIncomeYear, totalExpenseYear, gaugeMax, open, toggle,
  accounts, accountBalance, expenseByCategory, incomeByCategory, budgets, categories,
  transactions, allTransactions, bills, loans, checks, assets, totalAssets, persons = [], debts = [],
  openAccounts, onEditAccount, openBudgets, openBills, openLoans, openChecks, openAssets, openPersons, openDebts, openSubView,
  homeDay, setHomeDay, catById, settings, setSettings, rates, fetchRates, onNote, onReminder, onAddTransaction, shortcuts = [], onRunShortcut, openShortcuts, onOpenTransactions,
  onOpenItem, onEditTransaction, onDeleteTransaction, onDeleteAccount, onUpdateAccount
}) {
  const t = useT();
  const [openItem, setOpenItem] = useState(null);   // فقط یک سطر همزمان باز است
  const [openTxId, setOpenTxId] = useState(null);   // فقط یک سند داخل سطر باز است
  const toggleItem = (k) => { setOpenTxId(null); setOpenItem((o) => (o === k ? null : k)); };
  const accNameOf = (id) => accounts.find((a) => a.id === id)?.name || "—";
  const banks = accounts.filter((a) => a.type === "bank");
  const funds = accounts.filter((a) => a.type === "fund");
  const cardAccs = accounts.filter((a) => a.type === "card");
  const net = totalIncomeYear - totalExpenseYear;
  const upcomingBills = bills.filter((b) => !b.paid && daysUntil(b.dueDate) <= 5).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcomingChecks = checks.filter((c) => c.status === "pending" && daysUntil(c.dueDate) <= (settings.checkReminderDays || 7)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const currency = settings.currency, usdRate = rates?.usd;
  const layout = settings.homeLayout || "cards";
  const sectionOrder = normalizeHomeSections(settings.homeSections).filter((s) => s.visible);

  const SECTION_META = {
    shortcut: { color: BRAND.mauve, title: "میانبر تراکنش ها", icon: <ArrowLeftRight size={20} /> },
    operations: { color: BRAND.header, title: "عملیات", icon: <Grid3x3 size={20} /> },
    expense: { color: BRAND.header, title: "هزینه ها", icon: <TrendingDown size={20} /> },
    income: { color: BRAND.darkgreen, title: "درآمدها", icon: <TrendingUp size={20} /> },
    banks: { color: BRAND.violet, title: "بانک ها و کارت ها", icon: <Landmark size={20} /> },
    funds: { color: BRAND.teal, title: "صندوق ها", icon: <Save size={20} /> },
    balrep: { color: BRAND.gold, title: "گزارش مانده حساب ها", icon: <FileSpreadsheet size={20} /> },
    budget: { color: BRAND.green, title: "بودجه بندی", icon: <Target size={20} /> },
    loanchk: { color: BRAND.orange, title: "وام ها و چک ها", icon: <Bank size={20} /> },
    contacts: { color: BRAND.violet, title: "اشخاص و بدهی ها", icon: <Users size={20} /> },
    bills: { color: BRAND.crimson, title: "یادآوری قبض ها", icon: <BellRing size={20} /> },
  };

  function txSourceOf(tx) {
    if (tx.loanId) return ["loans", tx.loanId, "وام"];
    if (tx.checkId) return ["checks", tx.checkId, "چک"];
    if (tx.billId) return ["bills", tx.billId, "قبض"];
    if (tx.sourceType === "debt" && tx.sourceId) return ["debts", tx.sourceId, "بدهی/طلب"];
    return null;
  }
  function categoryDocs(kind, color) {
    const list = kind === "expense" ? expenseByCategory : incomeByCategory;
    if (list.length === 0) return <EmptyRow text={kind === "expense" ? "هزینه‌ای ثبت نشده" : "درآمدی ثبت نشده"} />;
    return list.map((e) => {
      const k = `${kind}:${e.catId}`;
      const isOpen = openItem === k;
      const txs = isOpen
        ? transactions.filter((x) => x.type === kind && isPnlTransaction(x) && String(x.categoryId) === String(e.catId))
            .sort((a, b) => `${b.date}${b.time || ""}`.localeCompare(`${a.date}${a.time || ""}`))
        : [];
      return (
        <div key={e.catId}>
          <Row title={e.name} subtitle={isOpen ? `${toFaInt(txs.length)} سند` : "لمس برای مشاهده سندها"} value={formatMoney(e.amount, currency, usdRate)} valueColor={color}
            onClick={() => toggleItem(k)} chevron={isOpen ? "right" : "left"} />
          {isOpen && (
            <div style={{ margin: "0 0 8px", paddingRight: 8 }}>
              {txs.length === 0 && <EmptyRow text="سندی یافت نشد" />}
              {txs.map((x) => {
                const txOpen = openTxId === x.id;
                const src = txSourceOf(x);
                const pnl = pnlAmount(x);
                const lines = [
                  ["مبلغ", formatMoney(x.amount, currency, usdRate)],
                  ...(Number(pnl) !== Number(x.amount) ? [[kind === "expense" ? "سهم در هزینه" : "سهم در درآمد", formatMoney(pnl, currency, usdRate)]] : []),
                  ["تاریخ", `${x.date ? faLongDate(new Date(x.date)) : "—"}${x.time ? ` · ${faDigits(x.time)}` : ""}`],
                  ["دسته", e.name],
                  ["حساب", accNameOf(x.accountId)],
                  ["توضیحات", x.note || "—"],
                ];
                return (
                  <div key={x.id}>
                    <Row title={x.note || e.name} subtitle={x.date ? faLongDate(new Date(x.date)) : undefined} value={formatMoney(pnl, currency, usdRate)} valueColor={color}
                      onClick={() => setOpenTxId((o) => (o === x.id ? null : x.id))} chevron={txOpen ? "right" : "left"} />
                    {txOpen && (
                      <DetailBox lines={lines}>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          {src ? (
                            <button onClick={() => onOpenItem?.(src[0], src[1])} style={detailActionBtn(BRAND.violet, true)}>مدیریت از بخش {src[2]}</button>
                          ) : (<>
                            <button onClick={() => onEditTransaction?.(x)} style={detailActionBtn(BRAND.violet, true)}>ویرایش</button>
                            <button onClick={() => { if (window.confirm("این تراکنش حذف شود؟")) { onDeleteTransaction?.(x.id); setOpenTxId(null); } }} style={detailActionBtn(BRAND.crimson, false)}>حذف</button>
                          </>)}
                        </div>
                        {src && <div style={{ fontSize: 11, color: t.sub, marginTop: 8, lineHeight: 1.8 }}>این سند از بخش {src[2]} ساخته شده و برای حفظ صحت حساب‌ها فقط از همان بخش قابل اصلاح است.</div>}
                      </DetailBox>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  }
  function accountDoc(a) {
    const k = `acc:${a.id}`;
    const isOpen = openItem === k;
    const bal = accountBalance(a.id);
    const typeLabel = a.type === "card" ? "کارت" : a.type === "bank" ? "بانک" : "صندوق";
    const lines = [
      ["نوع", typeLabel],
      ["موجودی فعلی", formatMoney(bal, currency, usdRate)],
      ["موجودی اولیه", formatMoney(a.initial || 0, currency, usdRate)],
      ...(a.cardNumber ? [["شماره کارت", <span key="card" dir="ltr">{String(a.cardNumber).replace(/(\d{4})(?=\d)/g, "$1 ")}</span>]] : a.cardNumberLast4 ? [["شماره کارت", <span key="card4" dir="ltr">•••• {a.cardNumberLast4}</span>]] : []),
      ...(a.expiryDate ? [["تاریخ انقضا", <span key="exp" dir="ltr">{expiryFromStored(a.expiryDate)}</span>]] : []),
      ["وضعیت", a.active === false ? "بایگانی‌شده" : "فعال"],
    ];
    return (
      <div key={a.id}>
        <Row title={a.name} subtitle={isOpen ? typeLabel : `${typeLabel} · لمس برای جزئیات`} value={formatMoney(bal, currency, usdRate)} valueColor={bal >= 0 ? t.text : BRAND.crimson}
          onClick={() => toggleItem(k)} chevron={isOpen ? "right" : "left"} />
        {isOpen && (
          <DetailBox lines={lines}>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => onEditAccount?.(a)} style={detailActionBtn(BRAND.violet, true)}>ویرایش</button>
              {a.active === false
                ? <button onClick={() => onUpdateAccount?.(a.id, { active: true, archivedAt: undefined })} style={detailActionBtn(BRAND.darkgreen, false)}>بازگردانی از بایگانی</button>
                : <button onClick={() => { if (window.confirm(`«${a.name}» حذف شود؟ اگر سابقه مالی داشته باشد به‌جای حذف، بایگانی می‌شود.`)) { onDeleteAccount?.(a.id); setOpenItem(null); } }} style={detailActionBtn(BRAND.crimson, false)}>حذف / بایگانی</button>}
            </div>
          </DetailBox>
        )}
      </div>
    );
  }

  function sectionBody(key) {
    switch (key) {
      case "shortcut":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "18px 12px", padding: "16px 4px 14px" }}>
            {shortcuts.map((sc) => <ShortcutTile key={sc.id} sc={sc} onClick={() => onRunShortcut?.(sc)} />)}
            <AddShortcutTile onClick={openShortcuts || (() => {})} />
          </div>
        );
      case "operations": {
        const groups = [
          { title: "حسابداری و مدیریت", items: [
            { key: "coa", title: "حساب‌ها", icon: <Grid3x3 size={17} />, color: BRAND.header },
            { key: "goals", title: "اهداف مالی و پس‌انداز", icon: <Target size={17} />, color: BRAND.green },
            { key: "accounts", title: "حساب‌ها و کارت‌ها", icon: <Landmark size={17} />, color: BRAND.violet },
            { key: "categories", title: "دسته‌بندی‌ها و برچسب‌ها", icon: <Tag size={17} />, color: BRAND.mauve },
            { key: "budgets", title: "بودجه‌بندی", icon: <Save size={17} />, color: BRAND.green },
            { key: "recurring", title: "تراکنش‌های تکرارشونده", icon: <Repeat size={17} />, color: BRAND.teal },
            { key: "checks", title: "چک‌ها", icon: <FileSpreadsheet size={17} />, color: BRAND.gold },
            { key: "loans", title: "وام و اقساط", icon: <Bank size={17} />, color: BRAND.crimson },
            { key: "assets", title: "دارایی‌ها", icon: <Bitcoin size={17} />, color: "#7a5cff" },
            { key: "currencies", title: "واحدهای پولی", icon: <DollarSign size={17} />, color: BRAND.gold },
            { key: "bills", title: "یادآوری قبض‌ها", icon: <BellRing size={17} />, color: BRAND.orange },
            { key: "tags", title: "اعضای منزل، رویداد و پروژه", icon: <Users size={17} />, color: BRAND.violet },
            { key: "periods", title: "دوره مالی", icon: <CalendarDays size={17} />, color: BRAND.darkgreen },
            { key: "calendar", title: "تقویم شمسی", icon: <CalendarDays size={17} />, color: BRAND.header },
          ] },
          { title: "ابزارها", items: [
            { key: "slip", title: "اسکن برگه پوز (دوربین)", icon: <Receipt size={17} />, color: BRAND.fab },
            { key: "shortcuts", title: "میانبرهای تراکنش", icon: <ArrowLeftRight size={17} />, color: BRAND.mauve },
            { key: "sms", title: "پیامک بانکی", icon: <BellRing size={17} />, color: "#666" },
            { key: "calculator", title: "ماشین حساب", icon: <Type size={17} />, color: BRAND.teal },
            { key: "support", title: "پشتیبانی و تیکت", icon: <Bell size={17} />, color: BRAND.header },
          ] },
        ];
        return (<>
          {groups.map((g) => (
            <div key={g.title}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: BRAND.violet, padding: "10px 4px 2px" }}>{g.title}</div>
              {g.items.map((it) => <Row key={it.key} title={it.title} leftIcon={it.icon} leftColor={it.color} onClick={() => openSubView?.(it.key)} />)}
            </div>
          ))}
        </>);
      }
      case "expense":
        return categoryDocs("expense", BRAND.crimson);
      case "income":
        return categoryDocs("income", BRAND.darkgreen);
      case "banks":
        return (<>
          {[...banks, ...cardAccs].length === 0 && <EmptyRow text="حسابی ثبت نشده" />}
          {[...banks, ...cardAccs].map((a) => accountDoc(a))}
          <AddLink text="+ مدیریت حساب‌ها و کارت‌ها" onClick={openAccounts} />
        </>);
      case "funds":
        return funds.length === 0 ? <EmptyRow text="صندوقی ثبت نشده" /> : funds.map((a) => accountDoc(a));
      case "balrep":
        return accounts.map((a) => (
          <Row key={a.id} title={a.name} subtitle={a.type === "bank" ? "بانک" : a.type === "card" ? "کارت" : "صندوق"}
            value={formatMoney(accountBalance(a.id), currency, usdRate)} valueColor={accountBalance(a.id) >= 0 ? BRAND.darkgreen : BRAND.crimson} />
        ));
      case "budget":
        return (<>
          {budgets.length === 0 && <EmptyRow text="بودجه‌ای تعریف نشده" />}
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = expenseByCategory.find((e) => e.catId === b.categoryId)?.amount || 0;
            const pct = Math.min(100, Math.round((spent / (b.amount || 1)) * 100));
            return (
              <div key={b.id} style={{ padding: "10px 4px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>
                  <span>{cat?.name || "—"}</span>
                  <span style={{ color: pct >= 100 ? BRAND.crimson : t.sub }}>{toFaInt(pct)}٪ — {toFaInt(spent)}/{toFaInt(b.amount)}</span>
                </div>
                <div style={{ height: 7, background: t.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? BRAND.crimson : BRAND.green }} />
                </div>
              </div>
            );
          })}
          <AddLink text="+ مدیریت بودجه‌بندی" onClick={openBudgets} />
        </>);
      case "loanchk":
        return (<>
          {loans.length === 0 && checks.length === 0 && <EmptyRow text="موردی ثبت نشده" />}
          {loans.map((l) => (
            <Row key={l.id} title={l.title} subtitle="وام" value={`${toFaInt(l.principal - (l.paidCount || 0) * l.monthlyPayment)} ریال باقی‌مانده`} valueColor={BRAND.crimson} onClick={() => onOpenItem?.("loans", l.id)} />
          ))}
          {checks.filter((c) => c.status === "pending").map((c) => (
            <Row key={c.id} title={`${c.payee} (${c.type === "received" ? "دریافتی" : "پرداختی"})`} subtitle={faLongDate(new Date(c.dueDate))} value={formatMoney(c.amount, currency, usdRate)} onClick={() => onOpenItem?.("checks", c.id)} />
          ))}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 4 }}>
            <AddLink text="+ وام‌ها" onClick={openLoans} />
            <AddLink text="+ چک‌ها" onClick={openChecks} />
            <AddLink text="+ دارایی‌ها" onClick={openAssets} />
          </div>
        </>);
      case "contacts":
        return (<><Row title="اشخاص و طرف حساب‌ها" subtitle={`${toFaInt(persons.length)} نفر`} value="مدیریت" valueColor={BRAND.violet} onClick={openPersons} />
          <Row title="بدهی و طلب" subtitle="مدیریت طرف حساب‌ها" value="مدیریت" valueColor={BRAND.orange} onClick={openDebts} />{debts.filter((d) => !d.settled).map((d) => <Row key={d.id} title={persons.find((p) => p.id === d.personId)?.name || "طرف حساب حذف‌شده"} subtitle={d.kind === "receivable" ? "طلب" : "بدهی"} value={`${toFaInt(d.amount)} ریال`} valueColor={d.kind === "receivable" ? BRAND.darkgreen : BRAND.crimson} onClick={() => onOpenItem?.("debts", d.id)} />)}<Row title="طلب‌های باز" value={`${toFaInt(debts.filter((d) => !d.settled && d.kind === "receivable").reduce((s, d) => s + Number(d.amount || 0), 0))} ریال`} valueColor={BRAND.darkgreen} /><Row title="بدهی‌های باز" value={`${toFaInt(debts.filter((d) => !d.settled && d.kind === "payable").reduce((s, d) => s + Number(d.amount || 0), 0))} ریال`} valueColor={BRAND.crimson} /></>);
      case "bills":
        return (<>
          {bills.length === 0 && <EmptyRow text="قبضی ثبت نشده" />}
          {bills.map((b) => (
            <Row key={b.id} title={b.title} subtitle={faLongDate(new Date(b.dueDate))}
              value={b.paid ? "پرداخت شده" : `${toFaInt(daysUntil(b.dueDate))} روز`}
              valueColor={b.paid ? BRAND.darkgreen : daysUntil(b.dueDate) < 0 ? BRAND.crimson : BRAND.orange} onClick={() => onOpenItem?.("bills", b.id)} />
          ))}
          <AddLink text="+ مدیریت قبض‌ها" onClick={openBills} />
        </>);
      default: return null;
    }
  }

  function sectionAddHandler(key) {
    switch (key) {
      case "shortcut": return undefined;
      case "expense": return () => onAddTransaction("expense");
      case "income": return () => onAddTransaction("income");
      case "banks": return openAccounts;
      case "funds": return openAccounts;
      case "budget": return openBudgets;
      case "contacts": return openPersons;
      case "bills": return openBills;
      default: return undefined;
    }
  }

  return (
    <div style={{ padding: "18px 16px 8px" }}>
      <BankCardCarousel accounts={accounts} accountBalance={accountBalance} currency={currency} usdRate={usdRate} onAddCard={openAccounts} onEditAccount={onEditAccount} />
      <DateQuickBox onNote={onNote} onReminder={onReminder} />
      <IncomeExpenseDayWidget day={homeDay} setDay={setHomeDay} transactions={allTransactions} catById={catById} currency={currency} usdRate={usdRate} bills={bills} checks={checks} onOpenTransactions={onOpenTransactions} />
      <CurrencyRatesStrip rates={rates} fetchRates={fetchRates} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "18px 0" }}>
        <button onClick={() => setYear((y) => y - 1)} style={navArrowStyle(t)}><ChevronLeft size={16} /></button>
        <div style={{ background: t.card, borderRadius: 20, padding: "6px 18px", fontWeight: 700, color: BRAND.header, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>سال {faDigits(year)}</div>
        <button onClick={() => setYear((y) => y + 1)} style={navArrowStyle(t)}><ChevronRight size={16} /></button>
        <button onClick={() => setSettings((s) => ({ ...s, homeLayout: layout === "cards" ? "icons" : "cards" }))}
          style={{ ...navArrowStyle(t), width: "auto", padding: "0 10px", borderRadius: 16, display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
          {layout === "cards" ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 12, fontSize: 13, color: net >= 0 ? BRAND.darkgreen : BRAND.crimson, fontWeight: 700 }}>
        مانده سالانه: {toFaInt(Math.abs(net))} ریال {net >= 0 ? "مثبت" : "منفی"}
      </div>
      {totalAssets > 0 && (
        <div style={{ textAlign: "center", marginBottom: 18, fontSize: 12.5, color: BRAND.orange, fontWeight: 700 }}>
          ارزش دارایی‌های دیجیتال/بورس: {toFaInt(totalAssets)} ریال
        </div>
      )}

      {(upcomingBills.length > 0 || upcomingChecks.length > 0) && (
        <div style={{ background: "#fff6ea", border: "1px solid #f0d9a8", borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: BRAND.orange, fontWeight: 700, fontSize: 13 }}><BellRing size={16} /> یادآوری‌های نزدیک</div>
          {upcomingBills.map((b) => (
            <div key={b.id} style={{ fontSize: 12.5, color: "#6b4c14" }}>قبض {b.title} — {daysUntil(b.dueDate) < 0 ? "سررسید گذشته" : `${toFaInt(daysUntil(b.dueDate))} روز مانده`}</div>
          ))}
          {upcomingChecks.map((c) => (
            <div key={c.id} style={{ fontSize: 12.5, color: "#6b4c14" }}>چک {c.type === "received" ? "دریافتی" : "پرداختی"} {c.payee} — {daysUntil(c.dueDate) < 0 ? "سررسید گذشته" : `${toFaInt(daysUntil(c.dueDate))} روز مانده`}</div>
          ))}
        </div>
      )}

      {layout === "cards" ? (
        sectionOrder.map(({ key }) => {
          const m = SECTION_META[key];
          if (!m) return null;
          return (
            <CollapsibleSection key={key} color={m.color} title={m.title} open={!!open[key]} onToggle={() => toggle(key)} onAdd={sectionAddHandler(key)} radius={key === "shortcut" ? 20 : 14}>
              {sectionBody(key)}
            </CollapsibleSection>
          );
        })
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {sectionOrder.map(({ key }) => {
            const m = SECTION_META[key];
            if (!m) return null;
            return (
              <button key={key} onClick={() => toggle(key)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: t.card, border: "none",
                borderRadius: 14, padding: "16px 6px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: m.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{m.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.text, textAlign: "center" }}>{m.title}</span>
              </button>
            );
          })}
        </div>
      )}
      {layout === "icons" && sectionOrder.map(({ key }) => {
        const m = SECTION_META[key];
        if (!m || !open[key]) return null;
        return (
          <div key={key} style={{ background: t.card, borderRadius: 14, padding: "10px 14px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontWeight: 700, color: m.color, fontSize: 13.5 }}>{m.title}</div>
              {sectionAddHandler(key) && (
                <button onClick={sectionAddHandler(key)} style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Plus size={14} />
                </button>
              )}
            </div>
            {sectionBody(key)}
          </div>
        );
      })}
    </div>
  );
}
