import { useState } from "react";
import { Check, ChevronLeft, FolderInput, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";

import { EmptyRow } from "../common/EmptyRow.jsx";
import { ACCOUNT_GROUPS, accountPath, DEBT_GROUPS, faKey } from "../../domain/accountTree.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";
import { MoveCategorySheet } from "./MoveCategorySheet.jsx";

export function AccountsTree({ categories = [], transactions = [], addCategory, deleteCategory, updateCategory, moveCategory, favorites, toggleFavorite, mode = "manage", value, onPick, selectable, onBlocked, defaultExpanded }) {
  const st = useStyles();
  const t = useT();
  const picking = mode === "pick";
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded || {});
  const [addFor, setAddFor] = useState(null);
  const [addName, setAddName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newKind, setNewKind] = useState("expense");
  const [newName, setNewName] = useState("");
  const [newTwoWay, setNewTwoWay] = useState(false);
  const [editTwoWay, setEditTwoWay] = useState(false);
  const [moveTarget, setMoveTarget] = useState(null);
  const favIds = favorites?.categories || [];
  const q = faKey(query);

  const hasParent = (c) => c.parentId && categories.some((x) => x.id === c.parentId);
  const childrenOf = (id) => categories.filter((c) => c.parentId === id);
  const rootsOf = (kind) => categories.filter((c) => !hasParent(c) && (c.kind === kind || (c.twoWay && DEBT_GROUPS.includes(kind))));
  // جمع بدهکار / بستانکار یک حساب دو طرفه (به‌همراه زیرمجموعه‌هایش)
  const twoWayTotals = (c) => {
    const ids = new Set([c.id, ...categories.filter((x) => x.parentId === c.id).map((x) => x.id)]);
    let debit = 0, credit = 0;
    transactions.forEach((tx) => {
      if (!ids.has(tx.categoryId)) return;
      const side = tx.side || (tx.type === "income" ? "creditor" : "debtor");
      if (side === "creditor") credit += Number(tx.amount || 0); else debit += Number(tx.amount || 0);
    });
    return { debit, credit };
  };
  const toggle = (k) => setExpanded((e) => ({ ...e, [k]: !e[k] }));

  function create(kind, parentId, name, twoWay = false) {
    const nm = String(name || "").trim(); if (!nm) return;
    const id = uid();
    addCategory?.({ id, name: nm, kind, ...(parentId ? { parentId } : {}), ...(twoWay ? { twoWay: true } : {}) });
    setExpanded((e) => ({ ...e, [parentId || `g:${kind}`]: true }));
    if (picking) onPick?.(id);
  }
  function renderAddForm(kind, parentId, depth) {
    return (
      <div style={{ display: "flex", gap: 6, padding: "8px 4px", paddingRight: 4 + depth * 18 }}>
        <input autoFocus value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="نام مورد جدید" style={{ ...st.input, margin: 0, flex: 1 }} />
        <button onClick={() => { const nm = addName; setAddName(""); setAddFor(null); create(kind, parentId, nm); }} style={{ ...st.primaryBtn, width: "auto", padding: "0 16px" }}>افزودن</button>
      </div>
    );
  }
  const smallBtn = (color) => ({ background: "none", border: "none", color, cursor: "pointer", padding: 3, display: "flex" });
  const arrowIcon = (open, color) => <ChevronLeft size={19} color={color || t.sub} style={{ transform: open ? "rotate(-90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />;

  function renderNode(c, depth, flat) {
    const kids = flat ? [] : childrenOf(c.id);
    const isOpen = !!expanded[c.id];
    const selected = picking && c.id === value;
    const locked = !!(picking && selectable && !selectable(c));   // نمایش داده می‌شود ولی قابل انتخاب نیست
    const path = flat ? accountPath(categories, c).slice(0, -1).join(" / ") : "";
    return (
      <div key={c.id}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "9px 4px", paddingRight: 4 + depth * 18, borderBottom: `1px solid ${t.border}`, background: selected ? "rgba(88,39,119,.08)" : "transparent", opacity: locked ? 0.42 : 1 }}>
          {editId === c.id ? (<>
            <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13 }} />
            <button onClick={() => { if (editVal.trim()) updateCategory?.(c.id, { name: editVal.trim(), ...(depth === 0 ? { twoWay: editTwoWay } : {}) }); setEditId(null); }} style={{ background: BRAND.green, border: "none", borderRadius: 7, color: "#fff", padding: "6px 10px", cursor: "pointer" }}><Check size={14} /></button>
            <button onClick={() => setEditId(null)} style={smallBtn(t.sub)}><X size={14} /></button>
          </>) : (<>
            <div onClick={picking ? (locked ? () => { if (kids.length) toggle(c.id); else onBlocked?.(c); } : kids.length ? () => toggle(c.id) : () => onPick?.(c.id)) : kids.length ? () => toggle(c.id) : undefined} style={{ flex: 1, minWidth: 0, cursor: picking || kids.length ? "pointer" : "default" }}>
              <div style={{ fontSize: depth ? 13 : 14, fontWeight: selected ? 800 : depth ? 500 : 600, color: t.text }}>{depth > 0 && "↳ "}{c.name}{c.twoWay && <span style={{ marginRight: 6, fontSize: 10.5, fontWeight: 700, color: BRAND.violet, background: "rgba(88,39,119,.10)", borderRadius: 10, padding: "1px 7px" }}>↔ دو طرفه</span>}</div>
              {c.twoWay && !picking && !flat && (() => { const tt = twoWayTotals(c); return (tt.debit || tt.credit) ? <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>بدهکار: {toFaInt(tt.debit)} · بستانکار: {toFaInt(tt.credit)} · مانده: {toFaInt(Math.abs(tt.debit - tt.credit))} {tt.debit >= tt.credit ? "بدهکار" : "بستانکار"}</div> : null; })()}
              {flat && path && <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{path}</div>}
            </div>
            {selected && <Check size={16} color={BRAND.darkgreen} />}
            {!picking && toggleFavorite && <button onClick={() => toggleFavorite("categories", c.id)} style={smallBtn("#f5b301")}><Star size={15} fill={favIds.includes(c.id) ? "#f5b301" : "none"} color="#f5b301" /></button>}
            {!picking && <button onClick={() => { setEditId(c.id); setEditVal(c.name); setEditTwoWay(!!c.twoWay); }} style={smallBtn(BRAND.violet)}><Pencil size={15} /></button>}
            {!picking && moveCategory && <button onClick={() => setMoveTarget(c)} title="انتقال به سرفصل دیگر" style={smallBtn(BRAND.teal || BRAND.violet)}><FolderInput size={15} /></button>}
            {!selectable && <button onClick={() => { setAddFor(addFor?.parentId === c.id ? null : { kind: c.kind, parentId: c.id }); setAddName(""); setExpanded((e) => ({ ...e, [c.id]: true })); }} style={smallBtn(BRAND.green)}><Plus size={15} /></button>}
            {!picking && <button onClick={() => { if (window.confirm(`«${c.name}»${childrenOf(c.id).length ? " و زیرمجموعه‌هایش" : ""} حذف شود؟`)) deleteCategory?.(c.id); }} style={smallBtn(BRAND.crimson)}><Trash2 size={15} /></button>}
            {kids.length > 0 ? <button onClick={() => toggle(c.id)} style={smallBtn(t.sub)}>{arrowIcon(isOpen)}</button> : <span style={{ width: 25, flexShrink: 0 }} />}
          </>)}
        </div>
        {editId === c.id && depth === 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 12px 10px", fontSize: 12.5, fontWeight: 700, color: t.text, cursor: "pointer" }}>
            <input type="checkbox" checked={editTwoWay} onChange={(e) => setEditTwoWay(e.target.checked)} style={{ width: 18, height: 18 }} />
            دو طرفه (هم بدهکار هم بستانکار — مثل بیمه)
          </label>
        )}
        {isOpen && picking && !locked && kids.length > 0 && (
          <div onClick={() => onPick?.(c.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 4px", paddingRight: 4 + (depth + 1) * 18, borderBottom: `1px solid ${t.border}`, cursor: "pointer", color: BRAND.header, fontWeight: 800, fontSize: 12.5 }}>
            <Check size={14} /> انتخاب خودِ «{c.name}»
          </div>
        )}
        {isOpen && kids.map((k) => renderNode(k, depth + 1))}
        {addFor?.parentId === c.id && renderAddForm(c.kind, c.id, depth + 1)}
      </div>
    );
  }

  function renderGroup(g) {
    const key = `g:${g.kind}`;
    const isOpen = !!expanded[key];
    const roots = rootsOf(g.kind);
    const addingHere = addFor && addFor.kind === g.kind && !addFor.parentId;
    return (
      <div key={g.kind} style={{ ...st.card, marginBottom: 10, overflow: "hidden" }}>
        <div onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 12px", cursor: "pointer" }}>
          <span style={{ fontWeight: 800, fontSize: 14.5, color: t.text }}>{g.label}</span>
          {arrowIcon(isOpen, BRAND.header)}
        </div>
        {isOpen && (
          <div style={{ padding: "0 8px 8px", borderTop: `1px solid ${t.border}` }}>
            {roots.length === 0 && <EmptyRow text={`هنوز موردی در «${g.label}» ثبت نشده`} />}
            {roots.map((c) => renderNode(c, 0))}
            {addingHere && renderAddForm(g.kind, null, 0)}
            {!selectable && (<div onClick={() => { setAddFor(addingHere ? null : { kind: g.kind, parentId: null }); setAddName(""); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 4px", cursor: "pointer", color: BRAND.header, fontWeight: 700, fontSize: 13 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: BRAND.header, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></span>
              مورد جدید در «{g.label}»
            </div>)}
          </div>
        )}
      </div>
    );
  }

  const results = q ? categories.filter((c) => faKey(accountPath(categories, c).join(" ")).includes(q)) : [];
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={16} color={t.sub} style={{ position: "absolute", top: 13, right: 12 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو در حساب‌ها..." style={{ ...st.input, marginBottom: 0, paddingRight: 36 }} />
      </div>
      {q ? (
        <div style={{ ...st.card, padding: "4px 8px", marginBottom: 12 }}>
          {results.length === 0 ? <EmptyRow text="موردی پیدا نشد" /> : results.map((c) => renderNode(c, 0, true))}
        </div>
      ) : ACCOUNT_GROUPS.map(renderGroup)}
      {moveTarget && <MoveCategorySheet category={moveTarget} categories={categories} transactions={transactions} onClose={() => setMoveTarget(null)} onMove={(parentId, kind) => { moveCategory(moveTarget.id, parentId, kind); setMoveTarget(null); }} />}
      {!selectable && (<div style={{ ...st.card, padding: 12, marginTop: 4, border: `1.5px dashed ${t.inputBorder}`, boxShadow: "none" }}>
        <div onClick={() => setShowNew((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: BRAND.header, fontWeight: 800, fontSize: 13.5 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: BRAND.header, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={15} /></span>
          ایجاد حساب جدید
        </div>
        {showNew && (
          <div style={{ marginTop: 12 }}>
            <select value={newKind} onChange={(e) => setNewKind(e.target.value)} style={st.input}>
              {ACCOUNT_GROUPS.map((g) => <option key={g.kind} value={g.kind}>{g.label}</option>)}
            </select>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="نام حساب" style={st.input} />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12.5, fontWeight: 700, color: t.text, cursor: "pointer" }}>
              <input type="checkbox" checked={newTwoWay} onChange={(e) => setNewTwoWay(e.target.checked)} style={{ width: 18, height: 18 }} />
              دو طرفه (هم بدهکار هم بستانکار — مثل بیمه)
            </label>
            <button onClick={() => { const nm = newName, tw = newTwoWay; setNewName(""); setNewTwoWay(false); setShowNew(false); create(newKind, null, nm, tw); }} style={st.primaryBtn}>افزودن</button>
          </div>
        )}
      </div>)}
    </div>
  );
}
