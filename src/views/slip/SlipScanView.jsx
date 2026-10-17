import { useEffect, useState } from "react";
import { Image as ImageIcon, Receipt } from "lucide-react";

import { accountPath } from "../../domain/accountTree.js";
import { extractSlip, getOcrWorker } from "../../services/slipOcr.js";
import { guessExpenseCategoryId } from "../../services/slipParser.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toEnDigits } from "../../utils/cardFormat.js";
import { faLongDate } from "../../utils/dates.js";
import { toFaInt } from "../../utils/format.js";
import { resizeImage } from "../../utils/image.js";

export function SlipScanView({ categories = [], openWithPrefill, onBack }) {
  const st = useStyles(); const t = useT();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  useEffect(() => { const id = setTimeout(() => { getOcrWorker().catch(() => {}); }, 300); return () => clearTimeout(id); }, []);   // موتور از همین الان آماده می‌شود
  async function onFile(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    setErr(""); setResult(null); setBusy(true); setStatus("آماده‌سازی تصویر...");
    try {
      setPhoto(await resizeImage(f, 480));
      const r = await extractSlip(f, categories, setStatus);
      setResult({ ...r, amountText: r.amount ? String(r.amount) : "" });
      if (!r.amount) setErr("مبلغ به‌طور خودکار تشخیص داده نشد؛ می‌تونی دستی وارد کنی یا با نور بهتر دوباره عکس بگیری.");
    } catch (x) { setErr("خواندن برگه ناموفق بود؛ دوباره با نور بهتر عکس بگیر. " + (x?.message ? `(${x.message})` : "")); }
    setBusy(false); setStatus("");
  }
  const cat = result?.categoryId ? categories.find((c) => c.id === result.categoryId) : null;
  const catPath = cat ? accountPath(categories, cat).slice(1).join(" / ") : "";
  const amountNum = result ? Math.round(Number(toEnDigits(result.amountText || "").replace(/[^\d.]/g, ""))) || 0 : 0;
  const btn = (bg, fg) => ({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "13px 8px", borderRadius: 12, background: bg, color: fg, fontWeight: 800, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto" });
  return (
    <div>
      <div style={{ ...st.card, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>اسکن برگه پوز</div>
        <div style={{ fontSize: 12.5, color: t.sub, lineHeight: 2, marginBottom: 12 }}>
          از برگه‌ی پوز عکس بگیر. نام فروشگاه، مبلغ، تاریخ و ساعت روی خود گوشی (آفلاین و رایگان) خوانده می‌شود. قبل از ثبت، مقدارها را می‌توانی ویرایش کنی.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <label style={btn(BRAND.header, "#fff")}><Receipt size={17} /> عکس‌برداری<input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} /></label>
          <label style={btn("#f1eef4", BRAND.header)}><ImageIcon size={17} /> از گالری<input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} /></label>
        </div>
        {busy && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: BRAND.violet }}>{status || "در حال خواندن برگه..."}</div>}
        {err && <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 700, color: BRAND.crimson, lineHeight: 1.9 }}>{err}</div>}
      </div>
      {result && (
        <div style={{ ...st.card, padding: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {photo && <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
            <div style={{ flex: 1, fontSize: 13, lineHeight: 2.1 }}>
              <div><span style={{ color: t.sub }}>تاریخ: </span><b>{result.date ? faLongDate(new Date(result.date)) : "امروز"}</b>{result.time && <> · <b>{result.time}</b></>}</div>
              <div><span style={{ color: t.sub }}>حساب (دسته): </span><b>{catPath || "در مرحله بعد انتخاب کن"}</b></div>
            </div>
          </div>
          <label style={st.label}>فروشگاه</label>
          <input value={result.merchant} onChange={(e) => setResult((r) => ({ ...r, merchant: e.target.value, categoryId: r.categoryId || guessExpenseCategoryId(categories, e.target.value) }))} placeholder="نام فروشگاه" style={st.input} />
          <label style={st.label}>مبلغ (ریال){amountNum ? ` — ${toFaInt(amountNum)}` : ""}</label>
          <input value={result.amountText} inputMode="numeric" onChange={(e) => setResult((r) => ({ ...r, amountText: e.target.value }))} placeholder="مبلغ به ریال" style={{ ...st.input, direction: "ltr", textAlign: "left" }} />
          <button disabled={!amountNum} onClick={() => { openWithPrefill({ type: "expense", amount: amountNum, date: result.date || undefined, time: result.time || undefined, note: result.merchant, categoryId: result.categoryId || undefined, photo: photo || undefined }); onBack?.(); }} style={{ ...st.primaryBtn, marginTop: 14, opacity: amountNum ? 1 : 0.5 }}>ادامه: انتخاب حساب بانکی و ثبت</button>
        </div>
      )}
    </div>
  );
}
