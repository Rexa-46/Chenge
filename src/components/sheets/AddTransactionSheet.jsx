import { useState } from "react";
import { Check, Image as ImageIcon, Plus, Star, X } from "lucide-react";

import { AccountPickerField } from "../inputs/AccountPickerField.jsx";
import { AmountInput } from "../inputs/AmountInput.jsx";
import { BankAccountField } from "../inputs/BankAccountField.jsx";
import { JalaliDateInput } from "../inputs/JalaliDateInput.jsx";
import { SourceAccountField } from "../inputs/SourceAccountField.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles, miniBtn } from "../../theme/styles.js";
import { todayISO } from "../../utils/dates.js";
import { uid } from "../../utils/id.js";
import { resizeImage } from "../../utils/image.js";

export function AddTransactionSheet({ accounts, categories, favorites, members = [], events = [], projects = [], initial, onClose, onSubmit, onAddAccount, onAddCategory }) {
  const st = useStyles();
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(() => {
    if (initial?.categoryId && categories.some((c) => c.id === initial.categoryId)) return initial.categoryId;
    if (initial?.categoryHint) {
      const match = categories.find((c) => c.name === initial.categoryHint && c.kind === (initial.type || "expense"));
      if (match) return match.id;
    }
    return "";
  });
  const [accountId, setAccountId] = useState(initial?.fromCategoryId ? "" : (initial?.accountId || accounts[0]?.id || ""));
  const [fromCategoryId, setFromCategoryId] = useState(initial?.fromCategoryId || "");
  const [toAccountId, setToAccountId] = useState(initial?.toAccountId || accounts[1]?.id || accounts[0]?.id || "");
  const [date, setDate] = useState(initial?.date || todayISO());
  const [time, setTime] = useState(initial?.time || new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState(initial?.note || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [photo, setPhoto] = useState(initial?.photo || null);
  const [showMore, setShowMore] = useState(false);
  const [memberId, setMemberId] = useState(initial?.memberId || "");
  const [eventId, setEventId] = useState(initial?.eventId || "");
  const [projectId, setProjectId] = useState(initial?.projectId || "");
  const [inlineAdd, setInlineAdd] = useState(null);
  const [inlineName, setInlineName] = useState("");
  const [side, setSide] = useState(initial?.side || "");

  const twoWayPicked = !!categories.find((c) => c.id === categoryId)?.twoWay;
  const effectiveSide = side || (type === "income" ? "creditor" : "debtor");
  const filteredCats = categories.filter((c) => c.kind === type);
  const favCats = filteredCats.filter((c) => favorites.categories.includes(c.id));
  const canSubmit = amount && Number(amount) > 0 && (accountId || (type !== "transfer" && fromCategoryId)) && (type === "transfer" ? toAccountId && toAccountId !== accountId : categoryId);

  async function handlePhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    const dataUrl = await resizeImage(f);
    setPhoto(dataUrl);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 120, maxWidth: 480, margin: "0 auto", paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ background: "#fff", width: "100%", borderRadius: "18px", padding: "18px 18px 24px", maxHeight: "calc(88vh - 70px)", overflowY: "auto", boxShadow: "0 -8px 30px rgba(0,0,0,.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a8194" }}><X size={22} /></button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{initial?._editId ? "ویرایش تراکنش" : "ثبت تراکنش جدید"}</div>
          <div style={{ width: 22 }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[{ k: "expense", l: "پرداخت", c: BRAND.crimson }, { k: "income", l: "دریافت", c: BRAND.darkgreen }, { k: "transfer", l: "انتقال", c: BRAND.violet }].map((o) => (
            <button key={o.k} onClick={() => { setType(o.k); setCategoryId(""); setSide(""); if (o.k === "transfer" && !accountId) { setAccountId(accounts[0]?.id || ""); setFromCategoryId(""); } }} style={{ flex: 1, padding: "10px 4px", borderRadius: 9, border: `1.5px solid ${type === o.k ? o.c : "#e3e0ea"}`, background: type === o.k ? o.c : "#fff", color: type === o.k ? "#fff" : "#241a30", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>{o.l}</button>
          ))}
        </div>

        {favCats.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {favCats.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)} style={{ display: "flex", alignItems: "center", gap: 4, background: categoryId === c.id ? BRAND.header : "#f1eef4", color: categoryId === c.id ? "#fff" : "#3E1461", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Star size={11} fill="#f5b301" color="#f5b301" /> {c.name}
              </button>
            ))}
          </div>
        )}

        <label style={st.label}>مبلغ (ریال)</label>
        <AmountInput value={amount} onChange={setAmount} placeholder="0" style={st.input} />

        {type !== "transfer" ? (
          <>
            <label style={st.label}>حساب‌ها</label>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}><AccountPickerField categories={categories} addCategory={onAddCategory} value={categoryId} onChange={setCategoryId} st={st} /></div>
              <button type="button" onClick={() => { setInlineAdd("category"); setInlineName(""); }} style={{ ...miniBtn, width: 44, height: 44, background: BRAND.header, color: "#fff" }} title="افزودن دسته"><Plus size={18} /></button>
            </div>
            {twoWayPicked && (
              <div style={{ marginBottom: 10 }}>
                <label style={st.label}>این حساب دو طرفه است — طرف حساب</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ k: "debtor", l: "بدهکار" }, { k: "creditor", l: "بستانکار" }].map((o) => (
                    <button key={o.k} type="button" onClick={() => setSide(o.k)} style={{ flex: 1, padding: "9px 4px", borderRadius: 9, border: `1.5px solid ${effectiveSide === o.k ? BRAND.violet : "#e3e0ea"}`, background: effectiveSide === o.k ? BRAND.violet : "#fff", color: effectiveSide === o.k ? "#fff" : "#241a30", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{o.l}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#8a8194", marginTop: 5, lineHeight: 1.8 }}>مثلاً بیمه: پرداخت حق بیمه = بدهکار، دریافت خسارت = بستانکار.</div>
              </div>
            )}
            <label style={st.label}>{type === "expense" ? "از حساب" : "به حساب"}</label>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}><SourceAccountField accounts={accounts} categories={categories} accountId={accountId} fromCategoryId={fromCategoryId} onChange={(v) => { setAccountId(v.accountId); setFromCategoryId(v.fromCategoryId); }} st={st} title={type === "expense" ? "از حساب" : "به حساب"} /></div>
              <button onClick={() => { setInlineAdd("account"); setInlineName(""); }} style={{ ...miniBtn, width: 44, height: 44, background: BRAND.violet, color: "#fff" }}><Plus size={18} /></button>
            </div>
            {inlineAdd && <div style={{ background: "#f7f4fa", borderRadius: 10, padding: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{inlineAdd === "category" ? "دسته جدید" : "حساب جدید"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input autoFocus value={inlineName} onChange={(e) => setInlineName(e.target.value)} placeholder={inlineAdd === "category" ? "نام دسته" : "نام حساب"} style={{ ...st.input, margin: 0, flex: 1 }} />
                <button onClick={() => {
                  if (!inlineName.trim()) return;
                  const id = uid();
                  if (inlineAdd === "category") { onAddCategory?.({ id, name: inlineName.trim(), kind: type }); setCategoryId(id); }
                  else { onAddAccount?.({ id, name: inlineName.trim(), type: "bank", initial: 0 }); setAccountId(id); setFromCategoryId(""); }
                  setInlineAdd(null);
                }} style={{ ...st.primaryBtn, width: "auto", padding: "0 14px" }}>افزودن</button>
              </div>
            </div>}
          </>
        ) : (
          <>
            <label style={st.label}>از حساب</label>
            <BankAccountField accounts={accounts} value={accountId} onChange={setAccountId} st={st} />
            <label style={st.label}>به حساب</label>
            <BankAccountField accounts={accounts} value={toAccountId} onChange={setToAccountId} st={st} />
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 8, alignItems: "end" }}>
          <div><label style={st.label}>تاریخ</label><JalaliDateInput value={date} onChange={(v) => setDate(v)} style={st.input} /></div>
          <div><label style={st.label}>ساعت</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...st.input, direction: "ltr", textAlign: "center" }} /></div>
        </div>

        <label style={st.label}>برچسب‌ها (با کاما جدا کنید)</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="مثلا: سفر, ضروری" style={st.input} />

        <label style={st.label}>یادداشت (اختیاری)</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="توضیحات..." style={st.input} />

        <label style={st.label}>پیوست عکس (اختیاری)</label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px dashed #d8d2e0", borderRadius: 9, padding: "10px 12px", cursor: "pointer", marginBottom: 12, fontSize: 13, color: "#8a8194" }}>
          <ImageIcon size={16} /> {photo ? "عکس انتخاب شد ✓" : "افزودن عکس رسید"}
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </label>
        {photo && <img src={photo} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", marginBottom: 12 }} />}

        {(members.length > 0 || events.length > 0 || projects.length > 0) && (
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => setShowMore((v) => !v)} style={{ background: "none", border: "none", color: BRAND.header, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0, marginBottom: showMore ? 10 : 0 }}>
              {showMore ? "بستن جزئیات بیشتر ▲" : "افزودن عضو / رویداد / پروژه ▼"}
            </button>
            {showMore && (
              <>
                {members.length > 0 && (<>
                  <label style={st.label}>عضو خانواده</label>
                  <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={st.input}>
                    <option value="">— بدون عضو —</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </>)}
                {events.length > 0 && (<>
                  <label style={st.label}>رویداد</label>
                  <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={st.input}>
                    <option value="">— بدون رویداد —</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </>)}
                {projects.length > 0 && (<>
                  <label style={st.label}>پروژه</label>
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={st.input}>
                    <option value="">— بدون پروژه —</option>
                    {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                  </select>
                </>)}
              </>
            )}
          </div>
        )}

        <button disabled={!canSubmit}
          onClick={() => onSubmit({
            ...(initial?._editId ? { _editId: initial._editId } : {}),
            type, amount: Number(amount), categoryId, accountId, fromCategoryId: type !== "transfer" && fromCategoryId ? fromCategoryId : undefined,
            toAccountId: type === "transfer" ? toAccountId : undefined,
            side: twoWayPicked ? effectiveSide : undefined,
            date, time, note, photo: photo || undefined,
            tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
            memberId: memberId || undefined, eventId: eventId || undefined, projectId: projectId || undefined,
          })}
          style={{ ...st.primaryBtn, opacity: canSubmit ? 1 : 0.5, marginTop: 6 }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Check size={17} /> ثبت تراکنش</span>
        </button>
      </div>
    </div>
  );
}
