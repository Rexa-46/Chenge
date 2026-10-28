import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exportDocXlsx } from "./services/exportDoc.js";
import { isPnlTransaction, pnlAmount } from "./domain/financialEngine.js";
import { rebuildLedger } from "./domain/ledgerEngine.js";
import { buildHeadingTree } from "./domain/headingTree.js";
import { usePersistedState } from "./hooks/usePersistedState.js";
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
import { LocalNotifications } from "@capacitor/local-notifications";
import { AlarmsSheet } from "./components/sheets/AlarmsSheet.jsx";
import { buildAlarms } from "./domain/alarms.js";
import { askExactAlarm, exactAlarmStatus, listenNotificationActions, onLoanPayRequest, requestLoanPay, rescheduleDueNotifications } from "./services/notifications.js";
import { decryptSnapshot, encryptSnapshot, syncReady } from "./services/githubSync.js";
import { ExitSheet } from "./components/sheets/ExitSheet.jsx";
import { isEncryptedBackup, validateBackup } from "./services/backupValidate.js";
import { makePinRecord, withoutPin } from "./services/pinLock.js";
import { loadKey, saveKey } from "./services/storage.js";
import { openExternalUrl } from "./services/updates.js";
import { ThemeCtx } from "./theme/ThemeContext.js";
import { BRAND, COLOR_PRESETS, FONT, THEME } from "./theme/palette.js";
import { addDays, addMonths, jalaliParts, jalaliYear, jf, lastJalaliMonthEnds, parseISO, todayISO } from "./utils/dates.js";
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

// آخرین وضعیت (تب و صفحه‌ی باز) هنگام بسته شدن ذخیره می‌شود و با باز شدن برنامه برمی‌گردد
const RELOCK_AFTER_MS = 30 * 1000;
const LAST_VIEW_KEY = "rexa:lastView";
const VALID_TABS = ["home", "transactions", "operations", "checks", "reports"];
const readLastView = () => { try { return JSON.parse(localStorage.getItem(LAST_VIEW_KEY) || "null") || {}; } catch { return {}; } };

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);   // خطای خواندن از دیتابیس؛ تا رفع نشود «بارگذاری‌شده» حساب نمی‌شود و چیزی بازنویسی نمی‌شود
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

  const [tab, setTab] = useState(() => (VALID_TABS.includes(readLastView().tab) ? readLastView().tab : "home"));
  const [subView, setSubView] = useState(() => { const v = readLastView().subView; return v && SUBVIEW_TITLES[v] ? v : null; });
  const [showAlarms, setShowAlarms] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [prefillTx, setPrefillTx] = useState(null);
  const [open, setOpen] = usePersistedState("homeOpen", { shortcut: true });   // بخش‌های باز خانه مثل آخرین خروج باز می‌مانند
  const [year, setYear] = useState(jalaliYear(new Date()));
  const [homeDay, setHomeDay] = useState(todayISO());
  const [txFilter, setTxFilter] = usePersistedState("txFilter", "all");
  const [txSearch, setTxSearch] = usePersistedState("txSearch", "");
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
    setJournalEntries(rebuildLedger(migratedTransactions, ln));
    setBudgets(b || []);
    setLoans(ln); setChecks(ck); setBills(bl); setAssets(as); setRecurring(rc); setFavorites(fv);
    setMembers(mb); setEvents(ev); setProjects(pj); setFiscalPeriods(fp);
    setNotes(nt); setReminders(rm);
    setPersons(ps || []); setDebts(db || []); setCurrencies(cu || []); setGoals(gl || []);
  }, []);

  const initialLoad = useCallback(async () => {
    setLoadError(null);
    try {
      const s = await loadKey("hs:settings", seedSettings(), false);
      await reloadAll(s.sharedFamily);   // همه‌ی کلیدها خوانده می‌شوند و فقط در صورت موفقیت کامل state پر می‌شود
      setSettings(s);
      setShortcuts(s.shortcuts || []); // بازیابی میانبرهای ذخیره‌شده (قبلاً با باز شدن برنامه پاک می‌شدند)
      setLoaded(true);
    } catch (e) {
      console.error("load fail", e);
      setLoadError(String(e?.message || e || "خطای نامشخص"));
    }
  }, [reloadAll]);
  useEffect(() => { initialLoad(); }, [initialLoad]);

  useEffect(() => { if (loaded) saveKey("hs:settings", settings, false); }, [settings, loaded]);
  useEffect(() => { if (loaded) saveKey("hs:accounts", accounts, shared); }, [accounts, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:categories", categories, shared); }, [categories, loaded, shared]);
  useEffect(() => { if (loaded) saveKey("hs:transactions", transactions, shared); }, [transactions, loaded, shared]);
  useEffect(() => { if (loaded) setJournalEntries(rebuildLedger(transactions, loans)); }, [transactions, loans, loaded]);
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

  // تراکنش‌های تکرارشونده: هنگام بارگذاری، هر بار برگشت به برنامه و نیمه‌شب (تغییر روز) اجرا می‌شود.
  // سقف ۱۲۰ دوره برای هر قالب فقط محافظ حلقه‌ی بی‌پایان است؛ ماهانه‌ها بر اساس ماه شمسی و روزِ ثابتِ شروع محاسبه می‌شوند.
  const recurringRef = useRef(recurring); recurringRef.current = recurring;
  const processRecurring = useCallback(() => {
    const today = todayISO();
    let changed = false;
    const newTx = [];
    const updated = recurringRef.current.map((r) => {
      if (!r.active || !r.nextDate) return r;
      const anchorDay = jalaliParts(parseISO(r.startDate || r.nextDate)).day;
      let next = r.nextDate; let guard = 0;
      while (next <= today && guard < 120) {
        newTx.push({ id: uid(), type: r.type, amount: r.amount, categoryId: r.categoryId, accountId: r.accountId, date: next, note: r.note || "تراکنش تکرارشونده", tags: ["تکرارشونده"], createdAt: new Date().toISOString(), recurringId: r.id });
        next = r.interval === "weekly" ? addDays(next, 7) : addMonths(next, 1, anchorDay);
        guard++; changed = true;
      }
      return next === r.nextDate ? r : { ...r, nextDate: next };
    });
    if (!changed) return;
    setRecurring(updated);
    // اگر تراکنشی با همین قالب و تاریخ از قبل هست دوباره ساخته نمی‌شود
    setTransactions((prev) => [...newTx.filter((n) => !prev.some((x) => x.recurringId === n.recurringId && x.date === n.date)), ...prev]);
  }, []);
  useEffect(() => { if (loaded) processRecurring(); }, [loaded, processRecurring]);
  useEffect(() => {
    if (!loaded) return;
    const onVisible = () => { if (document.visibilityState === "visible") processRecurring(); };
    document.addEventListener("visibilitychange", onVisible);
    let appListener; let cancelled = false;
    if (Capacitor.isNativePlatform()) CapacitorApp.addListener("appStateChange", ({ isActive }) => { if (isActive) processRecurring(); }).then((l) => { if (cancelled) l.remove?.(); else appListener = l; }).catch(() => {});
    const msToMidnight = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 5) - n; };
    let tm = setTimeout(function tick() { processRecurring(); tm = setTimeout(tick, msToMidnight()); }, msToMidnight());
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); appListener?.remove?.(); clearTimeout(tm); };
  }, [loaded, processRecurring]);

  // تبدیل رمز قدیمی (متن ساده) به هش
  useEffect(() => {
    if (!loaded || !settings.pin || settings.pinHash) return;
    (async () => {
      const rec = await makePinRecord(String(settings.pin));
      setSettings((s) => (s.pin ? { ...s, pin: "", ...rec } : s));
    })();
  }, [loaded, settings.pin, settings.pinHash]);

  useEffect(() => { try { localStorage.setItem(LAST_VIEW_KEY, JSON.stringify({ tab, subView })); } catch {} }, [tab, subView]);

  const alarms = useMemo(() => buildAlarms({ checks, bills, loans, reminders, checkDays: Number(settings.checkReminderDays) || 0 }), [checks, bills, loans, reminders, settings.checkReminderDays, showAlarms]);
  function openBell() {
    setShowAlarms(true);
    if (Capacitor.isNativePlatform()) LocalNotifications.checkPermissions().then((p) => setNotifBlocked(p.display !== "granted")).catch(() => {});
  }
  async function enableNotif() {
    try {
      const p = await LocalNotifications.requestPermissions();
      setNotifBlocked(p.display !== "granted");
      if (p.display === "granted") {
        rescheduleDueNotifications({ enabled: settings.dueNotif !== false, checks, bills, loans, reminders, checkDays: Number(settings.checkReminderDays) || 0 }).catch(() => {});
        // اندروید ۱۲ به بالا: بدون «آلارم و یادآور دقیق» اعلان‌ها دیر می‌رسند
        if ((await exactAlarmStatus()) !== "granted" && window.confirm("برای رسیدن اعلان‌ها سر ساعت، مجوز «آلارم و یادآور دقیق» لازم است. صفحه‌ی تنظیمات همین مجوز باز شود؟")) await askExactAlarm();
      }
    } catch {}
  }
  function openAlarm(it) {
    setShowAlarms(false);
    setTab("home");
    setFocusId(it.id); setSubView(it.view);
    if (it.kind === "loan") requestLoanPay(it.id);
  }

  // لمس اعلان سررسید قسط (یا دکمه‌ی «ثبت پرداخت قسط») → رفتن به صفحه‌ی وام‌ها و باز شدن پنجره‌ی ثبت همان قسط
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    listenNotificationActions();
    return onLoanPayRequest((id) => { setFocusId(id); setSubView("loans"); });
  }, []);

  // اعلان‌های واقعی سررسید چک/قبض/قسط و یادآوری‌ها (فقط در APK)
  const [resumeTick, setResumeTick] = useState(0);   // با هر برگشت به برنامه یک واحد زیاد می‌شود تا اعلان‌ها دوباره زمان‌بندی شوند
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let l; let cancelled = false;
    CapacitorApp.addListener("appStateChange", ({ isActive }) => { if (isActive) setResumeTick((n) => n + 1); }).then((h) => { if (cancelled) h.remove?.(); else l = h; }).catch(() => {});
    return () => { cancelled = true; l?.remove?.(); };
  }, []);
  useEffect(() => {
    if (!loaded || dailySplash || !Capacitor.isNativePlatform()) return;
    const tm = setTimeout(() => {
      rescheduleDueNotifications({ enabled: settings.dueNotif !== false, checks, bills, loans, reminders, checkDays: Number(settings.checkReminderDays) || 0 }).catch(() => {});
    }, 800);
    return () => clearTimeout(tm);
  }, [loaded, dailySplash, checks, bills, loans, reminders, settings.dueNotif, settings.checkReminderDays, resumeTick]);

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

  const yearTx = useMemo(() => transactions.filter((t) => jalaliYear(parseISO(t.date)) === year), [transactions, year]);
  const totalIncomeYear = useMemo(() => yearTx.filter((t) => t.type === "income" && isPnlTransaction(t)).reduce((s, t) => s + pnlAmount(t), 0), [yearTx]);
  const totalExpenseYear = useMemo(() => yearTx.filter((t) => t.type === "expense" && isPnlTransaction(t)).reduce((s, t) => s + pnlAmount(t), 0), [yearTx]);
  const gaugeMax = Math.max(totalIncomeYear, totalExpenseYear, 1);
  // «مانده سالانه» = دریافت‌ها − پرداخت‌های واقعی سال (همان ارقامی که در تراکنش‌ها و گزارش‌ها دیده می‌شود)؛ انتقال بین حساب‌ها حساب نمی‌شود
  const incomeCashYear = useMemo(() => yearTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0), [yearTx]);
  const expenseCashYear = useMemo(() => yearTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0), [yearTx]);
  const pnlAmt = (x) => (isPnlTransaction(x) ? pnlAmount(x) : 0);
  const expenseTree = useMemo(() => buildHeadingTree(yearTx, "expense", categories, pnlAmt), [yearTx, categories]);
  const incomeTree = useMemo(() => buildHeadingTree(yearTx, "income", categories, pnlAmt), [yearTx, categories]);

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
    const ends = lastJalaliMonthEnds(8);   // ۸ ماه شمسی اخیر؛ برچسب‌ها هم نام ماه شمسی‌اند
    const cutoffs = ends.map((e) => e.cutoff), labels = ends.map((e) => e.label);
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
  function deleteTransaction(id) {
    const tx = transactions.find((t) => t.id === id);
    if (tx?.loanId && tx.loanRole === "receipt") { alert("تراکنش دریافت وام از صفحه‌ی «وام‌ها» ویرایش یا حذف می‌شود."); return; }
    if (tx?.loanId && tx.loanRole === "installment") {
      const loan = loans.find((l) => l.id === tx.loanId);
      if (loan) {
        // فقط آخرین قسط ثبت‌شده قابل حذف است؛ در غیر این صورت شماره‌ی اقساط و تعداد پرداخت‌شده‌ها ناهماهنگ می‌شود
        if (Number(tx.loanSeq) !== Number(loan.paidCount)) { alert(`قسط شماره ${toFaInt(tx.loanSeq)} آخرین قسط پرداخت‌شده نیست. ابتدا از صفحه‌ی «وام‌ها» اقساط بعدی را برگردان.`); return; }
        setLoans((p) => p.map((l) => l.id === loan.id ? { ...l, paidCount: Math.max(Number(l.prepaidCount || 0), Number(l.paidCount || 0) - 1) } : l));
      }
    }
    startTransition(() => setTransactions((p) => p.filter((t) => t.id !== id)));
  }
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
  // انتقال یک حساب با همه‌ی زیرمجموعه‌هایش زیر سرفصل دیگر (یا به سطح اول یک گروه)
  function moveCategory(id, parentId, kind) {
    setCategories((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target || parentId === id) return prev;
      const desc = new Set([id]); let grew = true;
      while (grew) { grew = false; prev.forEach((c) => { if (c.parentId && desc.has(c.parentId) && !desc.has(c.id)) { desc.add(c.id); grew = true; } }); }
      if (parentId && desc.has(parentId)) return prev;   // انتقال به زیرمجموعه‌ی خودش حلقه می‌سازد
      const newKind = parentId ? (prev.find((c) => c.id === parentId)?.kind || kind || target.kind) : (kind || target.kind);
      return prev.map((c) => (!desc.has(c.id) ? c : c.id === id ? { ...c, parentId: parentId || undefined, kind: newKind } : { ...c, kind: newKind }));
    });
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
    // فایل پشتیبان حاوی همه‌ی اطلاعات مالی است؛ به‌صورت پیش‌فرض با رمز (AES-GCM) رمزگذاری می‌شود
    let payload = JSON.stringify(backupState, null, 2);
    let filename = `rexa-backup-${todayISO()}.json`;
    if (window.confirm("پشتیبان با رمز رمزگذاری شود؟\n\nبله (پیشنهادی) = فایل فقط با رمزی که می‌دهی باز می‌شود\nخیر = فایل ساده و بدون رمز")) {
      const pass = window.prompt("یک رمز برای فایل پشتیبان وارد کن (حداقل ۴ نویسه). این رمز را فراموش نکن؛ بدون آن بازیابی ممکن نیست.") || "";
      if (pass.length < 4) { alert("رمز واردنشد یا کوتاه بود؛ پشتیبان ساخته نشد."); return false; }
      try { payload = await encryptSnapshot(backupState, pass, { kind: "backup" }); filename = `rexa-backup-${todayISO()}.enc.json`; }
      catch (e) { alert("رمزگذاری پشتیبان ممکن نشد: " + (e?.message || e)); return false; }
    }
    if (Capacitor.isNativePlatform()) {
      let written = null;
      try {
        written = await Filesystem.writeFile({ path: filename, data: payload, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "پشتیبان Rexa", text: "فایل پشتیبان Rexa", files: [written.uri], dialogTitle: "ذخیره یا ارسال پشتیبان Rexa" });
        return true;
      } catch (e) {
        if (!written) console.error("backup write fail", e);   // کاربر اشتراک‌گذاری را بسته: خطا نیست
        else return false;
      } finally {
        // نسخه‌ی موقت در Cache نباید روی دستگاه بماند
        if (written) Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => {});
      }
    }
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    return true;
  }
  function applyBackupData(data, { keepSecurity = false } = {}) {
    const check = validateBackup(data);
    if (!check.ok) throw new Error(check.errors[0]);   // فایل نامعتبر هرگز نیمه‌کاره اعمال نمی‌شود
    // همه‌ی تبدیل‌ها قبل از اولین setState انجام می‌شوند؛ اگر خطا بدهد هیچ داده‌ای تغییر نکرده است
    const migratedTransactions = data.transactions ? migrateTransactions(data.transactions, data.loans || []) : null;
    startTransition(() => {
        if (data.accounts) setAccounts(data.accounts);
        if (data.categories) setCategories(data.categories);
        if (migratedTransactions) setTransactions(migratedTransactions);
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
    });
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onerror = () => alert("خواندن فایل پشتیبان ممکن نشد.");
    reader.onload = async (e) => {
      let data;
      try {
        let parsed;
        try { parsed = JSON.parse(e.target.result); } catch { alert("فایل پشتیبان نامعتبر است (JSON خراب)."); return; }
        if (isEncryptedBackup(parsed)) {
          const pass = window.prompt("این پشتیبان رمزگذاری شده است. رمز فایل را وارد کن:") || "";
          if (!pass) return;
          try { data = (await decryptSnapshot(e.target.result, pass)).data; }
          catch { alert("رمز اشتباه است یا فایل آسیب دیده است."); return; }
        } else data = parsed;
        const check = validateBackup(data);
        if (!check.ok) { alert("بازیابی انجام نشد:\n" + check.errors.join("\n")); return; }
        const c = check.counts;
        const summary = `${toFaInt(c.accounts || 0)} حساب، ${toFaInt(c.transactions || 0)} تراکنش، ${toFaInt(c.loans || 0)} وام، ${toFaInt(c.checks || 0)} چک`;
        if (!window.confirm(`⚠️ هشدار: با بازیابی، همه‌ی داده‌های فعلی برنامه با محتوای این فایل جایگزین می‌شوند.\n\nمحتوای فایل: ${summary}\n\nادامه می‌دهی؟`)) return;
        if (window.confirm("قبل از جایگزینی، از داده‌های فعلی پشتیبان گرفته شود؟ (پیشنهاد می‌شود)")) { const ok = await exportBackup(); if (ok === false && !window.confirm("پشتیبان فعلی ساخته نشد. بدون آن ادامه بدهم؟")) return; }
        applyBackupData(data);
        alert("بازیابی اطلاعات با موفقیت انجام شد");
      } catch (err) { alert("بازیابی ناموفق بود: " + (err?.message || err)); }
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

  // فرم خروج: با پشتیبان (گوشی و/یا فضای ابری) یا بدون پشتیبان
  const [showExit, setShowExit] = useState(false);
  const performExit = useCallback(() => { setShowExit(true); }, []);
  async function exitNow() {
    try { if (Capacitor.isNativePlatform()) await CapacitorApp.exitApp(); else window.history.back(); } catch {}
  }
  async function saveBackupToDevice(payload, filename) {
    if (Capacitor.isNativePlatform()) {
      try {
        try { await Filesystem.requestPermissions(); } catch {}
        await Filesystem.writeFile({ path: `Rexa/${filename}`, data: payload, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
        return { ok: true, text: `ذخیره شد (Documents/Rexa/${filename})` };
      } catch (e1) {
        // دسترسی مستقیم به پوشه‌ی Documents ممکن نشد: منوی اشتراک‌گذاری (ذخیره در فایل‌ها / درایو / …)
        let written = null;
        try {
          written = await Filesystem.writeFile({ path: filename, data: payload, directory: Directory.Cache, encoding: Encoding.UTF8 });
          await Share.share({ title: "پشتیبان Rexa", text: "فایل پشتیبان Rexa", files: [written.uri], dialogTitle: "ذخیره‌ی پشتیبان Rexa" });
          return { ok: true, text: "از منوی اشتراک‌گذاری ذخیره/ارسال شد" };
        } catch (e2) { return { ok: false, text: "ذخیره‌ی فایل ممکن نشد یا منوی اشتراک‌گذاری بسته شد" }; }
        finally { if (written) Filesystem.deleteFile({ path: filename, directory: Directory.Cache }).catch(() => {}); }
      }
    }
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    return { ok: true, text: "فایل دانلود شد" };
  }
  async function runExitBackup({ device, cloud: toCloud, encrypt, pass }) {
    const results = [];
    if (device) {
      try {
        const stamp = `${todayISO()}-${new Date().toTimeString().slice(0, 5).replace(":", "")}`;
        let payload = JSON.stringify(backupState, null, 2), filename = `rexa-backup-${stamp}.json`;
        if (encrypt) { payload = await encryptSnapshot(backupState, pass, { kind: "backup" }); filename = `rexa-backup-${stamp}.enc.json`; }
        results.push({ label: "گوشی", ...(await saveBackupToDevice(payload, filename)) });
      } catch (e) { results.push({ label: "گوشی", ok: false, text: String(e?.message || e) }); }
    }
    if (toCloud) {
      const r = await cloud.runSync("push");
      results.push({ label: "فضای ابری", ok: !!r?.ok, text: r?.text || (r?.ok ? "انجام شد" : "انجام نشد") });
    }
    return results;
  }

  // قفل دوباره: اگر برنامه بیش از ۳۰ ثانیه در پس‌زمینه بماند، با برگشت دوباره قفل می‌شود
  // (ساعت عقب‌رفته یا زمان نامعتبر هم یعنی قفل)
  const lockCfgRef = useRef(false);
  lockCfgRef.current = !!(settings.pinHash || settings.pin || settings.biometricEnabled);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener; let cancelled = false; let leftAt = 0;
    CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) { leftAt = Date.now(); return; }
      if (!leftAt || !lockCfgRef.current) return;
      const away = Date.now() - leftAt; leftAt = 0;
      if (!(away >= 0 && away < RELOCK_AFTER_MS)) setUnlocked(false);
    }).then((l) => { if (cancelled) l.remove?.(); else listener = l; }).catch(() => {});
    return () => { cancelled = true; listener?.remove?.(); };
  }, []);

  // دکمه‌ی برگشت اندروید: فقط یک شنونده‌ی ثابت ثبت می‌شود و آخرین state را از ref می‌خواند
  // (قبلاً با هر تغییر state دوباره و به‌صورت async ثبت می‌شد و شنونده‌های هم‌زمان می‌ماند)
  const backStateRef = useRef({});
  backStateRef.current = { showExit, showAdd, showQuickAdd, showCapture, menuOpen, subView, tab, showAlarms, showNoteModal, showReminderModal, performExit };
  const exitingRef = useRef(false);
  useEffect(() => {
    if (!loaded || !Capacitor.isNativePlatform()) return;
    let cancelled = false, handle = null;
    CapacitorApp.addListener("backButton", async () => {
      const st = backStateRef.current;
      const stack = window.__rexaBack || [];
      const topOverlay = stack[stack.length - 1];
      if (topOverlay) { topOverlay(); return; }
      if (st.showExit) { setShowExit(false); return; }
      if (st.showAlarms) { setShowAlarms(false); return; }
      if (st.showNoteModal) { setShowNoteModal(false); return; }
      if (st.showReminderModal) { setShowReminderModal(false); return; }
      if (st.showAdd) { setShowAdd(false); setPrefillTx(null); return; }
      if (st.showQuickAdd) { setShowQuickAdd(false); return; }
      if (st.showCapture) { setShowCapture(false); return; }
      if (st.menuOpen) { setMenuOpen(false); return; }
      if (st.subView) { setSubView(null); return; }
      if (st.tab !== "home") { setTab("home"); return; }
      if (exitingRef.current) return;   // پرسش خروج دوبار نمایش داده نشود
      exitingRef.current = true;
      try { st.performExit(); } finally { exitingRef.current = false; }
    }).then((h) => { if (cancelled) h.remove?.(); else handle = h; }).catch(() => {});
    return () => { cancelled = true; handle?.remove?.(); };
  }, [loaded]);

  const registerVoiceTransaction = useCallback((transcript) => {
    const parsed = parseBankSms(transcript, { voice: true });
    if (!parsed.amount) { alert("مبلغ تشخیص داده نشد. مثال: «امروز ۳۵۰ هزار تومان برای شام دادم»."); return; }
    const activeAccounts = accounts.filter((a) => a.active !== false);
    if (!activeAccounts.length) { alert("برای ثبت صوتی ابتدا یک حساب بسازید."); return; }
    // بیش از یک حساب: حساب را خود کاربر انتخاب می‌کند (فرم ثبت با مبلغ و نوع پر‌شده باز می‌شود)؛ بی‌سؤال به حساب اول نمی‌رود
    if (activeAccounts.length > 1 || parsed.scaleGuessed) {
      setPrefillTx({ type: parsed.type, amount: parsed.amount, note: `ثبت صوتی: ${parsed.note}`, categoryHint: parsed.categoryHint, tags: ["ثبت صوتی"] });
      setShowAdd(true);
      return;
    }
    const sameKind = categories.filter((c) => c.kind === parsed.type);
    const hinted = parsed.categoryHint ? sameKind.find((c) => c.name === parsed.categoryHint) : null;
    const fallback = sameKind.find((c) => c.name === (parsed.type === "expense" ? "متفرقه" : "درآمد متفرقه")) || sameKind[0];
    addTransaction({ type: parsed.type, amount: parsed.amount, categoryId: hinted?.id || fallback?.id || "", accountId: activeAccounts[0].id, date: todayISO(), note: `ثبت صوتی: ${parsed.note}`, tags: ["ثبت صوتی"] });
    alert(`${toFaInt(parsed.amount)} ریال بابت «${hinted?.name || fallback?.name || "بدون دسته"}» ثبت شد.`);
  }, [categories, accounts]);
  const t = THEME[settings.theme] || THEME.light;
  // BRAND یک شیء مشترک است؛ فقط وقتی رنگ تم عوض می‌شود (نه در هر رندر) مقداردهی می‌شود و قبل از رندر فرزندان انجام می‌شود.
  // کلید روی ظرف اصلی (themeColorKey) باعث می‌شود همه‌ی اجزا — حتی آن‌هایی که دوباره رندر نمی‌شدند — با رنگ تازه ساخته شوند.
  const themeColorKey = COLOR_PRESETS[settings.themeColor] ? settings.themeColor : "purple";
  useMemo(() => { Object.assign(BRAND, COLOR_PRESETS[themeColorKey]); return themeColorKey; }, [themeColorKey]);

  if (dailySplash) return <DailySentenceSplash onDone={() => setDailySplash(false)} />;
  if (loadError) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: BRAND.header, fontFamily: FONT, padding: 24, textAlign: "center" }}>
        <RexaLogo size={72} showWordmark />
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>خواندن اطلاعات از حافظه‌ی برنامه ممکن نشد</div>
        <div style={{ color: "#d8c9e8", fontSize: 12.5, lineHeight: 1.9, maxWidth: 320 }}>برای محافظت از اطلاعاتت، برنامه چیزی روی داده‌های قبلی نمی‌نویسد. دوباره تلاش کن؛ اگر مشکل ادامه داشت برنامه را کامل ببند و دوباره باز کن (برنامه را حذف نکن).</div>
        <div style={{ color: "#b9a6cf", fontSize: 11, direction: "ltr", maxWidth: 320, wordBreak: "break-word" }}>{loadError}</div>
        <button onClick={initialLoad} style={{ background: BRAND.gold, color: "#241a30", border: "none", borderRadius: 12, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>تلاش دوباره</button>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: BRAND.header, fontFamily: FONT }}>
        <RexaLogo size={84} showWordmark />
        <div style={{ color: "#d8c9e8", fontSize: 13 }}>در حال بارگذاری...</div>
      </div>
    );
  }
  if ((settings.pinHash || settings.pin || settings.biometricEnabled) && !unlocked) {
    return <LockScreen pin={settings.pin} pinHash={settings.pinHash} pinSalt={settings.pinSalt} onUnlock={() => setUnlocked(true)} biometricEnabled={(!!(settings.pinHash || settings.pin) || !!settings.biometricEnabled) && !settings.biometricDisabled} />;
  }

  function openWithPrefill(data) {
    setPrefillTx(data);
    setShowAdd(true);
  }

  async function rebuildData() {
    if (!window.confirm("بازسازی اطلاعات انجام شود؟ قبل از بازسازی یک پشتیبان خودکار تهیه می‌شود.")) return;
    if ((await exportBackup()) === false && !window.confirm("پشتیبان ساخته نشد. بدون پشتیبان ادامه بدهم؟")) return;
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
    if ((await exportBackup()) === false && !window.confirm("پشتیبان ساخته نشد. بدون پشتیبان ادامه بدهم؟")) return;
    if (!window.confirm("تأیید نهایی: اطلاعات مالی این دستگاه خام شود؟ این عملیات پس از اجرا با پشتیبان قابل بازگردانی است.")) return;
    setAccounts(seedAccounts()); setCategories(seedCategories()); setTransactions([]); setBudgets([]); setLoans([]); setChecks([]);
    setBills([]); setAssets([]); setRecurring([]); setFavorites({ categories: [], accounts: [] }); setMembers([]); setEvents([]);
    setProjects([]); setFiscalPeriods([]); setNotes([]); setReminders([]); setPersons([]); setDebts([]); setCurrencies([]); setGoals([]);
    alert("اطلاعات مالی خام شد. پشتیبان قبلی را در صورت نیاز بازیابی کنید.");
  }


  const ctx = {
    accounts, addAccount, deleteAccount, updateAccount, accountBalance, accountEditTarget, setAccountEditTarget, focusId, setFocusId,
    categories, addCategory, deleteCategory, updateCategory, moveCategory,
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
      <div key={themeColorKey} dir="rtl" onClick={handleTripleTap} style={{ fontFamily: FONT, background: t.bg, color: t.text, minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 0 30px rgba(0,0,0,0.08)", zoom: settings.fontScale || 1 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; } html, body, #root { margin: 0; min-height: 100%; width: 100%; } body { overflow-x: hidden; overscroll-behavior-y: none; }
          input, select, textarea, button { font-family: inherit; }
          ::-webkit-scrollbar { width: 0; height: 0; }
          @media print { .no-print { display: none !important; } }
        `}</style>

        {subView ? (
          <Header title={SUBVIEW_TITLES[subView]} back onBack={() => setSubView(null)} onBell={openBell} alarmCount={alarms.length} />
        ) : (
          <Header title={settings.profile?.name || "Rexa"} onMenu={() => setMenuOpen(true)}
            onMic={registerVoiceTransaction} onBell={openBell} alarmCount={alarms.length} />
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
                incomeCashYear={incomeCashYear} expenseCashYear={expenseCashYear} expenseTree={expenseTree} incomeTree={incomeTree}
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
                onRunShortcut={(sc) => { setShowQuickAdd(false); setShowAdd(true); setPrefillTx({ type: sc.type, categoryId: sc.categoryId, accountId: sc.accountId, fromCategoryId: sc.fromCategoryId || undefined, note: sc.note || `میانبر: ${sc.name}`, _shortcutId: sc.id }); }}
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
            {tab === "checks" && <ChecksManager checks={checks} setChecks={setChecks} accounts={accounts} categories={categories} addCategory={addCategory} setTransactions={setTransactions} focusId={focusId} setFocusId={setFocusId} />}
            {tab === "reports" && (
              <ReportsView
                expenseByCategory={expenseByCategory} incomeByCategory={incomeByCategory}
                totalIncomeYear={totalIncomeYear} totalExpenseYear={totalExpenseYear}
                accounts={accounts} accountBalance={accountBalance}
                netWorthTrend={netWorthTrend} exportExcel={exportExcel}
                expenseByMember={expenseByMember} expenseByEvent={expenseByEvent} expenseByProject={expenseByProject}
                categories={categories} checks={checks} debts={debts} totalAssets={totalAssets} currency={settings.currency} usdRate={rates?.usd}
                transactions={transactions} updateAccount={updateAccount}
                members={members} events={events} projects={projects} loans={loans} assets={assets} bills={bills} recurring={recurring}
                openItem={(view, id) => { setFocusId(id); setSubView(view); }}
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
              // میانبر: حسابی که این بار انتخاب شد، دفعه‌ی بعد پیش‌فرض همان میانبر می‌شود
              if (prefillTx?._shortcutId) setShortcuts((p) => p.map((x) => x.id === prefillTx._shortcutId ? { ...x, accountId: tx.accountId || "", fromCategoryId: tx.fromCategoryId || "" } : x));
              setShowAdd(false); setPrefillTx(null);
            }}
          />
        )}
        {showAlarms && <AlarmsSheet items={alarms} onClose={() => setShowAlarms(false)} onOpen={openAlarm} notifBlocked={notifBlocked} onEnableNotif={enableNotif}
          onDoneReminder={(id) => setReminders((p) => p.map((r) => r.id === id ? { ...r, done: true } : r))} />}
        {showExit && <ExitSheet cloudReady={syncReady(cloud.cfg)} onBackup={runExitBackup} onExit={exitNow} onClose={() => setShowExit(false)} />}
        {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} setSubView={(v) => { setSubView(v); setMenuOpen(false); }} profileName={settings.profile?.name} />}
      </div>
    </ThemeCtx.Provider>
  );
}
