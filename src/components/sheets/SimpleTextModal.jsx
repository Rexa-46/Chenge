import { useState } from "react";

import { useStyles } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Simple text modal (used for the quick "یادداشت" note capture)
--------------------------------------------------------- */
export function SimpleTextModal({ title, placeholder, onClose, onSubmit }) {
  const st = useStyles();
  const [text, setText] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 400, maxWidth: 480, margin: "0 auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", borderRadius: "18px 18px 0 0", padding: "20px 18px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{title}</div>
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={4}
          style={{ ...st.input, resize: "vertical", fontFamily: "inherit" }} />
        <button disabled={!text.trim()} onClick={() => onSubmit(text.trim())} style={{ ...st.primaryBtn, opacity: text.trim() ? 1 : 0.5 }}>ذخیره</button>
      </div>
    </div>
  );
}
