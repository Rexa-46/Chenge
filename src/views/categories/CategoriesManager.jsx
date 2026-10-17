import { useState } from "react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { DEBT_GROUPS } from "../../domain/accountTree.js";
import { useStyles } from "../../theme/styles.js";
import { CatRow } from "./CatRow.jsx";

export function CategoriesManager({ categories, addCategory, deleteCategory, updateCategory, favorites, toggleFavorite }) {
  const st = useStyles();
  const [name, setName] = useState(""); const [kind, setKind] = useState("expense");
  const [subFormFor, setSubFormFor] = useState(null);
  const [subName, setSubName] = useState("");
  const topLevel = (list) => list.filter((c) => !c.parentId);
  const childrenOf = (id) => categories.filter((c) => c.parentId === id);
  const groupDefs = [
    { kind: "expense", label: "هزینه‌ها" }, { kind: "income", label: "درآمدها" },
    { kind: "fund", label: "صندوق‌ها" }, { kind: "bank", label: "بانک‌ها و کارت‌ها" },
    { kind: "asset", label: "دارائی‌ها" }, { kind: "liability", label: "بدهی‌ها" },
    { kind: "person", label: "اشخاص" }, { kind: "receivable", label: "بدهکاران" },
    { kind: "payable", label: "بستانکاران" }, { kind: "capital", label: "سرمایه" }, { kind: "other", label: "غیره" },
  ];

  function addSub(parentId, parentKind) {
    if (!subName.trim()) return;
    addCategory({ name: subName.trim(), kind: parentKind, parentId });
    setSubName(""); setSubFormFor(null);
  }

  function renderGroup(list) {
    return list.map((c) => (
      <div key={c.id}>
        <CatRow c={c} onDelete={deleteCategory} onUpdate={updateCategory} fav={favorites.categories.includes(c.id)} onFav={() => toggleFavorite("categories", c.id)}
          onAddSub={() => setSubFormFor(subFormFor === c.id ? null : c.id)} onTwoWay={() => updateCategory(c.id, { twoWay: !c.twoWay })} />
        {childrenOf(c.id).map((sub) => (
          <div key={sub.id} style={{ paddingRight: 22 }}>
            <CatRow c={sub} isSub onDelete={deleteCategory} onUpdate={updateCategory} fav={favorites.categories.includes(sub.id)} onFav={() => toggleFavorite("categories", sub.id)} />
          </div>
        ))}
        {subFormFor === c.id && (
          <div style={{ display: "flex", gap: 6, padding: "8px 4px 8px 22px" }}>
            <input autoFocus placeholder={`زیرمجموعه‌ی ${c.name}`} value={subName} onChange={(e) => setSubName(e.target.value)} style={{ ...st.input, margin: 0, flex: 1 }} />
            <button onClick={() => addSub(c.id, c.kind)} style={{ ...st.primaryBtn, width: "auto", padding: "0 16px" }}>افزودن</button>
          </div>
        )}
      </div>
    ));
  }

  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>افزودن سرفصل حساب</div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={st.input}>
          {groupDefs.map(g => <option key={g.kind} value={g.kind}>{g.label}</option>)}
        </select>
        <input placeholder="نام سرفصل" value={name} onChange={(e) => setName(e.target.value)} style={st.input} />
        <button onClick={() => { if (!name.trim()) return; addCategory({ name: name.trim(), kind }); setName(""); }} style={st.primaryBtn}>افزودن</button>
      </div>
      <div style={{ fontSize: 11.5, color: "#8a8194", margin: "0 4px 12px", lineHeight: 1.9 }}>هر سرفصل می‌تواند زیرمجموعه داشته باشد؛ مثلاً خودرو ← بنزین. زیرمجموعه همان موردی است که هنگام ثبت هزینه یا درآمد انتخاب می‌شود.</div>
      {groupDefs.map((g) => {
        const rows = topLevel(categories.filter(c => c.kind === g.kind || (c.twoWay && DEBT_GROUPS.includes(g.kind))));
        return <div key={g.kind}>
          <SectionTitle text={g.label} />
          <div style={{ ...st.card, padding: "4px 12px", marginBottom: 16 }}>
            {rows.length === 0 ? <EmptyRow text={`هنوز ${g.label} ثبت نشده`} /> : renderGroup(rows)}
          </div>
        </div>;
      })}
    </div>
  );
}
