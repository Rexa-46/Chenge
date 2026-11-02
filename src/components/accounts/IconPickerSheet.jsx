import { useMemo, useState } from "react";
import { Search, Wand2, X } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { ICONS, ICON_GROUPS } from "../../utils/iconLibrary.js";
import { iconByKeyOrName } from "../../utils/categoryIcons.js";
import { toBody } from "../../utils/portal.js";
import { IconBadge } from "../common/IconBadge.jsx";

/* انتخاب آیکن برای یک سرفصل/زیرمجموعه؛ «خودکار» یعنی حدس از روی نام */
export function IconPickerSheet({ category, onPick, onClose }) {
  const t = useT();
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const s = q.trim();
    if (!s) return ICON_GROUPS;
    const items = ICON_GROUPS.flatMap((g) => g.items).filter(([k, label]) => label.includes(s) || k.toLowerCase().includes(s.toLowerCase()));
    return items.length ? [{ title: `نتیجه‌ی «${s}»`, items }] : [];
  }, [q]);
  const Auto = iconByKeyOrName(undefined, category.name);
  return toBody(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 730, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, color: t.text, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>آیکن «{category.name}»</div><span style={{ width: 31 }} />
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={16} color={t.sub} style={{ position: "absolute", top: 12, right: 12 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی آیکن (مثلاً: خودرو، دارو، کافه)" style={{ width: "100%", padding: "10px 36px 10px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", fontSize: 13.5, outline: "none" }} />
        </div>
        <button type="button" onClick={() => onPick(undefined)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 12, border: `2px solid ${!category.icon ? BRAND.header : t.border}`, background: "transparent", color: t.text, fontFamily: "inherit", cursor: "pointer", marginBottom: 10 }}>
          <IconBadge icon={Auto} seed={category.name} size={36} />
          <span style={{ flex: 1, textAlign: "right", fontWeight: 800, fontSize: 13 }}>خودکار (از روی نام)</span><Wand2 size={17} color={t.sub} />
        </button>
        {groups.length === 0 && <div style={{ textAlign: "center", color: t.sub, fontSize: 12.5, padding: 16 }}>آیکنی پیدا نشد</div>}
        {groups.map((g) => (
          <div key={g.title} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: BRAND.header, margin: "4px 2px 8px" }}>{g.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {g.items.map(([k, label]) => { const I = ICONS[k]; if (!I) return null; const on = category.icon === k; return (
                <button key={k} type="button" onClick={() => onPick(k)} title={label} style={{ border: 0, background: "transparent", padding: 4, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <IconBadge icon={I} seed={k} size={44} selected={on} />
                  <span style={{ fontSize: 9.5, color: t.sub, lineHeight: 1.3, textAlign: "center", maxWidth: 58 }}>{label}</span>
                </button>
              ); })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
