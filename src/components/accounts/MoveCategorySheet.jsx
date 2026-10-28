import { useState } from "react";
import { Check, ChevronLeft, X } from "lucide-react";

import { ACCOUNT_GROUPS, accountPath } from "../../domain/accountTree.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { toBody } from "../../utils/portal.js";

/* انتقال یک حساب (با همه‌ی زیرمجموعه‌هایش) زیر سرفصل دیگر یا به ریشه‌ی یک گروه */
export function MoveCategorySheet({ category, categories, transactions = [], onClose, onMove }) {
  const t = useT();
  const [expanded, setExpanded] = useState({});
  const [picked, setPicked] = useState(null); // { parentId, kind }
  // خودِ حساب و فرزندانش مقصد مجاز نیستند (حلقه ساخته می‌شود)
  const blocked = new Set([category.id]);
  let grew = true;
  while (grew) { grew = false; categories.forEach((c) => { if (c.parentId && blocked.has(c.parentId) && !blocked.has(c.id)) { blocked.add(c.id); grew = true; } }); }
  const hasParent = (c) => c.parentId && categories.some((x) => x.id === c.parentId);
  const kidsOf = (id) => categories.filter((c) => c.parentId === id && !blocked.has(c.id));
  const rootsOf = (kind) => categories.filter((c) => !hasParent(c) && c.kind === kind && !blocked.has(c.id));
  const usedCount = transactions.filter((x) => x.categoryId === category.id).length;
  const sel = (parentId, kind) => picked && picked.parentId === parentId && picked.kind === kind;
  const node = (c, depth) => {
    const kids = kidsOf(c.id);
    const open = !!expanded[c.id];
    return (
      <div key={c.id}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 4px", paddingRight: 4 + depth * 16, borderBottom: `1px solid ${t.border}`, background: sel(c.id, c.kind) ? "rgba(88,39,119,.10)" : "transparent" }}>
          <div onClick={() => setPicked({ parentId: c.id, kind: c.kind })} style={{ flex: 1, fontSize: 13.5, fontWeight: sel(c.id, c.kind) ? 800 : 600, cursor: "pointer" }}>{depth > 0 && "↳ "}{c.name}</div>
          {sel(c.id, c.kind) && <Check size={16} color={BRAND.darkgreen} />}
          {kids.length > 0 && <button type="button" onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))} style={{ background: "none", border: 0, padding: 3, display: "flex", cursor: "pointer" }}><ChevronLeft size={19} color={t.sub} style={{ transform: open ? "rotate(-90deg)" : "none" }} /></button>}
        </div>
        {open && kids.map((k) => node(k, depth + 1))}
      </div>
    );
  };
  const kindOfPick = picked?.kind || category.kind;
  const kindChanged = picked && kindOfPick !== category.kind;
  return toBody(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 520, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, width: "100%", maxHeight: "88vh", overflowY: "auto", borderRadius: "18px 18px 0 0", padding: "16px 14px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 800, fontSize: 15 }}>انتقال «{category.name}»</div><span style={{ width: 31 }} />
        </div>
        <div style={{ fontSize: 12, color: t.sub, lineHeight: 1.9, marginBottom: 10 }}>سرفصل مقصد را انتخاب کن؛ این مورد با همه‌ی زیرمجموعه‌ها و سابقه‌ی تراکنش‌هایش به آنجا می‌رود. برای بردن به سطح اول یک گروه، «بدون سرفصل» همان گروه را بزن.</div>
        {ACCOUNT_GROUPS.map((g) => (
          <div key={g.kind} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", fontWeight: 800, fontSize: 13.5, color: BRAND.header }}>
              <span>{g.label}</span>
              <button type="button" onClick={() => setPicked({ parentId: null, kind: g.kind })} style={{ border: `1px solid ${sel(null, g.kind) ? BRAND.darkgreen : t.border}`, background: sel(null, g.kind) ? "rgba(34,165,89,.12)" : "transparent", color: sel(null, g.kind) ? BRAND.darkgreen : t.sub, borderRadius: 14, padding: "3px 10px", fontSize: 11.5, fontFamily: "inherit", cursor: "pointer" }}>{sel(null, g.kind) ? "✓ " : ""}بدون سرفصل (سطح اول)</button>
            </div>
            {rootsOf(g.kind).map((c) => node(c, 0))}
          </div>
        ))}
        {kindChanged && usedCount > 0 && <div style={{ fontSize: 11.5, color: "#8a5a00", background: "#fff4e0", borderRadius: 10, padding: "8px 10px", lineHeight: 1.9, margin: "8px 0" }}>این حساب {usedCount} تراکنش دارد. گروهش از «{ACCOUNT_GROUPS.find((x) => x.kind === category.kind)?.label}» به «{ACCOUNT_GROUPS.find((x) => x.kind === kindOfPick)?.label}» تغییر می‌کند؛ مبلغ تراکنش‌ها تغییری نمی‌کند.</div>}
        <button type="button" disabled={!picked} onClick={() => onMove(picked.parentId, picked.kind)} style={{ width: "100%", marginTop: 8, padding: "13px 0", borderRadius: 12, border: 0, background: picked ? BRAND.header : "#c9c4d1", color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: picked ? "pointer" : "default" }}>
          {picked ? `انتقال به «${picked.parentId ? accountPath(categories, categories.find((c) => c.id === picked.parentId)).join(" / ") : ACCOUNT_GROUPS.find((g) => g.kind === picked.kind)?.label}»` : "مقصد را انتخاب کن"}
        </button>
      </div>
    </div>
  );
}
