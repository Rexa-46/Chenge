import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";

import { accTypeFa } from "../../domain/reportMath.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { toBody } from "../../utils/portal.js";

export function BankAccountField({ accounts, value, onChange, st }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const sel = accounts.find((a) => a.id === value);
  return <>
    <button type="button" onClick={() => setOpen(true)} style={{ width: "100%", minHeight: 46, marginBottom: 8, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: sel ? t.text : t.sub, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", cursor: "pointer", textAlign: "right" }}>
      <span style={{ fontSize: 13.5, fontWeight: sel ? 700 : 500 }}>{sel ? sel.name : "انتخاب حساب بانکی"}</span><ChevronLeft size={17} style={{ transform: "rotate(90deg)", flexShrink: 0 }} />
    </button>
    {open && toBody(<div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, width: "100%", maxHeight: "70vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>انتخاب حساب بانکی</div><span style={{ width: 31 }} />
        </div>
        {accounts.map((a) => {
          const on = a.id === value;
          return (
            <button key={a.id} type="button" onClick={() => { onChange(a.id); setOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 6px", border: "none", borderBottom: `1px solid ${t.border}`, background: "transparent", cursor: "pointer", fontFamily: "inherit", color: t.text, textAlign: "right" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${on ? BRAND.header : t.sub}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <span style={{ width: 10, height: 10, borderRadius: "50%", background: BRAND.header }} />}</span>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: on ? 800 : 600 }}>{a.name}</span>
              <span style={{ fontSize: 12, color: t.sub }}>{accTypeFa(a.type)}</span>
            </button>
          );
        })}
        {!accounts.length && <div style={{ color: t.sub, textAlign: "center", padding: 14 }}>حسابی تعریف نشده است</div>}
      </div>
    </div>)}
  </>;
}
