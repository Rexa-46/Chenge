import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exportDocXlsx } from "./services/exportDoc.js";
import { isPnlTransaction, pnlAmount } from "./domain/financialEngine.js";
import { rebuildLedger } from "./domain/ledgerEngine.js";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { X } from "lucide-react";

import { DailySentenceSplash } from "./components/brand/DailySentenceSplash.jsx";
import { RexaLogo } from "./components/brand/RexaLogo.jsx";
import { BottomNav } from "./components/layout/BottomNav.jsx";
import { Header } from "./components/layout/Header.jsx";
import { SideMenu } from "./components/layout/SideMenu.jsx";
import { LockScreen } from "./components/security/LockScreen.jsx";
import { AddTransactionSheet } from "./components/sheets/AddTransactionSheet.jsx";
import { QuickAddSheet } from "./components/sheets/QuickAddSheet.jsx";
import { ReminderQuickModal } from "./components/sheets/ReminderQuickModal.jsx";
import { SimpleTextModal } from "./components/sheets/SimpleTextModal.jsx";
import { SmartCaptureOverlay } from "./components/sheets/SmartCaptureOverlay.jsx";
import { faKey } from "./domain/accountTree.js";
import { migrateTransactions, normalizeCategoriesForHierarchy } from "./domain/migrations.js";
import { seedAccounts, seedCategories, seedSettings } from "./domain/seeds.js";
import { useAppUpdates } from "./hooks/useAppUpdates.js";
import { useExchangeRates } from "./hooks/useExchangeRates.js";
import { useGithubSync } from "./hooks/useGithubSync.js";
import { listenNotificationActions, onLoanPayRequest, rescheduleDueNotifications } from "./services/notifications.js";
import { makePinRecord, withoutPin } from "./services/pinLock.js";
import { loadKey, saveKey } from "./services/storage.js";
import { openExternalUrl } from "./services/updates.js";
import { ThemeCtx } from "./theme/ThemeContext.js";
import { BRAND, COLOR_PRESETS, FONT, THEME } from "./theme/palette.js";
import { addDays, addMonths, faMonthYear, jalaliYear, jf, todayISO } from "./utils/dates.js";
import { toFaInt } from "./utils/format.js";
import { uid } from "./utils/id.js";
import { parseBankSms } from "./utils/smsParser.js";
import { SubViewContent } from "./views/SubViewContent.jsx";
import { ChecksManager } from "./views/checks/ChecksManager.jsx";
import { HomeView } from "./views/home/HomeView.jsx";
import { OperationsView } from "./views/operations/OperationsView.jsx";
import { ReportsView } from "./views/reports/ReportsView.jsx";
import { SUBVIEW_TITLES } from "./views/subViewTitles.js";
import { TransactionsView } from "./views/transactions/TransactionsView.jsx";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState(seedSettings());
  const [unlocked, setUnlocked] = useState(false);
  const [dailySplash, setDailySplash] = useState(true); // هر بار باز شدن برنامه نمایش داده می‌شود؛ جمله تا پایان همان روز ثابت است

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [checks, setChecks] = useState([]);
  const [bills, setBills] = useState([]);
  const [assets, setAssets] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [favorites, setFavorites] = useState({ categories: [], accounts: [] });
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fiscalPeriods, setFiscalPeriods] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [persons, setPersons] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [goals, setGoals] = useState([]);

  const [tab, setTab] = useState("home");
  const [subView, setSubView] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [prefillTx, setPrefillTx] = useState(null);
  const [open, setOpen] = useState({ shortcut: true });
  const [year, setYear] = useState(jalaliYear(new Date()));
  const [homeDay, setHomeDay] = useState(todayISO());
  const [txFilter, setTxFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [accountEditTarget, setAccountEditTarget] = useState(null);
  const [focusId, setFocusId] = useState(null);   // رکوردی که از صفحه اصلی انتخاب شده و باید در مدیر هر بخش باز شود
  const [shortcuts, setShortcuts] = useState(() => settings.shortcuts || []);
  const tapTimesRef = useRef([]);
  function handleTripleTap() {
    const now = Date.now();
    const recent = [...tapTimesRef.current.filter((tms) => now - tms < 600), now];
    tapTimesRef.current = recent;
    if (recent.length >= 3) {
      tapTimesRef.current = [];
      setShowCapture(true);
    }
  }


  const shared = settings.sharedFamily;

  const reloadAll = useCallback(async (sh) => {
    const [a, c, t, b, ln, ck, bl, as, rc, fv, mb, ev, pj, fp, nt, rm, ps, db, cu, gl] = await Promise.all([
      loadKey("hs:accounts", null, sh), loadKey("hs:categories", null, sh),
      loadKey("hs:transactions", null, sh), loadKey("hs:budgets", null, sh),
      loadKey("hs:loans", [], sh), loadKey("hs:checks", [], sh),
      loadKey("hs:bills", [], sh), loadKey("hs:assets", [], sh),
      loadKey("hs:recurring", [], sh), loadKey("hs:favorites", { categories: [], accounts: [] }, sh),
      loadKey("hs:members", [], sh), loadKey("hs:events", [], sh),
      loadKey("hs:projects", [], sh), loadKey("hs:fiscalPeriods", [], sh),
      loadKey("hs:notes", [], sh), loadKey("hs:reminders", [], sh),
      loadKey("hs:persons", [], sh), loadKey("hs:debts", [], sh), loadKey("hs:currencies", [], sh),
      loadKey("hs:goals", [], sh),
    ]);
    setAccounts((a || seedAccounts()).map((x) => ({ ...x, active: x.active !== false })));
    setCategories(normalizeCategoriesForHierarchy((c || seedCategories()).map((x) => ({ ...x, active: x.active !== false }))));
    const migratedTransactions = migrateTransactions(t || [], ln);
    setTransactions(migratedTransactions);
    setJournalEntries(rebuildLedger(migratedTransactions));
    setBudgets(b || []);
    setLoans(ln); setChecks(ck); setBills(bl); setAssets(as); setRecurring(rc); setFavorites(fv);
    setMembers(mb); setEvents(ev); setProjects(pj); setFiscalPeriods(fp);
    setNotes(nt); setReminders(rm);
    setPersons(ps || []); setDebts(db || []); setCurrencies(cu || []); setGoals(gl || []);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadKey("hs:settings", seedSettings(), false);
      setSettings(s);
      setShortcuts(s.shortcuts || []); // بازیابی میانبرهای ذخیره‌شده (قبلاً با باز شدن برنامه پاک می‌شدند)
      await reloadAll(s.sharedFamily);
      setLoaded(true);
    })();
    // eslint-disable-next-line
  }, []);

  useEffect(() => { if (loaded) saveKey("hs:settings", settings, false); }, [settings, loaded]);
  useEffect(() => { if (loaded) saveKey("hs:accounts", accounts, shared); }, [accounts, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:categories", categories, shared); }, [categories, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:transactions", transactions, shared); }, [transactions, loaded, shared]);
  useEffect(() => { if (loaded) setJournalEntries(rebuildLedger(transactions)); }, [transactions, loaded]);
  useEffect(() => { if (loaded) saveKey("hs:budgets", budgets, shared); }, [budgets, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:loans", loans, shared); }, [loans, loaded, shared]);
  // هر حساب بانکی/کارت در «حساب‌ها و کارت‌ها» یک حساب هم‌نام در درخت «حساب‌ها ← بانک‌ها» دارد (برای اتصال به موجودی واقعی)
  useEffect(() => {
    if (!loaded) return;
    const missing = accounts.filter((a) => (a.type === "bank" || a.type === "card") && a.name && !categories.some((c) => c.kind === "bank" && faKey(c.name) === faKey(a.name)));
    if (missing.length) setCategories((p) => [...p, ...missing.map((a) => ({ id: uid(), name: a.name, kind: "bank", autoFromAccount: a.id }))]);
  }, [loaded, accounts, categories]);

  useEffect(() => { if (loaded) saveKey("hs:checks", checks, shared); }, [checks, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:bills", bills, shared); }, [bills, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:assets", assets, shared); }, [assets, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:recurring", recurring, shared); }, [recurring, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:favorites", favorites, shared); }, [favorites, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:members", members, shared); }, [members, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:events", events, shared); }, [events, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:projects", projects, shared); }, [projects, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:fiscalPeriods", fiscalPeriods, shared); }, [fiscalPeriods, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:notes", notes, shared); }, [notes, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:reminders", reminders, shared); }, [reminders, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:persons", persons, shared); }, [persons, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:debts", debts, shared); }, [debts, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:currencies", currencies, shared); }, [currencies, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:goals", goals, shared); }, [goals, loaded, shared]);
  useEffect(() => { if (loaded) setSettings((prev) => prev.shortcuts === shortcuts ? prev : { ...prev, shortcuts }); }, [shortcuts, loaded]);

  // process recurring templates once after load
  useEffect(() => {
    if (!loaded) return;
    let changed = false;
    const newTx = [];
    const updated = recurring.map((r) => {
      if (!r.active) return r;
      let next = r.nextDate; let guard = 0; let rr = { ...r };
      while (next <= todayISO() && guard < 24) {
        newTx.push({ id: uid(), type: rr.type, amount: rr.amount, categoryId: rr.categoryId, accountId: rr.accountId, date: next, note: rr.note || "تراکنش تکرارشونده", tags: ["تکرارشونده"], createdAt: new Date().toISOString(), recurringId: rr.id });
        next = rr.interval === "weekly" ? addDays(next, 7) : addMonths(next, 1);
        guard++; changed = true;
      }
      return { ...rr, nextDate: next };
    });
    if (changed) {
      setRecurring(updated);
      setTransactions((prev) => [...newTx, ...prev]);
    }
    // eslint-disable-next-line
  }, [loaded]);

  // تبدیل رمز قدیمی (متن ساده) به هش
  useEffect(() => {
    if (!loaded || !settings.pin || settings.pinHash) return;
    (async () => {
      const rec = await makePinRecord(String(settings.pin));
      setSettings((s) => (s.pin ? { ...s, pin: "", ...rec } : s));
    })();
  }, [loaded, settings.pin, settings.pinHash]);

  // لمس اعلان سررسید قسط (یا دکمه‌ی «ثبت پرداخت قسط») → رفتن به صفحه‌ی وام‌ها و باز شدن پنجره‌ی ثبت همان قسط
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    listenNotificationActions();
    return onLoanPayRequest((id) => { setFocusId(id); setSubView("loans"); });
  }, []);

  // اعلان‌های واقعی سررسید چک/قبض/قسط و یادآوری‌ها (فقط در APK)
  useEffect(() => {
    if (!loaded || dailySplash || !Capacitor.isNativePlatform()) return;
    const tm = setTimeout(() => {
      rescheduleDueNotifications({ enabled: settings.dueNotif !== false, checks, bills, loans, reminders, checkDays: Number(settings.checkReminderDays) || 0 }).catch(() => {});
    }, 800);
    return () => clearTimeout(tm);
  }, [loaded, dailySplash, checks, bills, loans, reminders, settings.dueNotif, settings.checkReminderDays]);

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));
  const catById = useCallback((id) => categories.find((c) => c.id === id), [categories]);
  const accById = useCallback((id) => accounts.find((a) => a.id === id), [accounts]);

  const balanceMap = useMemo(() => {
    const m = {};
    accounts.forEach((a) => { m[a.id] = a.initial || 0; });
    transactions.forEach((t) => {
      if (t.type === "expense" && t.accountId in m) m[t.accountId] -= t.amount;
      else if (t.type === "income" && t.accountId in m) m[t.accountId] += t.amount;
      else if (t.type === "transfer") { if (t.accountId in m) m[t.accountId] -= t.amount; if (t.toAccountId in m) m[t.toAccountId] += t.amount; }
    });
    return m;
  }, [accounts, transactions]);
  const accountBalance = useCallback((accId) => balanceMap[accId] || 0, [balanceMap]);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + accountBalance(a.id), 0), [accounts, accountBalance]);
  const totalAssets = useMemo(() => assets.reduce((s, a) => s + (a.quantity * a.currentPrice || 0), 0), [assets]);

  const yearTx = useMemo(() => transactions.filter((t) => jalaliYear(new Date(t.date)) === year), [transactions, year]);
  const totalIncomeYear = useMemo(() => yearTx.filter((t) => t.type === "income" && isPnlTransaction(t)).reduce((s, t) => s + pnlAmount(t), 0), [yearTx]);
  const totalExpenseYear = useMemo(() => yearTx.filter((t) => t.type === "expense" && isPnlTransaction(t)).reduce((s, t) => s + pnlAmount(t), 0), [yearTx]);
  const gaugeMax = Math.max(totalIncomeYear, totalExpenseYear, 1);

  const expenseByCategory = useMemo(() => {
    const map = {};
    yearTx.filter((t) => t.type === "expense" && isPnlTransaction(t)).forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + pnlAmount(t); });
    return Object.entries(map).map(([catId, amount]) => ({ catId, amount, name: catById(catId)?.name || "بدون دسته" })).sort((a, b) => b.amount - a.amount);
  }, [yearTx, catById]);
  const incomeByCategory = useMemo(() => {
    const map = {};
    yearTx.filter((t) => t.type === "income" && isPnlTransaction(t)).forEach((t) => { map[t.categoryId] = (map[t.categoryId] || 0) + pnlAmount(t); });
    return Object.entries(map).map(([catId, amount]) => ({ catId, amount, name: catById(catId)?.name || "بدون دسته" })).sort((a, b) => b.amount - a.amount);
  }, [yearTx, catById]);

  function groupBy(idField, list) {
    const map = {};
    yearTx.filter((tx) => tx.type === "expense" && tx[idField] && isPnlTransaction(tx)).forEach((tx) => { map[tx[idField]] = (map[tx[idField]] || 0) + pnlAmount(tx); });
    return Object.entries(map).map(([id, amount]) => ({ id, amount, name: list.find((x) => x.id === id)?.name || "—" })).sort((a, b) => b.amount - a.amount);
  }
  const expenseByMember = useMemo(() => groupBy("memberId", members), [yearTx, members]);
  const expenseByEvent = useMemo(() => groupBy("eventId", events), [yearTx, events]);
  const expenseByProject = useMemo(() => groupBy("projectId", projects), [yearTx, projects]);

  // net worth trend: last 8 months
  const netWorthTrend = useMemo(() => {
    const cutoffs = [], labels = [];
    for (let i = 7; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); cutoffs.push(d.toISOString().slice(0, 10)); labels.push(faMonthYear(d).split(" ")[0]); }
    const base = accounts.reduce((s, a) => s + (a.initial || 0), 0);
    const bins = new Array(cutoffs.length).fill(0);       // یک بار عبور از تراکنش‌ها (قبلاً ۸ بار)
    for (const t of transactions) {
      const dlt = t.type === "expense" ? -t.amount : t.type === "income" ? t.amount : 0;
      if (!dlt) continue;
      for (let k = 0; k < cutoffs.length; k++) { if (t.date <= cutoffs[k]) { bins[k] += dlt; break; } }
    }
    let run = base;
    return cutoffs.map((_, k) => { run += bins[k]; return { name: labels[k], مانده: run }; });
  }, [accounts, transactions]);

  // بسته شدن فرم فوری انجام می‌شود؛ محاسبه‌ی سنگین‌ِ گزارش‌ها بعدش و بدون قفل کردن صفحه
  function addTransaction(tx) {
    startTransition(() => setTransactions((p) => [{ ...tx, id: tx.id || uid(), createdAt: tx.createdAt || new Date().toISOString() }, ...p]));
  }
  function updateTransaction(id, patch) {
    startTransition(() => setTransactions((p) => p.map((t) => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t)));
  }
  function deleteTransaction(id) { startTransition(() => setTransactions((p) => p.filter((t) => t.id !== id))); }
  function addAccount(a) { const item = { ...a, id: a.id || uid() }; setAccounts((p) => [...p, item]); return item.id; }
  function deleteAccount(id) {
    const used = transactions.some((t) => t.accountId === id || t.toAccountId === id) || loans.some((l) => l.accountId === id) || checks.some((c) => c.accountId === id) || bills.some((b) => b.accountId === id) || debts.some((d) => d.accountId === id) || assets.some((a) => a.accountId === id);
    if (used) { setAccounts((p) => p.map((a) => a.id === id ? { ...a, active: false, archivedAt: new Date().toISOString() } : a)); alert("این حساب سابقه مالی دارد و حذف نشد؛ به‌جای حذف، بایگانی شد. هر زمان خواستی از «حساب‌ها و کارت‌ها» بازگردانی‌اش کن."); return; }
    setAccounts((p) => p.filter((a) => a.id !== id));
  }
  function updateAccount(id, patch) { setAccounts((p) => p.map((a) => a.id === id ? { ...a, ...patch } : a)); }
  function addCategory(c) { const item = { ...c, id: c.id || uid() }; setCategories((p) => [...p, item]); return item.id; }
  function deleteCategory(id) {
    const used = transactions.some((t) => t.categoryId === id) || budgets.some((b) => b.categoryId === id) || categories.some((c) => c.parentId === id);
    if (used) { setCategories((p) => p.map((c) => c.id === id ? { ...c, active: false, archivedAt: new Date().toISOString() } : c)); alert("این سرفصل سابقه مالی دارد و حذف نشد؛ به‌جای حذف، بایگانی شد."); return; }
    setCategories((p) => p.filter((c) => c.id !== id && c.parentId !== id));
  }
  function updateCategory(id, patch) { setCategories((p) => p.map((c) => c.id === id ? { ...c, ...patch } : c)); }
  function upsertBudget(categoryId, amount) {
    setBudgets((prev) => prev.find((b) => b.categoryId === categoryId)
      ? prev.map((b) => (b.categoryId === categoryId ? { ...b, amount } : b))
      : [...prev, { id: uid(), categoryId, amount }]);
  }
  function toggleFavorite(kind, id) {
    setFavorites((prev) => {
      const list = prev[kind];
      return { ...prev, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
    });
  }

  const { rates, fetchRates } = useExchangeRates({ loaded, settings, setSettings });   // نرخ دلار بازار آزاد (TGJU) یا نرخ دستی

  const backupState = { backupVersion: 4, dataVersion: 4, ledgerVersion: 1, exportedAt: new Date().toISOString(), accounts, categories, transactions, journalEntries, budgets, loans, checks, bills, assets, recurring, favorites, settings: withoutPin(settings), shortcuts, members, events, projects, fiscalPeriods, notes, reminders, persons, debts, currencies, goals };
  async function exportBackup() {
    const filename = `rexa-backup-${todayISO()}.json`;
    const json = JSON.stringify(backupState, null, 2);
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "پشتیبان Rexa", text: "فایل پشتیبان Rexa", files: [result.uri], dialogTitle: "ذخیره یا ارسال پشتیبان Rexa" });
        return;
      } catch {}
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  function applyBackupData(data, { keepSecurity = false } = {}) {
        const migratedTransactions = migrateTransactions(data?.transactions || [], data?.loans || []);
        if (data.accounts) setAccounts(data.accounts);
        if (data.categories) setCategories(data.categories);
        if (data.transactions) setTransactions(migratedTransactions);
        if (data.budgets) setBudgets(data.budgets);
        if (data.loans) setLoans(data.loans);
        if (data.checks) setChecks(data.checks);
        if (data.bills) setBills(data.bills);
        if (data.assets) setAssets(data.assets);
        if (data.recurring) setRecurring(data.recurring);
        if (data.favorites) setFavorites(data.favorites);
        if (data.members) setMembers(data.members);
        if (data.events) setEvents(data.events);
        if (data.projects) setProjects(data.projects);
        if (data.fiscalPeriods) setFiscalPeriods(data.fiscalPeriods);
        if (data.notes) setNotes(data.notes);
        if (data.reminders) setReminders(data.reminders);
        if (data.persons) setPersons(data.persons);
        if (data.debts) setDebts(data.debts);
        if (data.currencies) setCurrencies(data.currencies);
        if (data.goals) setGoals(data.goals);
        if (data.shortcuts) setShortcuts(data.shortcuts);
        if (data.settings) setSettings((s) => ({ ...s, ...withoutPin(data.settings), ...(keepSecurity ? { biometricEnabled: s.biometricEnabled } : {}) }));
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        applyBackupData(JSON.parse(e.target.result));
        alert("بازیابی اطلاعات با موفقیت انجام شد");
      } catch { alert("فایل پشتیبان نامعتبر است"); }
    };
    reader.readAsText(file);
  }
  const backupRef = useRef(backupState); backupRef.current = backupState;
  const cloud = useGithubSync({
    loaded, getSnapshot: () => backupRef.current, applySnapshot: (d) => applyBackupData(d, { keepSecurity: true }),
    deps: [loaded, accounts, categories, transactions, journalEntries, budgets, loans, checks, bills, assets, recurring, favorites, members, events, projects, fiscalPeriods, notes, reminders, persons, debts, currencies, goals, shortcuts, settings],
  });
  const { updateInfo, setUpdateInfo, updateMsg, checkUpdateNow } = useAppUpdates({ loaded });   // بررسی نسخه‌ی جدید از GitHub Releases (فقط در APK)
  function exportExcel() {
    const typeFa = (t) => (t.type === "expense" ? "پرداخت" : t.type === "income" ? "دریافت" : "انتقال");
    const doc = {
      title: `تراکنش‌ها ${todayISO()}`, subtitle: "همه‌ی تراکنش‌ها",
      sections: [{ head: ["نوع", "مبلغ", "تاریخ", "دسته", "حساب", "برچسب", "یادداشت"], rows: transactions.map((t) => [typeFa(t), t.amount, jf(t.date), catById(t.categoryId)?.name || "", accById(t.accountId)?.name || "", (t.tags || []).join("، "), t.note || ""]) }],
    };
    exportDocXlsx(doc).catch((e) => alert("خروجی Excel گرفته نشد: " + (e?.message || e)));
  }

  const performExit = useCallback(async () => {
    if (!window.confirm("آیا از خروج از Rexa مطمئن هستید؟")) return;
    const wantBackup = window.confirm("قبل از خروج پشتیبان‌گیری شود؟\n\nبله = پشتیبان‌گیری و خروج\nخیر = خروج بدون پشتیبان");
    if (wantBackup) { try { await exportBackup(); } catch {} }
    try { if (Capacitor.isNativePlatform()) await CapacitorApp.exitApp(); else window.history.back(); } catch {}
  }, [settings, accounts, categories, transactions, journalEntries, budgets, loans, checks, bills, assets, recurring, favorites, members, events, projects, fiscalPeriods, notes, reminders, shortcuts]);

  useEffect(() => {
    if (!loaded || !Capacitor.isNativePlatform()) return;
    let listener;
    (async () => {
      listener = await CapacitorApp.addListener("backButton", async () => {
        const topOverlay = (window.__rexaBack || [])[(window.__rexaBack || []).length - 1];
        if (topOverlay) { topOverlay(); return; }
        if (showAdd) { setShowAdd(false); setPrefillTx(null); return; }
        if (showQuickAdd) { setShowQuickAdd(false); return; }
        if (showCapture) { setShowCapture(false); return; }
        if (menuOpen) { setMenuOpen(false); return; }
        if (subView) { setSubView(null); return; }
        if (tab !== "home") { setTab("home"); return; }
        await performExit();
      });
    })();
    return () => { listener?.remove?.(); };
  }, [loaded, showAdd, showQuickAdd, showCapture, menuOpen, subView, tab, performExit]);

  const registerVoiceTransaction = useCallback((transcript) => {
    const parsed = parseBankSms(transcript);
    if (!parsed.amount) { alert("مبلغ تشخیص داده نشد. مثال: «امروز ۳۵۰ تومن برای شام دادم»."); return; }
    const sameKind = categories.filter((c) => c.kind === parsed.type);
    const hinted = parsed.categoryHint ? sameKind.find((c) => c.name === parsed.categoryHint) : null;
    const fallback = sameKind.find((c) => c.name === (parsed.type === "expense" ? "متفرقه" : "درآمد متفرقه")) || sameKind[0];
    const accountId = accounts[0]?.id;
    if (!accountId) { alert("برای ثبت صوتی ابتدا یک حساب بسازید."); return; }
    addTransaction({ type: parsed.type, amount: parsed.amount, categoryId: hinted?.id || fallback?.id || "", accountId, date: todayISO(), note: `ثبت صوتی: ${parsed.note}`, tags: ["ثبت صوتی"] });
    alert(`${toFaInt(parsed.amount)} ریال بابت «${hinted?.name || fallback?.name || "بدون دسته"}» ثبت شد.`);
  }, [categories, accounts]);
  const t = THEME[settings.theme] || THEME.light;
  Object.assign(BRAND, COLOR_PRESETS[settings.themeColor] || COLOR_PRESETS.purple);

  if (dailySplash) return <DailySentenceSplash onDone={() => setDailySplash(false)} />;
  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: BRAND.header, fontFamily: FONT }}>
        <RexaLogo size={84} showWordmark />
        <div style={{ color: "#d8c9e8", fontSize: 13 }}>در حال بارگذاری...</div>
      </div>
    );
  }
  if ((settings.pinHash || settings.pin || settings.biometricEnabled) && !unlocked) {
    return <LockScreen pin={settings.pin} pinHash={settings.pinHash} pinSalt={settings.pinSalt} onUnlock={() => setUnlocked(true)} biometricEnabled={settings.biometricEnabled} />;
  }

  function openWithPrefill(data) {
    setPrefillTx(data);
    setShowAdd(true);
  }

  async function rebuildData() {
    if (!window.confirm("بازسازی اطلاعات انجام شود؟ قبل از بازسازی یک پشتیبان خودکار تهیه می‌شود.")) return;
    await exportBackup();
    const normalize = (arr, defaults = []) => (Array.isArray(arr) ? arr : defaults).map((x) => ({ ...x, id: x?.id || uid() }));
    setAccounts(normalize(accounts, seedAccounts()));
    setCategories(normalize(categories, seedCategories()));
    setTransactions(normalize(transactions));
    setBudgets(normalize(budgets)); setLoans(normalize(loans)); setChecks(normalize(checks));
    setBills(normalize(bills)); setAssets(normalize(assets)); setRecurring(normalize(recurring));
    setMembers(normalize(members)); setEvents(normalize(events)); setProjects(normalize(projects));
    setFiscalPeriods(normalize(fiscalPeriods)); setNotes(normalize(notes)); setReminders(normalize(reminders));
    setPersons(normalize(persons)); setDebts(normalize(debts)); setCurrencies(normalize(currencies)); setGoals(normalize(goals));
    setFavorites({ categories: (favorites?.categories || []).filter((id) => categories.some((c) => c.id === id)), accounts: (favorites?.accounts || []).filter((id) => accounts.some((a) => a.id === id)) });
    alert("بازسازی اطلاعات با موفقیت انجام شد.");
  }

  async function clearAllData() {
    if (!window.confirm("تمام اطلاعات مالی و تراکنش‌ها پاک می‌شود. ابتدا پشتیبان تهیه شود؟")) return;
    await exportBackup();
    if (!window.confirm("تأیید نهایی: اطلاعات مالی این دستگاه خام شود؟ این عملیات پس از اجرا با پشتیبان قابل بازگردانی است.")) return;
    setAccounts(seedAccounts()); setCategories(seedCategories()); setTransactions([]); setBudgets([]); setLoans([]); setChecks([]);
    setBills([]); setAssets([]); setRecurring([]); setFavorites({ categories: [], accounts: [] }); setMembers([]); setEvents([]);
    setProjects([]); setFiscalPeriods([]); setNotes([]); setReminders([]); setPersons([]); setDebts([]); setCurrencies([]); setGoals([]);
    alert("اطلاعات مالی خام شد. پشتیبان قبلی را در صورت نیاز بازیابی کنید.");
  }


  const ctx = {
    accounts, addAccount, deleteAccount, updateAccount, accountBalance, accountEditTarget, setAccountEditTarget, focusId, setFocusId,
    categories, addCategory, deleteCategory, updateCategory,
    budgets, upsertBudget, expenseByCategory, incomeByCategory,
    loans, setLoans, checks, setChecks, bills, setBills, assets, setAssets,
    recurring, setRecurring, favorites, toggleFavorite, shortcuts, setShortcuts,
    settings, setSettings, exportBackup, importBackup, exportExcel,
    transactions, catById, accById, totalBalance, totalAssets,
    members, setMembers, events, setEvents, projects, setProjects,
    persons, setPersons, debts, setDebts, currencies, setCurrencies, goals, setGoals,
    fiscalPeriods, setFiscalPeriods, openWithPrefill,
    notes, setNotes, reminders, setReminders, rates, fetchRates,
    addTransaction, updateTransaction, deleteTransaction, setTransactions, rebuildData, clearAllData,
    cloud, updateInfo, updateMsg, checkUpdateNow,
  };

  return (
    <ThemeCtx.Provider value={t}>
      <div dir="rtl" onClick={handleTripleTap} style={{ fontFamily: FONT, background: t.bg, color: t.text, minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 0 30px rgba(0,0,0,0.08)", zoom: settings.fontScale || 1 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; } html, body, #root { margin: 0; min-height: 100%; width: 100%; } body { overflow-x: hidden; overscroll-behavior-y: none; }
          input, select, textarea, button { font-family: inherit; }
          ::-webkit-scrollbar { width: 0; height: 0; }
          @media print { .no-print { display: none !important; } }
        `}</style>

        {subView ? (
          <Header title={SUBVIEW_TITLES[subView]} back onBack={() => setSubView(null)} />
        ) : (
          <Header title={settings.profile?.name || "alireza shadfar"} onMenu={() => setMenuOpen(true)}
            onMic={registerVoiceTransaction} />
        )}

        {(updateInfo || cloud.state.conflict) && (
          <div style={{ padding: "8px 12px 0", display: "flex", flexDirection: "column", gap: 6 }}>
            {cloud.state.conflict && (
              <div onClick={() => { setMenuOpen(false); setSubView("cloud"); }} style={{ background: "#fff4e0", color: "#8a5a00", border: "1px solid #f0c777", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, lineHeight: 1.8, cursor: "pointer" }}>
                داده‌های گیت‌هاب با این گوشی فرق دارد. برای انتخاب (دریافت یا جایگزینی) اینجا را بزنید.
              </div>
            )}
            {updateInfo && (
              <div style={{ background: "#e8f7ee", color: "#17603a", border: "1px solid #9fd8b4", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, lineHeight: 1.8 }}>نسخه‌ی جدید Rexa آماده است ({updateInfo.name}).</span>
                <button onClick={() => openExternalUrl(updateInfo.url)} style={{ background: "#17603a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>دانلود</button>
                <button onClick={() => setUpdateInfo(null)} aria-label="بستن" style={{ background: "none", border: "none", color: "#17603a", cursor: "pointer", display: "flex" }}><X size={16} /></button>
              </div>
            )}
          </div>
        )}

        {subView ? (
          <SubViewContent subView={subView} ctx={ctx} onBack={() => setSubView(null)} />
        ) : (
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
            {tab === "home" && (
              <HomeView
                year={year} setYear={setYear}
                totalIncomeYear={totalIncomeYear} totalExpenseYear={totalExpenseYear} gaugeMax={gaugeMax}
                open={open} toggle={toggle}
                accounts={accounts} accountBalance={accountBalance}
                expenseByCategory={expenseByCategory} incomeByCategory={incomeByCategory}
                budgets={budgets} categories={categories} transactions={yearTx} allTransactions={transactions}
                bills={bills} loans={loans} checks={checks} assets={assets} totalAssets={totalAssets} persons={persons} debts={debts}
                openAccounts={() => { setAccountEditTarget(null); setSubView("accounts"); }} onEditAccount={(a) => { setAccountEditTarget(a); setSubView("accounts"); }} openBudgets={() => setSubView("budgets")}
                openBills={() => setSubView("bills")} openLoans={() => setSubView("loans")} openPersons={() => setSubView("persons")} openDebts={() => setSubView("debts")}
                openChecks={() => setSubView("checks")} openAssets={() => setSubView("assets")} openSubView={(k) => setSubView(k)}
                homeDay={homeDay} setHomeDay={setHomeDay} catById={catById}
                settings={settings} setSettings={setSettings} rates={rates} fetchRates={fetchRates}
                onNote={() => setShowNoteModal(true)} onReminder={() => setShowReminderModal(true)}
                shortcuts={shortcuts}
                onRunShortcut={(sc) => { setShowQuickAdd(false); setShowAdd(true); setPrefillTx({ type: sc.type, categoryId: sc.categoryId, accountId: sc.accountId, note: sc.note || `میانبر: ${sc.name}` }); }}
                openShortcuts={() => setSubView("shortcuts")}
                onOpenTransactions={() => setTab("transactions")}
                onOpenItem={(view, id) => { setFocusId(id); setSubView(view); }}
                onEditTransaction={(tx) => { setPrefillTx({ ...tx, _editId: tx.id }); setShowAdd(true); }}
                onDeleteTransaction={deleteTransaction}
                onDeleteAccount={deleteAccount}
                onUpdateAccount={updateAccount}
                onAddTransaction={(type) => { setPrefillTx(type ? { type } : null); setShowAdd(true); }}
              />
            )}
            {tab === "transactions" && (
              <TransactionsView
                transactions={transactions} catById={catById} accById={accById} checks={checks}
                filter={txFilter} setFilter={setTxFilter} onDelete={deleteTransaction}
                onEdit={(tx) => { setPrefillTx({ ...tx, _editId: tx.id }); setShowAdd(true); }}
                search={txSearch} setSearch={setTxSearch}
              />
            )}
            {tab === "operations" && <OperationsView setSubView={setSubView} onAdd={() => setShowAdd(true)} />}
            {tab === "checks" && <ChecksManager checks={checks} setChecks={setChecks} accounts={accounts} setTransactions={setTransactions} focusId={focusId} setFocusId={setFocusId} />}
            {tab === "reports" && (
              <ReportsView
                expenseByCategory={expenseByCategory} incomeByCategory={incomeByCategory}
                totalIncomeYear={totalIncomeYear} totalExpenseYear={totalExpenseYear}
                accounts={accounts} accountBalance={accountBalance}
                netWorthTrend={netWorthTrend} exportExcel={exportExcel}
                expenseByMember={expenseByMember} expenseByEvent={expenseByEvent} expenseByProject={expenseByProject}
                categories={categories} checks={checks} debts={debts} totalAssets={totalAssets} currency={settings.currency} usdRate={rates?.usd}
                transactions={transactions} updateAccount={updateAccount}
                members={members} events={events} projects={projects} loans={loans} assets={assets} bills={bills}
              />
            )}
          </div>
        )}

        <BottomNav
          active={subView ? null : tab}
          setActive={(k) => {
            setShowAdd(false); setPrefillTx(null); setShowQuickAdd(false); setShowCapture(false); setMenuOpen(false); setSubView(null);
            setTab(k);
          }}
          onAdd={() => {
            setShowAdd(false); setPrefillTx(null); setShowCapture(false); setMenuOpen(false); setSubView(null);
            setShowQuickAdd(true);
          }}
        />

        {showQuickAdd && (
          <QuickAddSheet
            onClose={() => setShowQuickAdd(false)}
            onPick={(type) => {
              setShowQuickAdd(false);
              if (type === "check") { setTab("checks"); return; }
              setPrefillTx(type === "expense" ? { type: "expense" } : type === "income" ? { type: "income" } : type === "transfer" ? { type: "transfer" } : null);
              setShowAdd(true);
            }}
          />
        )}

        {showNoteModal && (
          <SimpleTextModal title="یادداشت جدید" placeholder="یادداشتت رو بنویس..."
            onClose={() => setShowNoteModal(false)}
            onSubmit={(text) => { setNotes((p) => [{ id: uid(), text, date: todayISO(), createdAt: new Date().toISOString() }, ...p]); setShowNoteModal(false); }} />
        )}
        {showReminderModal && (
          <ReminderQuickModal onClose={() => setShowReminderModal(false)}
            onSubmit={(r) => { setReminders((p) => [{ id: uid(), ...r }, ...p]); setShowReminderModal(false); }} />
        )}
        {showCapture && (
          <SmartCaptureOverlay
            onClose={() => setShowCapture(false)}
            onParsed={(data) => { setShowCapture(false); openWithPrefill(data); }}
          />
        )}

        {showAdd && (
          <AddTransactionSheet
            accounts={accounts} categories={categories} favorites={favorites}
            onAddAccount={addAccount} onAddCategory={addCategory}
            members={members} events={events} projects={projects}
            initial={prefillTx}
            onClose={() => { setShowAdd(false); setPrefillTx(null); }}
            onSubmit={(tx) => {
              if (prefillTx?._editId) setTransactions((prev) => prev.map((item) => item.id === prefillTx._editId ? { ...item, ...tx, id: item.id, createdAt: item.createdAt } : item));
              else addTransaction(tx);
              setShowAdd(false); setPrefillTx(null);
            }}
          />
        )}
        {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} setSubView={(v) => { setSubView(v); setMenuOpen(false); }} profileName={settings.profile?.name} />}
      </div>
    </ThemeCtx.Provider>
  );
}
