import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { Row } from "../../components/common/Row.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles, miniBtn } from "../../theme/styles.js";
import { uid } from "../../utils/id.js";

export function PersonsManager({ persons, setPersons }) {
  const st = useStyles();
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [editing, setEditing] = useState(null);
  function save() {
    if (!form.name.trim()) return;
    if (editing) setPersons((p) => p.map((x) => x.id === editing ? { ...x, ...form, name: form.name.trim() } : x));
    else setPersons((p) => [{ id: uid(), ...form, name: form.name.trim() }, ...p]);
    setForm({ name: "", phone: "", note: "" }); setEditing(null);
  }
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>تعریف شخص / طرف حساب</div>
      <input placeholder="نام و نام خانوادگی / فروشگاه" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={st.input} />
      <input placeholder="شماره تماس" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={st.input} inputMode="tel" />
      <input placeholder="توضیحات" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={st.input} />
      <button onClick={save} style={st.primaryBtn}>{editing ? "ذخیره تغییرات" : "افزودن شخص"}</button>
    </div>
    <div style={{ ...st.card, padding: "4px 12px" }}>
      {persons.length === 0 && <EmptyRow text="شخصی ثبت نشده" />}
      {persons.map((p) => <Row key={p.id} title={p.name} subtitle={[p.phone, p.note].filter(Boolean).join(" · ") || "طرف حساب"}
        extra={<div style={{ display: "flex", gap: 5 }}><button onClick={() => { setEditing(p.id); setForm({ name: p.name, phone: p.phone || "", note: p.note || "" }); }} style={miniBtn}><Pencil size={13}/></button></div>}
        leftIcon={<Trash2 size={15}/>} leftColor={BRAND.crimson} onClick={() => setPersons((all) => all.filter((x) => x.id !== p.id))} chevron={null} />)}
    </div>
    <div style={{ fontSize: 12, color: useT().sub, marginTop: 10 }}>این بخش برای ثبت اشخاص، فروشگاه‌ها و طرف حساب‌هاست و پایه‌ی مدیریت بدهکار/بستانکار را تشکیل می‌دهد.</div>
  </div>;
}
