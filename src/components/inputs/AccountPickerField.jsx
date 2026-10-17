import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";

import { AccountsTree } from "../accounts/AccountsTree.jsx";
import { accountPath } from "../../domain/accountTree.js";
import { useT } from "../../theme/ThemeContext.js";
import { FONT } from "../../theme/palette.js";
import { toBody } from "../../utils/portal.js";

export function AccountPickerField({ categories, value, onChange, addCategory, st }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const selected = categories.find((c) => c.id === value);
  const display = selected ? accountPath(categories, selected).join(" / ") : "انتخاب حساب";
  return <>
    <button type="button" onClick={() => setOpen(true)} style={{ width: "100%", minHeight: 46, marginBottom: 8, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: selected ? t.text : t.sub, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", cursor: "pointer", textAlign: "right" }}>
      <span style={{ fontSize: 13.5, fontWeight: selected ? 700 : 500 }}>{display}</span><ChevronLeft size={17} style={{ transform: "rotate(90deg)", flexShrink: 0 }} />
    </button>
    {open && toBody(<div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, width: "100%", maxHeight: "86vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>حساب‌ها</div><span style={{ width: 31 }} />
        </div>
        <AccountsTree mode="pick" categories={categories} addCategory={addCategory} value={value} onPick={(id) => { onChange(id); setOpen(false); }} />
      </div>
    </div>)}
  </>;
}
