import { useEffect, useState } from "react";

/* توضیحات بروزرسانی: تیتروار، پایین صفحه، و خیلی زود محو می‌شود */
export function UpdateNotesToast({ notes = [], onDone }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const a = requestAnimationFrame(() => setVis(true));
    const b = setTimeout(() => setVis(false), 5000);
    const c = setTimeout(() => onDone?.(), 5500);
    return () => { cancelAnimationFrame(a); clearTimeout(b); clearTimeout(c); };
  }, []);
  if (!notes.length) return null;
  return (
    <div onClick={onDone} style={{ position: "fixed", left: 16, right: 16, bottom: "calc(84px + env(safe-area-inset-bottom, 0px))", zIndex: 580, display: "flex", justifyContent: "center", pointerEvents: "none", direction: "rtl" }}>
      <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 440, background: "rgba(10,16,34,.94)", color: "#dbe7ff", borderRadius: 16, padding: "10px 14px", border: "1px solid rgba(80,120,255,.35)", boxShadow: "0 6px 22px rgba(0,0,0,.35)", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transition: "opacity .35s ease, transform .35s ease" }}>
        <div style={{ fontWeight: 900, fontSize: 12.5, color: "#4f8bff", marginBottom: 4 }}>تازه‌های این نسخه</div>
        {notes.map((n, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.9 }}>• {n}</div>)}
      </div>
    </div>
  );
}
