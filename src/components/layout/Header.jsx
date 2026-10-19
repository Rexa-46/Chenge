import { Bell, ChevronRight, Menu } from "lucide-react";

import { VoiceCaptureButton } from "./VoiceCaptureButton.jsx";
import { BRAND } from "../../theme/palette.js";
import { iconBtn } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Header + BottomNav
--------------------------------------------------------- */
export function Header({ title = "Rexa", onMenu, back, onBack, onMic, onBell, alarmCount = 0 }) {
  return <div style={{ background: BRAND.header, color: "#fff", padding: "calc(env(safe-area-inset-top, 0px) + 10px) 12px 10px", display: "grid", gridTemplateColumns: "42px 1fr 84px", alignItems: "center", position: "sticky", top: 0, zIndex: 80 }}>
    <div style={{ display: "flex", justifyContent: "flex-start" }}>{back ? <button onClick={onBack} style={iconBtn}><ChevronRight size={24} /></button> : <button onClick={onMenu} style={iconBtn} aria-label="منوی برنامه"><Menu size={24} /></button>}</div>
    <div style={{ textAlign: "center", fontWeight: 800, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
      {onBell && <button onClick={onBell} style={{ ...iconBtn, position: "relative" }} aria-label="آلارم‌ها"><Bell size={22} />{alarmCount > 0 && <span style={{ position: "absolute", top: 2, left: 2, minWidth: 16, height: 16, padding: "0 4px", boxSizing: "border-box", borderRadius: 8, background: "#ff4d6d", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{alarmCount > 9 ? "۹+" : alarmCount.toLocaleString("fa-IR")}</span>}</button>}
      {onMic && <VoiceCaptureButton onResult={onMic} />}
    </div>
  </div>;
}
