import { useState } from "react";
import { Sparkles } from "lucide-react";

import { VoiceCaptureButton } from "../layout/VoiceCaptureButton.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";
import { parseBankSms } from "../../utils/smsParser.js";

/* ---------------------------------------------------------
   Smart capture overlay — opened by triple-tap anywhere on the
   screen. Semi-transparent so the page behind stays visible.
   Text is parsed locally (same engine as the SMS/voice parser).
--------------------------------------------------------- */
export function SmartCaptureOverlay({ onClose, onParsed }) {
  const st = useStyles();
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseBankSms(text) : null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(20,10,30,0.4)", backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "88%", maxWidth: 380, background: "rgba(255,255,255,0.92)", borderRadius: 18, padding: 18,
        boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: BRAND.header }}>
            <Sparkles size={17} /> ثبت سریع
          </div>
          <VoiceCaptureButton dark onResult={(t) => setText((prev) => (prev ? prev + " " : "") + t)} />
        </div>
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="بنویس یا میکروفن رو بزن و بگو چی خرج شد یا چی دریافت کردی..." style={{ ...st.input, resize: "vertical", fontFamily: "inherit", background: "rgba(255,255,255,0.7)" }} />
        {parsed && (
          <div style={{ fontSize: 12, color: "#6a6275", marginBottom: 10 }}>
            تشخیص: {parsed.amount ? `${toFaInt(parsed.amount)} ریال` : "مبلغی پیدا نشد"} — {parsed.type === "income" ? "دریافت" : "پرداخت"}{parsed.categoryHint ? ` — ${parsed.categoryHint}` : ""}
          </div>
        )}
        <button disabled={!parsed?.amount} onClick={() => onParsed(parsed)} style={{ ...st.primaryBtn, opacity: parsed?.amount ? 1 : 0.5 }}>ادامه ثبت</button>
      </div>
    </div>
  );
}
