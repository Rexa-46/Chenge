import { useState } from "react";
import { exportDocPdf, exportDocXlsx } from "../../services/exportDoc.js";
import { FileSpreadsheet, Printer } from "lucide-react";

import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function ExportBar({ doc }) {
  const st = useStyles(); const [busy, setBusy] = useState(""); const [msg, setMsg] = useState("");
  const run = async (kind) => {
    if (busy || !doc) return;
    setBusy(kind); setMsg("");
    try { await (kind === "xlsx" ? exportDocXlsx : exportDocPdf)(doc); }
    catch (e) { if (!/cancel/i.test(String(e?.message || e))) setMsg("خروجی گرفته نشد: " + (e?.message || e)); }
    setBusy("");
  };
  const b = (bg) => ({ ...st.primaryBtn, background: bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: busy ? 0.7 : 1 });
  return (
    <div className="no-print" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => run("xlsx")} style={b(BRAND.green)}><FileSpreadsheet size={16} /> {busy === "xlsx" ? "در حال ساخت..." : "خروجی Excel"}</button>
        <button onClick={() => run("pdf")} style={b("#555")}><Printer size={16} /> {busy === "pdf" ? "در حال ساخت..." : "خروجی PDF"}</button>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: BRAND.crimson, fontWeight: 700 }}>{msg}</div>}
    </div>
  );
}
