import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { BRAND } from "../../theme/palette.js";
import { pillStyle, useStyles } from "../../theme/styles.js";
import { uid } from "../../utils/id.js";
import { ShortcutGlyph } from "../../components/shortcuts/ShortcutGlyph.jsx";
import { ShortcutTile } from "../../components/shortcuts/ShortcutTile.jsx";
import { SHORTCUT_ICON_KEYS, SHORTCUT_STYLES } from "../../components/shortcuts/shortcutStyles.js";

export function ShortcutsManager({ shortcuts, setShortcuts, categories, accounts }) {
  const st = useStyles();
  const [form, setForm] = useState({ name: "", type: "expense", categoryId: "", accountId: accounts[0]?.id || "", note: "", icon: "other" });
  const cats = categories.filter((c) => c.kind === form.type);
  useEffect(() => {
    if (!accounts.some(a => a.id === form.accountId)) setForm(f => ({ ...f, accountId: accounts[0]?.id || "" }));
  }, [accounts, form.accountId]);
  function add() {
    if (!form.name.trim() || !form.categoryId || !form.accountId) return;
    setShortcuts((p) => [...p, { id: uid(), ...form, name: form.name.trim() }]);
    setForm({ ...form, name: "", categoryId: "", note: "", icon: "other" });
  }
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>ساخت میانبر تراکنش</div>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلا کرایه تاکسی" style={st.input} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setForm({ ...form, type: "expense", categoryId: "" })} style={pillStyle(form.type === "expense")}>هزینه</button>
        <button onClick={() => setForm({ ...form, type: "income", categoryId: "" })} style={pillStyle(form.type === "income")}>درآمد</button>
      </div>
      <label style={st.label}>آیکن میانبر</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 10 }}>
        {SHORTCUT_ICON_KEYS.map((key) => {
          const s = SHORTCUT_STYLES[key];
          return (
            <button key={key} type="button" onClick={() => setForm({ ...form, icon: key })}
              style={{ aspectRatio: "1 / 1", borderRadius: 14, border: form.icon === key ? `2px solid ${BRAND.header}` : "2px solid transparent", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
              <ShortcutGlyph style={s} size={24} />
            </button>
          );
        })}
      </div>
      <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={st.input}>
        <option value="">دسته‌بندی را انتخاب کنید</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>)}
      </select>
      <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={st.input}>
        <option value="">حساب پیش‌فرض</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="شرح ثابت (اختیاری)" style={st.input} />
      <button onClick={add} style={st.primaryBtn}>افزودن میانبر</button>
    </div>
    <div style={{ ...st.card, padding: "16px 12px" }}>
      {shortcuts.length === 0 && <EmptyRow text="هنوز میانبری ساخته نشده" />}
      {shortcuts.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "18px 12px" }}>
        {shortcuts.map((sc) => <div key={sc.id} style={{ position: "relative" }}>
          <ShortcutTile sc={sc} />
          <button onClick={() => setShortcuts((p) => p.filter((x) => x.id !== sc.id))} aria-label="حذف میانبر" style={{ position: "absolute", top: -6, right: -4, width: 24, height: 24, borderRadius: "50%", border: "none", background: BRAND.crimson, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={12} /></button>
        </div>)}
      </div>}
    </div>
  </div>;
}
