import { useState } from "react";
import { ChevronLeft } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { PIE_COLORS } from "../../theme/chartColors.js";
import { faDigits, formatMoney } from "../../utils/format.js";

/* فهرست سرفصل‌ها با باز/بسته شدن زیرمجموعه‌ها (در همه‌ی گزارش‌ها یکسان) */
export function HeadingBreakdown({ tree = [], color, currency, usdRate, total, empty = "در این بازه موردی نیست", colored = true }) {
  const t = useT();
  const [open, setOpen] = useState({});
  const sum = total ?? tree.reduce((s, n) => s + n.amount, 0);
  if (!tree.length) return <div style={{ textAlign: "center", color: t.sub, fontSize: 12.5, padding: 16 }}>{empty}</div>;
  const row = (n, depth, idx, ownRow) => {
    const kids = ownRow ? [] : n.children;
    const isOpen = !!open[n.id];
    const amount = ownRow ? n.own : n.amount;
    return (
      <div key={(ownRow ? "own-" : "") + n.id}>
        <div onClick={kids.length ? () => setOpen((o) => ({ ...o, [n.id]: !o[n.id] })) : undefined}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 2px", paddingRight: 2 + depth * 16, borderTop: `1px solid ${t.border}`, cursor: kids.length ? "pointer" : "default" }}>
          {colored && depth === 0 && <span style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />}
          <span style={{ flex: 1, fontSize: depth ? 12.5 : 13.5, fontWeight: depth ? 500 : 700, color: depth ? t.sub : t.text }}>{depth > 0 && "↳ "}{ownRow ? `${n.name} (مستقیم)` : n.name}{kids.length > 0 && <span style={{ marginRight: 6, fontSize: 10.5, color: t.sub }}>({faDigits(kids.length + (n.own > 0 ? 1 : 0))} مورد)</span>}</span>
          <span style={{ fontSize: 11.5, color: t.sub }}>{faDigits(sum ? Math.round((amount / sum) * 100) : 0)}٪</span>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{formatMoney(amount, currency, usdRate)}</span>
          {kids.length > 0 && <ChevronLeft size={16} color={t.sub} style={{ transform: isOpen ? "rotate(-90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />}
        </div>
        {isOpen && kids.length > 0 && (<>
          {n.own > 0 && row(n, depth + 1, 0, true)}
          {kids.map((k, i) => row(k, depth + 1, i, false))}
        </>)}
      </div>
    );
  };
  return <div>{tree.map((n, i) => row(n, 0, i, false))}</div>;
}
