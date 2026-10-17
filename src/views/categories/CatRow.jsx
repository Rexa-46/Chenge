import { useState } from "react";
import { ArrowLeftRight, Check, Pencil, Plus, Star, Trash2, X } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";

export function CatRow({ c, onDelete, onUpdate, fav, onFav, onAddSub, isSub, onTwoWay }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(c.name);
  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px", borderBottom: `1px solid ${t.border}` }}>
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontSize: 13 }} />
        <button onClick={() => { if (val.trim()) onUpdate(c.id, { name: val.trim() }); setEditing(false); }} style={{ background: BRAND.green, border: "none", borderRadius: 7, color: "#fff", padding: "6px 10px", cursor: "pointer" }}><Check size={14} /></button>
        <button onClick={() => { setVal(c.name); setEditing(false); }} style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}><X size={14} /></button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: isSub ? 13 : 14, fontWeight: isSub ? 500 : 600, color: isSub ? t.sub : t.text }}>{isSub && "↳ "}{c.name}{c.twoWay && <span style={{ marginRight: 6, fontSize: 10.5, fontWeight: 700, color: BRAND.violet, background: "rgba(88,39,119,.10)", borderRadius: 10, padding: "1px 7px" }}>↔ دو طرفه</span>}</span>
      <div style={{ display: "flex", gap: 8 }}>
        {onTwoWay && <button onClick={onTwoWay} title="دو طرفه (هم بدهکار هم بستانکار)" style={{ background: "none", border: "none", cursor: "pointer", color: c.twoWay ? BRAND.violet : t.sub, opacity: c.twoWay ? 1 : 0.55 }}><ArrowLeftRight size={15} /></button>}
        <button onClick={onFav} style={{ background: "none", border: "none", cursor: "pointer" }}><Star size={15} fill={fav ? "#f5b301" : "none"} color="#f5b301" /></button>
        <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: BRAND.violet, cursor: "pointer" }}><Pencil size={15} /></button>
        {onAddSub && <button onClick={onAddSub} style={{ background: "none", border: "none", color: BRAND.green, cursor: "pointer" }}><Plus size={15} /></button>}
        <button onClick={() => onDelete(c.id)} style={{ background: "none", border: "none", color: BRAND.crimson, cursor: "pointer" }}><Trash2 size={15} /></button>
      </div>
    </div>
  );
}
