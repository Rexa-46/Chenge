import { useState } from "react";
import { Check, Palette, X } from "lucide-react";

import { BANK_DESIGNS, GENERIC_DESIGNS, detectBankDesign, resolveCardDesign } from "../../domain/bankDesigns.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { toBody } from "../../utils/portal.js";
import { resizeLogo } from "../../utils/image.js";
import { CardLogo, LOGO_ICONS } from "./CardLogo.jsx";

export const designBg = (d) => `linear-gradient(135deg, ${d.from}, ${d.to})`;
function Mini({ d, active, onClick, label }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} style={{ border: `2px solid ${active ? BRAND.header : "transparent"}`, background: "transparent", padding: 3, borderRadius: 14, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
      <div style={{ height: 54, borderRadius: 10, background: designBg(d), position: "relative", overflow: "hidden", color: d.text }}>
        <div style={{ position: "absolute", top: -14, left: -14, width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
        <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, fontWeight: 800 }}>•••• 1234</div>
        {active && <span style={{ position: "absolute", top: 4, right: 4, width: 17, height: 17, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={11} color={BRAND.header} strokeWidth={3.5} /></span>}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: t.text, marginTop: 4, lineHeight: 1.5, minHeight: 30 }}>{label || d.name}</div>
    </button>
  );
}

/* انتخاب طرح کارت: «خودکار» از روی شماره کارت، یا هر بانک/طرح دلخواه */
export function CardDesignPicker({ value, cardNumber, onChange, st, externalOpen, onExternalClose, hideTrigger, logo, onLogoChange }) {
  const t = useT();
  const [openLocal, setOpenLocal] = useState(false);
  const [bankQ, setBankQ] = useState("");
  const controlled = externalOpen !== undefined;
  const open = controlled ? externalOpen : openLocal;
  const setOpen = (v) => { if (controlled) { if (!v) onExternalClose?.(); } else setOpenLocal(v); };
  const current = resolveCardDesign({ cardDesign: value, cardNumber });
  const auto = detectBankDesign(cardNumber);
  const pick = (id) => { onChange(id); setOpen(false); };
  const q = bankQ.trim();
  const banks = q ? BANK_DESIGNS.filter((d) => d.name.includes(q)) : BANK_DESIGNS;
  const grid = (list) => <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>{list.map((d) => <Mini key={d.id} d={d} active={value === d.id} onClick={() => pick(d.id)} />)}</div>;
  return (<>
    {!hideTrigger && <button type="button" onClick={() => setOpen(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", cursor: "pointer", marginBottom: 7, ...(st?.pickerBtn || {}) }}>
      <span style={{ width: 44, height: 28, borderRadius: 7, background: designBg(current), flexShrink: 0 }} />
      <span style={{ flex: 1, textAlign: "right", fontSize: 13.5, fontWeight: 700 }}>طرح کارت: {!value || value === "auto" ? `خودکار (${current.name})` : current.name}</span>
      <Palette size={18} color={t.sub} />
    </button>}
    {open && toBody(
      <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 720, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, color: t.text, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
            <div style={{ fontWeight: 800, fontSize: 15 }}>طرح کارت</div><span style={{ width: 31 }} />
          </div>
          {onLogoChange && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: BRAND.header, margin: "2px 2px 8px" }}>لوگوی کارت</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <button type="button" onClick={() => onLogoChange(undefined)} style={{ height: 42, padding: "0 12px", borderRadius: 11, border: `2px solid ${!logo ? BRAND.header : t.border}`, background: "transparent", color: t.text, fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>بدون لوگو</button>
                {Object.keys(LOGO_ICONS).map((k) => (
                  <button key={k} type="button" onClick={() => onLogoChange(`icon:${k}`)} aria-label={k} style={{ border: `2px solid ${logo === `icon:${k}` ? BRAND.header : "transparent"}`, background: BRAND.header, borderRadius: 12, padding: 2, cursor: "pointer", display: "flex" }}><CardLogo logo={`icon:${k}`} size={36} /></button>
                ))}
                <label style={{ height: 42, padding: "0 12px", borderRadius: 11, border: `2px dashed ${logo?.startsWith("img:") ? BRAND.header : t.inputBorder}`, color: t.text, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  {logo?.startsWith("img:") ? <CardLogo logo={logo} size={30} /> : null}
                  {logo?.startsWith("img:") ? "تغییر تصویر" : "انتخاب تصویر از گوشی"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { onLogoChange(`img:${await resizeLogo(f)}`); } catch {} }} />
                </label>
              </div>
            </div>
          )}
          <button type="button" onClick={() => pick("auto")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `2px solid ${!value || value === "auto" ? BRAND.header : t.border}`, background: "transparent", color: t.text, fontFamily: "inherit", cursor: "pointer", marginBottom: 12 }}>
            <span style={{ width: 44, height: 28, borderRadius: 7, background: designBg(auto || resolveCardDesign({})), flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 13.5 }}>خودکار از روی شماره کارت</div><div style={{ fontSize: 11, color: t.sub }}>{auto ? `بانک تشخیص‌داده‌شده: ${auto.name}` : "با ۶ رقم اول شماره کارت بانک تشخیص داده می‌شود؛ اگر شناخته نشد طرح پیش‌فرض"}</div></span>
          </button>
          <div style={{ fontWeight: 800, fontSize: 13, color: BRAND.header, margin: "4px 2px 8px" }}>طرح بانک‌ها ({BANK_DESIGNS.length} بانک و مؤسسه)</div>
          <input value={bankQ} onChange={(e) => setBankQ(e.target.value)} placeholder="جستجوی نام بانک..." style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", fontSize: 13, outline: "none", marginBottom: 8 }} />
          {banks.length ? grid(banks) : <div style={{ fontSize: 12, color: t.sub, padding: 8 }}>بانکی با این نام نیست</div>}
          <div style={{ fontWeight: 800, fontSize: 13, color: BRAND.header, margin: "14px 2px 8px" }}>طرح‌های رنگی</div>
          {grid(GENERIC_DESIGNS)}
          <div style={{ fontSize: 11, color: t.sub, marginTop: 12, lineHeight: 1.9 }}>رنگ‌ها تقریبیِ هویت بصری هر بانک است. لوگوی رسمی بانک‌ها در برنامه نیست؛ برای لوگوی واقعی بانک خودت، تصویرش را از گوشی انتخاب کن.</div>
        </div>
      </div>
    )}
  </>);
}
