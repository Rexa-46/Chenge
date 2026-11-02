import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { accountPath } from "../../domain/accountTree.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { addDays, jalaliMonthRange, todayISO } from "../../utils/dates.js";
import { toBody } from "../../utils/portal.js";

/* ---------- منطق فیلتر/جستجو (مشترک بین همه‌ی فهرست‌های تراکنش) ---------- */
const FA = "۰۱۲۳۴۵۶۷۸۹", AR = "٠١٢٣٤٥٦٧٨٩";
export const normText = (s) => String(s ?? "").replace(/[۰-۹]/g, (d) => FA.indexOf(d)).replace(/[٠-٩]/g, (d) => AR.indexOf(d)).replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[,٬\s]+/g, " ").toLowerCase().trim();
const numOf = (v) => { const n = Number(normText(v).replace(/ /g, "")); return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null; };

export const PERIODS = [["all", "همه"], ["today", "امروز"], ["7d", "۷ روز اخیر"], ["30d", "۳۰ روز اخیر"], ["month", "این ماه"], ["90d", "۹۰ روز اخیر"]];
function periodRange(p) {
  const today = todayISO();
  if (p === "today") return [today, today];
  if (p === "7d") return [addDays(today, -6), today];
  if (p === "30d") return [addDays(today, -29), today];
  if (p === "90d") return [addDays(today, -89), today];
  if (p === "month") { const r = jalaliMonthRange(today); return [r.start, r.end]; }
  return null;
}
export const hasTxFilter = (f = {}) => !!(f.period && f.period !== "all") || !!(f.type && f.type !== "all") || !!f.accountId || !!f.categoryId || f.min !== undefined && f.min !== "" || f.max !== undefined && f.max !== "";
export const hasTxQuery = (tq) => !!(String(tq?.q || "").trim() || hasTxFilter(tq?.f));

export function applyTxFilters(txs, { q = "", f = {} } = {}, { catById, accById, categories = [] } = {}) {
  const query = normText(q);
  const range = periodRange(f.period);
  let catSet = null;
  if (f.categoryId) {
    catSet = new Set([f.categoryId]); let grew = true;
    while (grew) { grew = false; categories.forEach((c) => { if (c.parentId && catSet.has(c.parentId) && !catSet.has(c.id)) { catSet.add(c.id); grew = true; } }); }
  }
  const min = numOf(f.min), max = numOf(f.max);
  return txs.filter((tx) => {
    if (f.type && f.type !== "all" && tx.type !== f.type) return false;
    if (range && (tx.date < range[0] || tx.date > range[1])) return false;
    if (f.accountId && tx.accountId !== f.accountId && tx.toAccountId !== f.accountId) return false;
    if (catSet && !catSet.has(tx.categoryId)) return false;
    const amt = Number(tx.amount || 0);
    if (min !== null && amt < min) return false;
    if (max !== null && amt > max) return false;
    if (query) {
      const hay = normText(`${catById?.(tx.categoryId)?.name || ""} ${accById?.(tx.accountId)?.name || ""} ${accById?.(tx.toAccountId)?.name || ""} ${tx.note || ""} ${(tx.tags || []).join(" ")} ${tx.payee || ""} ${tx.amount}`);
      if (!query.split(" ").every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}
export const useTxQuery = (key) => usePersistedState(`txq:${key}`, { q: "", f: {} });

/* ---------- نوار گوشه‌ی چپ: آیکن جستجو و آیکن فیلتر ---------- */
export function TxToolbar({ tq, setTq, accounts = [], categories = [], hide = [], style }) {
  const t = useT();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const q = tq?.q || "", f = tq?.f || {};
  const filterOn = hasTxFilter(f);
  const showSearch = searchOpen || !!q;
  const iconBtn = (on) => ({ position: "relative", width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${on ? BRAND.header : t.border}`, background: on ? "rgba(62,20,97,.10)" : t.card, color: on ? BRAND.header : t.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 });
  return (
    <div style={style}>
      {/* در صفحه‌ی راست‌به‌چپ، flex-end یعنی گوشه‌ی چپ */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
        {showSearch && (
          <div style={{ flex: 1, position: "relative" }}>
            <input autoFocus={searchOpen && !q} value={q} onChange={(e) => setTq((p) => ({ ...p, q: e.target.value }))} placeholder="جستجو: دسته، حساب، یادداشت، برچسب، مبلغ..." style={{ width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", fontSize: 13, outline: "none" }} />
            <button type="button" onClick={() => { setTq((p) => ({ ...p, q: "" })); setSearchOpen(false); }} aria-label="بستن جستجو" style={{ position: "absolute", left: 6, top: 7, border: 0, background: "transparent", color: t.sub, padding: 2, display: "flex" }}><X size={16} /></button>
          </div>
        )}
        <button type="button" aria-label="جستجو" onClick={() => setSearchOpen((v) => !v)} style={iconBtn(showSearch)}><Search size={17} /></button>
        <button type="button" aria-label="فیلتر" onClick={() => setSheet(true)} style={iconBtn(filterOn)}>
          <SlidersHorizontal size={17} />
          {filterOn && <span style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: "50%", background: BRAND.crimson, border: "2px solid #fff" }} />}
        </button>
      </div>
      {sheet && <FilterSheet f={f} setF={(next) => setTq((p) => ({ ...p, f: typeof next === "function" ? next(p.f || {}) : next }))} accounts={accounts} categories={categories} hide={hide} onClose={() => setSheet(false)} />}
    </div>
  );
}

function FilterSheet({ f, setF, accounts, categories, hide, onClose }) {
  const t = useT();
  const catOptions = useMemo(() => categories.map((c) => ({ id: c.id, label: accountPath(categories, c).join(" / ") })).sort((a, b) => a.label.localeCompare(b.label, "fa")), [categories]);
  const chip = (on, label, onClick) => <button key={label} type="button" onClick={onClick} style={{ padding: "7px 12px", borderRadius: 18, border: `1.5px solid ${on ? BRAND.header : t.border}`, background: on ? BRAND.header : "transparent", color: on ? "#fff" : t.text, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>;
  const label = (txt) => <div style={{ fontWeight: 800, fontSize: 12.5, color: BRAND.header, margin: "12px 2px 7px" }}>{txt}</div>;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const field = { width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", fontSize: 13, outline: "none" };
  return toBody(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 740, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, color: t.text, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>فیلتر تراکنش‌ها</div>
          <button type="button" onClick={() => setF({})} style={{ border: 0, background: "transparent", color: BRAND.crimson, fontFamily: "inherit", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>پاک‌کردن</button>
        </div>
        {!hide.includes("period") && (<>{label("بازه‌ی زمانی")}<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{PERIODS.map(([k, l]) => chip((f.period || "all") === k, l, () => set("period", k)))}</div></>)}
        {!hide.includes("type") && (<>{label("نوع")}<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{[["all", "همه"], ["expense", "پرداخت"], ["income", "دریافت"], ["transfer", "انتقال"]].map(([k, l]) => chip((f.type || "all") === k, l, () => set("type", k)))}</div></>)}
        {!hide.includes("account") && accounts.length > 0 && (<>{label("حساب")}<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{chip(!f.accountId, "همه", () => set("accountId", undefined))}{accounts.map((a) => chip(f.accountId === a.id, a.name, () => set("accountId", a.id)))}</div></>)}
        {!hide.includes("category") && (<>{label("سرفصل / دسته (شامل زیرمجموعه‌ها)")}
          <select value={f.categoryId || ""} onChange={(e) => set("categoryId", e.target.value || undefined)} style={field}><option value="">همه</option>{catOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></>)}
        {label("مبلغ (ریال)")}
        <div style={{ display: "flex", gap: 8 }}>
          <input inputMode="numeric" value={f.min ?? ""} onChange={(e) => set("min", e.target.value)} placeholder="از" style={field} />
          <input inputMode="numeric" value={f.max ?? ""} onChange={(e) => set("max", e.target.value)} placeholder="تا" style={field} />
        </div>
        <button type="button" onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "13px 0", borderRadius: 12, border: 0, background: BRAND.header, color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>اعمال فیلتر</button>
      </div>
    </div>
  );
}
