import { useEffect } from "react";

// بعد از رفتن به مدیر هر بخش، رکورد انتخاب‌شده را باز و به آن اسکرول می‌کند
export function useFocusItem(focusId, setFocusId, openFn) {
  useEffect(() => {
    if (!focusId) return;
    openFn(focusId);
    setTimeout(() => { try { document.getElementById(`item-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); } catch {} }, 150);
    setFocusId?.(null);
  }, [focusId]);
}
