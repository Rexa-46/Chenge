import { useEffect, useRef } from "react";

/* پنجره‌ی بازِ روی صفحه (مودال/شیت) را به دکمه‌ی برگشت اندروید وصل می‌کند:
   تا active=true است، برگشت ابتدا همین پنجره را می‌بندد (وارد window.__rexaBack می‌شود؛ آخرین پنجره‌ی باز اولویت دارد). */
export function useBackClose(active, onClose) {
  const ref = useRef(onClose);
  ref.current = onClose;   // همیشه آخرین onClose صدا زده می‌شود
  useEffect(() => {
    if (!active) return;
    const h = () => ref.current?.();
    (window.__rexaBack = window.__rexaBack || []).push(h);
    return () => { window.__rexaBack = (window.__rexaBack || []).filter((x) => x !== h); };
  }, [active]);
}
