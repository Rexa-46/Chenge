import { useEffect, useState } from "react";
import { Pencil, RotateCcw, Star, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles, miniBtn } from "../../theme/styles.js";
import { expiryFromStored, fmtExpiry4 } from "../../utils/cardFormat.js";
import { toFaInt } from "../../utils/format.js";
import { AccountAveragePanel } from "./AccountAveragePanel.jsx";

export function AccountsManager({ accounts, addAccount, deleteAccount, updateAccount, accountBalance, favorites, toggleFavorite, initialEditAccount, setAccountEditTarget, transactions = [] }) {
  const st = useStyles();
  const t = useT();
  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [initial, setInitial] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [averageAccountId, setAverageAccountId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", initial: "", cardNumber: "", expiryDate: "" });

  useEffect(() => {
    if (!initialEditAccount) return;
    setEditingId(initialEditAccount.id);
    setEditForm({
      name: initialEditAccount.name || "",
      initial: String(initialEditAccount.initial || 0),
      cardNumber: String(initialEditAccount.cardNumber || ""),
      expiryDate: expiryFromStored(initialEditAccount.expiryDate),
    });
    setAccountEditTarget?.(null);
  }, [initialEditAccount]);

  function openEdit(a) {
    setEditingId(a.id);
    setEditForm({ name: a.name || "", initial: String(a.initial || 0), cardNumber: String(a.cardNumber || ""), expiryDate: expiryFromStored(a.expiryDate) });
  }
  function saveEdit(a) {
    if (!editForm.name.trim()) return;
    const cleanCard = editForm.cardNumber.replace(/\D/g, "").slice(0, 16);
    updateAccount?.(a.id, {
      name: editForm.name.trim(),
      initial: Number(editForm.initial || 0),
      ...(a.type === "bank" || a.type === "card" ? { cardNumber: cleanCard || undefined, cardNumberLast4: cleanCard ? cleanCard.slice(-4) : a.cardNumberLast4, expiryDate: editForm.expiryDate.trim() || undefined } : {}),
    });
    setEditingId(null);
  }
  function add() {
    if (!name.trim()) return;
    const cleanCard = cardNumber.replace(/\D/g, "").slice(0, 16);
    addAccount({ name: name.trim(), type, initial: Number(initial || 0), cardNumber: cleanCard || undefined, cardNumberLast4: cleanCard ? cleanCard.slice(-4) : undefined, expiryDate: expiryDate.trim() || undefined });
    setName(""); setInitial(""); setCardNumber(""); setExpiryDate("");
  }

  const bankAccounts = accounts.filter(a => a.type === "bank" || a.type === "card");
  function confirmDelete(a) {
    if (window.confirm(`«${a.name}» حذف شود؟\nاگر سابقه مالی داشته باشد حذف نمی‌شود و بایگانی می‌شود؛ بعداً از همین لیست می‌توانی بازگردانی‌اش کنی.`)) deleteAccount(a.id);
  }
  function restoreAccount(a) { updateAccount?.(a.id, { active: true, archivedAt: undefined }); }

  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن حساب / کارت جدید</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setType("bank")} style={pillStyle(type === "bank")}>بانک</button>
        <button onClick={() => setType("fund")} style={pillStyle(type === "fund")}>صندوق</button>
        <button onClick={() => setType("card")} style={pillStyle(type === "card")}>کارت</button>
      </div>
      <input placeholder="نام حساب" value={name} onChange={(e) => setName(e.target.value)} style={st.input} />
      <AmountInput placeholder="موجودی اولیه (ریال)" value={initial} onChange={setInitial} style={st.input} />
      {(type === "bank" || type === "card") && <>
        <KeypadInput kind="digits" digitsMax={16} placeholder="شماره کارت ۱۶ رقمی" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]).slice(0, 16))} style={st.input} inputMode="numeric" maxLength={16} />
        <KeypadInput kind="digits" digitsMax={4} placeholder="تاریخ انقضا، مثلا 04/08" value={expiryDate} onChange={(e) => setExpiryDate(fmtExpiry4(e.target.value))} style={st.input} inputMode="numeric" maxLength={5} />
      </>}
      <button onClick={add} style={st.primaryBtn}>افزودن</button>
    </div>
    <div style={{ ...st.card, padding: "4px 12px" }}>
      {accounts.length === 0 && <EmptyRow text="حسابی ثبت نشده" />}
      {accounts.map((a) => <div key={a.id} style={{ opacity: a.active === false ? 0.65 : 1 }}>
        <Row title={<>{a.name} {a.active === false && <span style={{fontSize:10,color:BRAND.crimson}}>· بایگانی</span>}</>} subtitle={`${a.type === "bank" ? "بانک" : a.type === "card" ? "کارت" : "صندوق"} · موجودی: ${toFaInt(accountBalance(a.id))} ریال`}
          extra={<div style={{ display: "flex", gap: 4 }}>
            {(a.type === "bank" || a.type === "card") && <button onClick={(e) => { e.stopPropagation(); setAverageAccountId(averageAccountId === a.id ? null : a.id); }} style={{ ...miniBtn, color: BRAND.header, fontWeight: 800, fontSize: 11, width: "auto", padding: "0 7px" }} title="معدل حساب">معدل</button>}
            <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} style={{ ...miniBtn, color: BRAND.violet }} title="ویرایش حساب"><Pencil size={13} /></button>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite("accounts", a.id); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Star size={16} fill={favorites.accounts.includes(a.id) ? "#f5b301" : "none"} color="#f5b301" /></button>
          </div>}
          leftIcon={a.active === false
            ? <span role="button" title="بازگردانی از بایگانی" onClick={(e) => { e.stopPropagation(); restoreAccount(a); }} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><RotateCcw size={15} /></span>
            : <span role="button" title="حذف حساب" onClick={(e) => { e.stopPropagation(); confirmDelete(a); }} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={15} /></span>}
          leftColor={a.active === false ? BRAND.darkgreen : BRAND.crimson} chevron={null} />
        {averageAccountId === a.id && <AccountAveragePanel account={a} transactions={transactions} accountBalance={accountBalance} onClose={() => setAverageAccountId(null)} />}
        {editingId === a.id && <div style={{ background: "#f7f4fa", borderRadius: 12, padding: 10, margin: "2px 0 10px" }}>
          <input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="نام حساب" style={{ ...st.input, marginBottom: 7 }} />
          <AmountInput value={editForm.initial} onChange={(v) => setEditForm(f => ({ ...f, initial: v }))} placeholder="موجودی اولیه" style={{ ...st.input, marginBottom: 7 }} />
          {(a.type === "bank" || a.type === "card") && <>
            <KeypadInput kind="digits" digitsMax={16} value={editForm.cardNumber} onChange={(e) => setEditForm(f => ({ ...f, cardNumber: e.target.value.replace(/[^0-9۰-۹]/g, "").replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]).slice(0, 16) }))} placeholder="شماره کارت ۱۶ رقمی" style={{ ...st.input, marginBottom: 7 }} inputMode="numeric" maxLength={16} />
            <KeypadInput kind="digits" digitsMax={4} value={editForm.expiryDate} onChange={(e) => setEditForm(f => ({ ...f, expiryDate: fmtExpiry4(e.target.value) }))} placeholder="تاریخ انقضا، مثلا 04/08" style={{ ...st.input, marginBottom: 7 }} inputMode="numeric" maxLength={5} />
          </>}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={(e) => { e.stopPropagation(); saveEdit(a); }} style={{ ...st.primaryBtn, flex: 1 }}>ذخیره اصلاحات</button>
            <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} style={{ ...st.primaryBtn, flex: 0.55, background: "#eee8f2", color: "#5c5064" }}>انصراف</button>
          </div>
        </div>}
      </div>)}
    </div>
    {bankAccounts.length > 0 && <div style={{ fontSize: 11, color: t.sub, margin: "10px 4px 0", lineHeight: 1.8 }}>دکمه «معدل» کنار هر بانک/کارت، معدل همان حساب را از روی تراکنش‌های ثبت‌شده در اپ محاسبه می‌کند.</div>}
  </div>;
}
