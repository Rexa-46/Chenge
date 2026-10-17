import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { accTypeFa } from "../../domain/reportMath.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function AccountPicker({ accounts, value, onChange, allowAll = false, label = "حساب" }) {
  const st = useStyles(); const t = useT(); const [open, setOpen] = useState(false);
  const cur = value === "__all" ? "همه حساب‌ها" : accounts.find((a) => a.id === value)?.name || "انتخاب حساب";
  const options = [...(allowAll ? [{ id: "__all", name: "همه حساب‌ها", sub: "" }] : []), ...accounts.map((a) => ({ id: a.id, name: a.name, sub: accTypeFa(a.type) }))];
  return (
    <>
      <label style={st.label}>{label}</label>
      <button type="button" onClick={() => setOpen(true)} style={{ ...st.input, textAlign: "right", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
        <span>{cur}</span><ChevronDown size={16} />
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: t.card, width: "100%", maxWidth: 480, maxHeight: "70vh", overflowY: "auto", borderRadius: "20px 20px 0 0", padding: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>انتخاب حساب (فقط یکی)</div>
            {options.map((o) => {
              const on = o.id === value;
              return (
                <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 6px", border: "none", borderBottom: `1px solid ${t.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: t.text, textAlign: "right" }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? BRAND.header : t.sub}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ width: 10, height: 10, borderRadius: "50%", background: BRAND.header }} />}</span>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: on ? 800 : 600 }}>{o.name}</span>
                  {o.sub && <span style={{ fontSize: 12, color: t.sub }}>{o.sub}</span>}
                </button>
              );
            })}
            {!options.length && <div style={{ color: t.sub, textAlign: "center", padding: 14 }}>حسابی تعریف نشده است</div>}
          </div>
        </div>
      )}
    </>
  );
}
