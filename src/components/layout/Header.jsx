import { ChevronRight, Menu } from "lucide-react";

import { VoiceCaptureButton } from "./VoiceCaptureButton.jsx";
import { BRAND } from "../../theme/palette.js";
import { iconBtn } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Header + BottomNav
--------------------------------------------------------- */
export function Header({ title = "Rexa", onMenu, back, onBack, onMic }) {
  return <div style={{ background: BRAND.header, color: "#fff", padding: "calc(env(safe-area-inset-top, 0px) + 10px) 12px 10px", display: "grid", gridTemplateColumns: "42px 1fr 76px", alignItems: "center", position: "sticky", top: 0, zIndex: 80 }}>
    <div style={{ display: "flex", justifyContent: "flex-start" }}>{back ? <button onClick={onBack} style={iconBtn}><ChevronRight size={24} /></button> : <button onClick={onMenu} style={iconBtn} aria-label="منوی برنامه"><Menu size={24} /></button>}</div>
    <div style={{ textAlign: "center", fontWeight: 800, fontSize: 17, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>{onMic && <VoiceCaptureButton onResult={onMic} />}</div>
  </div>;
}
