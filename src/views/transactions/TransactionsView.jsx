import { useMemo, useState } from "react";
import {
  ArrowLeftRight, FileSpreadsheet, Pencil, Search, Trash2, TrendingDown, TrendingUp,
} from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { StatusBadge } from "../../components/common/StatusBadge.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { faLongDate } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { TransactionSummaryChart } from "./TransactionSummaryChart.jsx";

/* خط منحنیِ پایین کادر: وسطش کمی به پایین فرو می‌رود؛ لمس کل این خط جزئیات را باز/بسته می‌کند */
function CurveToggle({ open, onClick, color }) {
  const t = useT();
  return (
    <div onClick={onClick} role="button" aria-label={open ? "بستن جزئیات" : "نمایش جزئیات"} style={{ margin: "10px -14px -14px", height: 22, cursor: "pointer", position: "relative", WebkitTapHighlightColor: "transparent" }}>
      <svg viewBox="0 0 100 22" preserveAspectRatio="none" width="100%" height="22" style={{ display: "block", transform: open ? "scaleY(-1)" : "none", transition: "transform .25s" }}>
        <path d="M0 3 H33 C42 3 42 15 50 15 C58 15 58 3 67 3 H100" fill="none" stroke={color || t.border} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity="0.75" />
      </svg>
    </div>
  );
}

export function TransactionsView({ transactions, catById, accById, checks = [], filter, setFilter, onDelete, onEdit, search, setSearch }) {
  const t = useT();
  const [preview, setPreview] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const checkStatusLabel = { pending: "در انتظار", cashed: "نقد شده", bounced: "برگشتی" };
  const checkPseudo = checks.map((c) => ({
    id: "chk-" + c.id, __isCheck: true, type: "check", amount: c.amount, date: c.dueDate,
    note: `چک ${c.type === "received" ? "دریافتی" : "پرداختی"} — ${c.payee}`, checkStatus: c.status,
  }));
  const combined = [...transactions, ...checkPseudo];
  const filtered = combined.filter((tx) => {
    if (filter !== "all" && tx.type !== filter) return false;
    if (search.trim()) {
      const q = search.trim();
      const hay = `${catById(tx.categoryId)?.name || ""} ${tx.note || ""} ${(tx.tags || []).join(" ")} ${tx.amount}`;
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((tx) => { (map[tx.date] = map[tx.date] || []).push(tx); });
    return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filtered]);
  const tabs = [{ key: "all", label: "همه" }, { key: "expense", label: "پرداخت ها" }, { key: "income", label: "دریافت ها" }, { key: "transfer", label: "انتقال ها" }, { key: "check", label: "چک ها" }];

  return (
    <div>
      <div style={{ padding: "10px 14px 0" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} color={t.sub} style={{ position: "absolute", top: 12, right: 12 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در تراکنش‌ها، برچسب یا یادداشت..."
            style={{ width: "100%", padding: "10px 36px 10px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13.5, outline: "none", marginBottom: 10 }} />
        </div>
      </div>
      <div style={{ display: "flex", background: BRAND.header, padding: "0 8px 12px", gap: 4 }}>
        {tabs.map((tItem) => (
          <button key={tItem.key} onClick={() => setFilter(tItem.key)} style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, cursor: "pointer", background: filter === tItem.key ? "rgba(255,255,255,0.18)" : "transparent", color: "#fff", fontWeight: filter === tItem.key ? 700 : 500, fontSize: 12.5 }}>{tItem.label}</button>
        ))}
      </div>
      <div style={{ padding: "12px 14px" }}>
        {grouped.length === 0 && <EmptyRow text="تراکنشی یافت نشد" />}
        {grouped.map(([date, txs]) => {
          const dayTotal = txs.reduce((s, tx) => s + (tx.type === "expense" ? -tx.amount : tx.type === "income" ? tx.amount : 0), 0);
          return (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: t.sub, fontWeight: 600 }}>{faLongDate(new Date(date))}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: dayTotal >= 0 ? BRAND.darkgreen : BRAND.crimson }}>{dayTotal >= 0 ? "+" : "-"}{toFaInt(Math.abs(dayTotal))} ریال</span>
              </div>
              {txs.map((tx) => {
                if (tx.__isCheck) {
                  const statusColor2 = { pending: BRAND.gold, cashed: BRAND.darkgreen, bounced: BRAND.crimson }[tx.checkStatus];
                  return (
                    <div key={tx.id} style={{ background: t.card, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: `1px dashed ${statusColor2}55` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ width: 38, height: 38, borderRadius: 10, background: statusColor2 + "22", color: statusColor2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileSpreadsheet size={18} /></span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{tx.note}</div>
                            <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>سررسید چک — <StatusBadge text={checkStatusLabel[tx.checkStatus]} color={statusColor2} /></div>
                          </div>
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 800, color: statusColor2, fontSize: 14.5 }}>{toFaInt(tx.amount)}</div>
                        </div>
                      </div>
                      {expandedId === tx.id && (() => {
                        const c = checks.find(x => x.id === tx.id.replace("chk-", ""));
                        return c ? <div style={{ marginTop: 10, padding: 10, borderRadius: 9, background: "#f8f6fa", fontSize: 11.5 }}>
                          {[
                            ["نوع", c.type === "received" ? "چک دریافتی" : "چک پرداختی"],
                            ["طرف حساب", c.payee || "—"], ["مبلغ", `${toFaInt(c.amount)} ریال`],
                            ["شناسه صیادی", c.sayadId || "—"], ["شماره چک", c.checkNumber || "—"],
                            ["حساب", accById(c.accountId)?.name || "—"], ["سررسید", c.dueDate ? faLongDate(new Date(c.dueDate)) : "—"],
                            ["وضعیت", checkStatusLabel[c.status] || "—"], ["یادداشت", c.note || "—"]
                          ].map(([k,v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.sub }}>{k}</span><strong>{v}</strong></div>)}
                        </div> : null;
                      })()}
                      <CurveToggle open={expandedId === tx.id} onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} color={statusColor2} />
                    </div>
                  );
                }
                const cat = catById(tx.categoryId), acc = accById(tx.accountId), toAcc = accById(tx.toAccountId);
                const color = tx.type === "expense" ? BRAND.crimson : tx.type === "income" ? BRAND.darkgreen : BRAND.violet;
                const Icon = tx.type === "expense" ? TrendingDown : tx.type === "income" ? TrendingUp : ArrowLeftRight;
                return (
                  <div key={tx.id} style={{ background: t.card, borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ width: 38, height: 38, borderRadius: 10, background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={18} /></span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{tx.type === "transfer" ? `انتقال به ${toAcc?.name || "—"}` : (cat?.name || "بدون دسته")}</div>
                          <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>{tx.type === "expense" ? "از حساب" : tx.type === "income" ? "به حساب" : "از حساب"}: {acc?.name || catById(tx.fromCategoryId)?.name || "—"}</div>
                          {tx.note && <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{tx.note}</div>}
                          {tx.loanId && <span style={{ display: "inline-block", marginTop: 4, marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: "#8a5a00", background: "rgba(245,158,11,.16)", borderRadius: 10, padding: "1px 8px" }}>{tx.loanRole === "receipt" ? "دریافت وام" : "قسط وام"}</span>}
                          {tx.side && <span style={{ display: "inline-block", marginTop: 4, fontSize: 10.5, fontWeight: 700, color: BRAND.violet, background: "rgba(88,39,119,.10)", borderRadius: 10, padding: "1px 8px" }}>{tx.side === "debtor" ? "بدهکار" : "بستانکار"}</span>}
                          {(tx.tags || []).length > 0 && (
                            <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                              {tx.tags.map((tag, i) => <span key={i} style={{ fontSize: 10.5, background: t.border, color: t.sub, padding: "2px 8px", borderRadius: 20 }}>{tag}</span>)}
                            </div>
                          )}
                          {tx.photo && <img src={tx.photo} onClick={() => setPreview(tx.photo)} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", marginTop: 6, cursor: "pointer" }} />}
                        </div>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 800, color, fontSize: 14.5 }}>{toFaInt(tx.amount)}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                          <button onClick={() => onEdit?.(tx)} style={{ background: "none", border: "none", color: BRAND.violet, cursor: "pointer", padding: 3 }} title="ویرایش"><Pencil size={15} /></button>
                          <button onClick={() => { if (window.confirm("این تراکنش حذف شود؟")) onDelete(tx.id); }} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer", padding: 3 }} title="حذف"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                    {expandedId === tx.id && (
                      <div style={{ marginTop: 10, padding: 11, borderRadius: 10, background: "#f8f6fa", border: "1px solid #ebe6f0", fontSize: 11.5 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>جزئیات کامل تراکنش</div>
                        {[
                          ["نوع", tx.type === "expense" ? "هزینه / پرداخت" : tx.type === "income" ? "درآمد / دریافت" : "انتقال بین حساب‌ها"],
                          ["مبلغ", `${toFaInt(tx.amount)} ریال`],
                          ["تاریخ", tx.date ? faLongDate(new Date(tx.date)) : "—"],
                          ["ساعت", tx.time || "—"],
                          ["حساب", acc?.name || "—"],
                          ["حساب مقصد", toAcc?.name || "—"],
                          ["دسته‌بندی", cat?.name || "—"],
                          ["شرح", tx.note || "—"],
                          ["برچسب‌ها", (tx.tags || []).join("، ") || "—"],
                          ["طرف حساب", tx.payee || tx.counterparty || "—"],
                          ["عضو / پروژه", tx.project || tx.member || tx.event || "—"],
                          ["منبع ثبت", tx.sourceType || "ثبت دستی"],
                          ["شناسه تراکنش", tx.id || "—"],
                          ["شناسه مرتبط", tx.sourceId || tx.loanId || tx.debtId || tx.billId || tx.assetId || "—"],
                        ].map(([k,v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: `1px solid ${t.border}` }}><span style={{ color: t.sub }}>{k}</span><strong style={{ textAlign: "left", maxWidth: "65%", wordBreak: "break-word" }}>{v}</strong></div>)}
                      </div>
                    )}
                    <CurveToggle open={expandedId === tx.id} onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)} color={color} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <TransactionSummaryChart transactions={transactions} onSelect={(kind) => setFilter(kind)} />
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, maxWidth: 480, margin: "0 auto" }}>
          <img src={preview} style={{ maxWidth: "88%", maxHeight: "70%", borderRadius: 10 }} />
        </div>
      )}
    </div>
  );
}
