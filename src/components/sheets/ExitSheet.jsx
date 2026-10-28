import { useState } from "react";
import { Check, CloudUpload, DatabaseBackup, Smartphone, Unplug, X } from "lucide-react";

import { usePersistedState } from "../../hooks/usePersistedState.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, FONT } from "../../theme/palette.js";

/* فرم خروج: «با پشتیبان» (روی گوشی و/یا فضای ابری) یا «بدون پشتیبان» */
export function ExitSheet({ cloudReady, onBackup, onExit, onClose }) {
  const t = useT();
  const [opts, setOpts] = usePersistedState("exitOpts", { device: true, cloud: false, encrypt: true });
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const useCloud = !!(opts.cloud && cloudReady);
  const needPass = opts.device && opts.encrypt;
  const problem = !opts.device && !useCloud ? "حداقل یک مقصد را انتخاب کن." : needPass && pass.length < 4 ? "رمز فایل پشتیبان حداقل ۴ نویسه باشد." : "";

  async function run() {
    if (problem || busy) return;
    setBusy(true); setResults(null);
    let res = [];
    try { res = await onBackup({ device: !!opts.device, cloud: useCloud, encrypt: !!opts.encrypt, pass }); }
    catch (e) { res = [{ label: "پشتیبان‌گیری", ok: false, text: String(e?.message || e) }]; }
    setBusy(false); setResults(res);
    if (res.every((r) => r.ok)) setTimeout(onExit, 900);   // همه موفق بود: خودکار خارج می‌شود
  }
  const toggle = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  const check = (k, label, Icon, disabled, hint) => (
    <label onClick={disabled ? undefined : () => toggle(k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${opts[k] && !disabled ? BRAND.header : t.border}`, background: opts[k] && !disabled ? "rgba(62,20,97,.07)" : "transparent", opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer", marginBottom: 8 }}>
      <Icon size={20} color={BRAND.header} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{label}{hint && <div style={{ fontSize: 11, fontWeight: 500, color: t.sub }}>{hint}</div>}</span>
      <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${opts[k] && !disabled ? BRAND.header : t.border}`, background: opts[k] && !disabled ? BRAND.header : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{opts[k] && !disabled && <Check size={14} color="#fff" strokeWidth={3} />}</span>
    </label>
  );
  return (
    <div onClick={busy ? undefined : onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT, direction: "rtl" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg || t.card, color: t.text, width: "100%", maxHeight: "92vh", overflowY: "auto", borderRadius: "20px 20px 0 0", padding: "16px 16px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <button type="button" onClick={onClose} disabled={busy} style={{ border: 0, background: "transparent", color: t.sub, padding: 5 }}><X size={21} /></button>
          <div style={{ fontWeight: 900, fontSize: 16 }}>خروج از Rexa</div><span style={{ width: 31 }} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: t.sub, marginBottom: 14 }}>قبل از خروج، از اطلاعاتت پشتیبان بگیرم؟</div>

        <div style={{ border: `1.5px solid ${BRAND.header}`, borderRadius: 16, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: BRAND.header, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><DatabaseBackup size={24} /></span>
            <div><div style={{ fontWeight: 900, fontSize: 14.5 }}>خروج با پشتیبان‌گیری</div><div style={{ fontSize: 11.5, color: t.sub }}>مقصد پشتیبان را انتخاب کن</div></div>
          </div>
          {check("device", "ذخیره روی گوشی", Smartphone, false, "فایل در پوشه‌ی Documents/Rexa (در غیر این صورت از منوی اشتراک‌گذاری)")}
          {opts.device && (
            <div style={{ margin: "-2px 0 8px", paddingRight: 8 }}>
              <label onClick={() => toggle("encrypt")} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginBottom: 6 }}>
                <input type="checkbox" readOnly checked={!!opts.encrypt} style={{ width: 17, height: 17, accentColor: BRAND.header }} /> رمزگذاری فایل (پیشنهادی)
              </label>
              {opts.encrypt && <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="رمز فایل پشتیبان (حداقل ۴ نویسه؛ فراموش نکن)" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${t.inputBorder}`, background: t.input, color: t.text, fontFamily: "inherit", fontSize: 13 }} />}
            </div>
          )}
          {check("cloud", "ارسال به فضای ابری (گیت‌هاب)", CloudUpload, !cloudReady, cloudReady ? "رمزگذاری‌شده با رمز همگام‌سازی" : "اتصال گیت‌هاب برقرار نیست؛ از تنظیمات ← همگام‌سازی ابری وصلش کن")}
          {problem && <div style={{ fontSize: 12, color: BRAND.crimson, margin: "0 2px 8px" }}>{problem}</div>}
          <button type="button" disabled={!!problem || busy} onClick={run} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: 0, background: problem ? "#c9c4d1" : BRAND.header, color: "#fff", fontWeight: 800, fontSize: 14, fontFamily: "inherit", cursor: problem || busy ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <DatabaseBackup size={18} /> {busy ? "در حال پشتیبان‌گیری..." : "پشتیبان بگیر و خارج شو"}
          </button>
          {results && (
            <div style={{ marginTop: 10 }}>
              {results.map((r, i) => <div key={i} style={{ fontSize: 12.5, lineHeight: 1.9, color: r.ok ? BRAND.darkgreen : BRAND.crimson }}>{r.ok ? "✓" : "✗"} {r.label}: {r.text}</div>)}
              {!results.every((r) => r.ok) && <div style={{ fontSize: 11.5, color: t.sub, marginTop: 4 }}>همه‌ی پشتیبان‌ها موفق نبود؛ می‌توانی دوباره تلاش کنی یا با همین وضعیت خارج شوی.</div>}
            </div>
          )}
        </div>

        <button type="button" disabled={busy} onClick={onExit} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, border: `1.5px solid ${t.border}`, background: "transparent", color: t.text, fontFamily: "inherit", cursor: "pointer", textAlign: "right", marginBottom: 10 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, background: "#fde8ea", color: BRAND.crimson, display: "flex", alignItems: "center", justifyContent: "center" }}><Unplug size={24} /></span>
          <span><div style={{ fontWeight: 900, fontSize: 14.5 }}>خروج بدون پشتیبان</div><div style={{ fontSize: 11.5, color: t.sub }}>فقط خارج می‌شوم؛ داده‌ها روی گوشی می‌مانند</div></span>
        </button>
        <button type="button" disabled={busy} onClick={onClose} style={{ width: "100%", padding: "11px 0", border: 0, background: "transparent", color: t.sub, fontWeight: 700, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>انصراف و ماندن در برنامه</button>
      </div>
    </div>
  );
}
