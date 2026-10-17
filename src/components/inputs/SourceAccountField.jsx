import { useState } from "react";
import { ChevronLeft, X } from "lucide-react";

import { AccountsTree } from "../accounts/AccountsTree.jsx";
import { accountPath, faKey } from "../../domain/accountTree.js";
import { useT } from "../../theme/ThemeContext.js";
import { FONT } from "../../theme/palette.js";
import { toBody } from "../../utils/portal.js";

// «از حساب / به حساب»: همان درخت حساب‌ها؛ همه نمایش داده می‌شوند ولی فقط «بانک‌ها» و «حساب‌های دو طرفه» قابل انتخابند.
// برای وصل شدن به موجودی واقعی، نام حساب بانکی در درخت باید با نام آن در «حساب‌ها و کارت‌ها» یکسان باشد.
export function SourceAccountField({ accounts, categories, accountId, fromCategoryId, onChange, st, allowTwoWay = true, title = "انتخاب حساب" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const byId = (id) => categories.find((c) => c.id === id);
  const twoWayAnc = (c) => { let p = c, g = 0; while (p && g++ < 8) { if (p.twoWay) return true; p = byId(p.parentId); } return false; };
  const selectable = (c) => c.kind === "bank" || (allowTwoWay && twoWayAnc(c));
  const accSel = accounts.find((a) => a.id === accountId);
  const catSel = fromCategoryId ? byId(fromCategoryId) : null;
  const label = catSel ? accountPath(categories, catSel).join(" / ") : accSel ? accSel.name : "";
  const treeValue = fromCategoryId || categories.find((c) => c.kind === "bank" && accSel && faKey(c.name) === faKey(accSel.name))?.id;
  function resolve(c) {
    if (c.kind === "bank") {
      let p = c, g = 0;
      while (p && g++ < 8) {
        const acc = accounts.find((a) => faKey(a.name) === faKey(p.name));
        if (acc) return { accountId: acc.id, fromCategoryId: "" };
        p = byId(p.parentId);
      }
      return { error: `نام «${c.name}» با هیچ حسابی در «حساب‌ها و کارت‌ها» یکسان نیست؛ برای وصل شدن به موجودی بانک، نام‌ها را یکی کنید.` };
    }
    return { accountId: "", fromCategoryId: c.id };
  }
  function pick(id) {
    const c = byId(id); if (!c) return;
    const r = resolve(c);
    if (r.error) { window.alert(r.error); return; }
    onChange(r); setOpen(false);
  }
  return <>
    <button type="button" onClick={() => setOpen(true)} style={{ width: "100%", minHeight: 46, marginBottom: 8, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: label ? t.text : t.sub, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", cursor: "pointer", textAlign: "right" }}>
      <span style={{ fontSize: 13.5, fontWeight: label ? 700 : 500 }}>{label || title}</span><ChevronLeft size={17} style={{ transform: "rotate(90deg)", flexShrink: 0 }} />
    </button>
    {open && toBody(<div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, width: "100%", maxHeight: "80vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div><span style={{ width: 31 }} />
        </div>
        <div style={{ fontSize: 11.5, color: t.sub, lineHeight: 1.9, marginBottom: 10 }}>{allowTwoWay ? "فقط حساب‌های بانکی و حساب‌های دو طرفه قابل انتخاب‌اند؛ بقیه کم‌رنگ هستند." : "فقط حساب‌های بانکی قابل انتخاب‌اند؛ بقیه کم‌رنگ هستند."}</div>
        <AccountsTree mode="pick" categories={categories} value={treeValue} selectable={selectable} defaultExpanded={{ "g:bank": true }} onPick={pick} onBlocked={() => window.alert(allowTwoWay ? "این حساب قابل انتخاب نیست. فقط «بانک‌ها» و حساب‌های «دو طرفه» انتخاب می‌شوند." : "این حساب قابل انتخاب نیست. فقط «بانک‌ها» انتخاب می‌شوند.")} />
      </div>
    </div>)}
  </>;
}
