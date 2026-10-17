import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles, miniBtn } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";
import { uid } from "../../utils/id.js";

export function CurrenciesManager({ currencies, setCurrencies }) {
  const st = useStyles();
  const defaults = [{ code: "IRR", name: "ریال", rate: 1 }, { code: "USD", name: "دلار", rate: "" }, { code: "EUR", name: "یورو", rate: "" }, { code: "AED", name: "درهم", rate: "" }, { code: "GBP", name: "پوند", rate: "" }];
  const [form, setForm] = useState({ code: "", name: "", rate: "" });
  const list = currencies.length ? currencies : defaults;
  function add() { if (!form.code || !form.name) return; setCurrencies((p) => [...p, { id: uid(), code: form.code.toUpperCase(), name: form.name, rate: Number(form.rate || 0) }]); setForm({ code: "", name: "", rate: "" }); }
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}><div style={{ fontWeight: 800, marginBottom: 10 }}>واحدهای پولی و نرخ تبدیل</div><input placeholder="کد ارز مثل USD" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={st.input}/><input placeholder="نام ارز" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={st.input}/><AmountInput placeholder="نرخ هر واحد به ریال" value={form.rate} onChange={(v) => setForm({ ...form, rate: v })} style={st.input}/><button onClick={add} style={st.primaryBtn}>افزودن ارز</button></div>
    <div style={{ ...st.card, padding: "4px 12px" }}>{list.map((c, i) => <Row key={c.id || c.code} title={`${c.name} (${c.code})`} value={c.code === "IRR" ? "۱" : c.rate ? `${toFaInt(c.rate)} ریال` : "نرخ ثبت نشده"} valueColor={BRAND.header} extra={i >= defaults.length ? <button onClick={() => setCurrencies((p) => p.filter((x) => x.id !== c.id))} style={{ ...miniBtn, color: BRAND.crimson }}><Trash2 size={13}/></button> : null} chevron={null} />)}</div>
  </div>;
}
