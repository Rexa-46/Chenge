import { useEffect, useState } from "react";
import { FileSpreadsheet, Home as HomeIcon, PieChart as PieChartIcon, Receipt, Repeat } from "lucide-react";

import { NAV3D, NavBtn } from "./NavBtn.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { THEME } from "../../theme/palette.js";

export function BottomNav({ active, setActive, onAdd, hidden = false }) {
  const t = useT();
  const dark = t.card === THEME.dark.card;
  // وقتی صفحه‌کلید باز می‌شود و ارتفاع صفحه کم می‌شود، منو بالای کیبورد نمی‌آید؛ همان ته صفحه (زیر کیبورد) می‌ماند
  const [kbShift, setKbShift] = useState(0);
  useEffect(() => {
    let maxH = window.innerHeight, w = window.innerWidth;
    const upd = () => {
      if (window.innerWidth !== w) { w = window.innerWidth; maxH = window.innerHeight; }
      maxH = Math.max(maxH, window.innerHeight);
      const d = maxH - window.innerHeight;
      setKbShift(d > 120 ? d : 0);
    };
    window.addEventListener("resize", upd);
    window.visualViewport?.addEventListener("resize", upd);
    return () => { window.removeEventListener("resize", upd); window.visualViewport?.removeEventListener("resize", upd); };
  }, []);
  // ترتیب از چپ به راست: گزارش‌ها، تراکنش‌ها، (ثبت سریع)، چک‌ها، خانه — بدون هیچ کادر؛ آیکن‌های سه‌بعدی
  const items = [
    { key: "reports", label: "گزارش‌ها", icon: PieChartIcon },
    { key: "transactions", label: "تراکنش‌ها", icon: Receipt },
    { key: "__add", label: "ثبت سریع", icon: Repeat },
    { key: "checks", label: "چک‌ها", icon: FileSpreadsheet },
    { key: "home", label: "خانه", icon: HomeIcon },
  ];
  if (hidden) return null;
  return (
    <div dir="ltr" style={{ position: "fixed", left: 0, right: 0, bottom: 0, maxWidth: 480, margin: "0 auto", zIndex: 300, background: "transparent", border: "none", boxShadow: "none", transform: kbShift ? `translateY(${kbShift}px)` : "none", pointerEvents: "none", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", alignItems: "end", padding: "18px calc(4px + env(safe-area-inset-right, 0px)) calc(6px + env(safe-area-inset-bottom, 0px)) calc(4px + env(safe-area-inset-left, 0px))" }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          {Object.entries(NAV3D).map(([k, c]) => (
            <linearGradient key={k} id={`nav3d-${k}`} gradientUnits="userSpaceOnUse" x1="4" y1="0" x2="20" y2="24">
              <stop offset="0" stopColor={c.c1} /><stop offset="1" stopColor={c.c2} />
            </linearGradient>
          ))}
        </defs>
      </svg>
      {items.map((it) => <NavBtn key={it.key} it={it} isActive={it.key !== "__add" && active === it.key} onClick={it.key === "__add" ? onAdd : () => setActive(it.key)} dark={dark} />)}
    </div>
  );
}
