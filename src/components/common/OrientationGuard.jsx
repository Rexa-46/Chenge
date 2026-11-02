import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

/* برنامه فقط عمودی است. اگر دستگاه (مثلاً تبلت یا اندرویدهای جدید که قفل مانیفست را نادیده می‌گیرند) افقی شد،
   صفحه‌ی راهنما روی همه‌چیز می‌آید تا چیزی افقی استفاده نشود. */
export function OrientationGuard() {
  const [land, setLand] = useState(false);
  useEffect(() => {
    try { screen.orientation?.lock?.("portrait")?.catch(() => {}); } catch {}   // اگر مرورگر/وب‌ویو اجازه بدهد
    const mq = window.matchMedia("(orientation: landscape)");
    const f = () => setLand(mq.matches && window.innerWidth > window.innerHeight);
    f(); mq.addEventListener?.("change", f); window.addEventListener("resize", f);
    return () => { mq.removeEventListener?.("change", f); window.removeEventListener("resize", f); };
  }, []);
  if (!land) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0a1022", color: "#dbe7ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, direction: "rtl", fontFamily: "inherit" }}>
      <Smartphone size={44} color="#4f8bff" />
      <div style={{ fontWeight: 900, fontSize: 16 }}>گوشی را عمودی نگه دارید</div>
      <div style={{ fontSize: 12, color: "#7f8fb8" }}>Rexa فقط در حالت عمودی کار می‌کند</div>
    </div>
  );
}
