import { useState } from "react";
import { ChevronRight, Database, LogOut, ShieldCheck, Calculator, BarChart3, Coins, Receipt, X } from "lucide-react";

import { FONT } from "../../theme/palette.js";

/* فرم خروج: کادر کوچک و گوشه‌گرد، با فاصله از لبه‌های چپ و راست گوشی. دو گزینه: با پشتیبان / بدون پشتیبان */
const C = { panel: "#0a1022", edge: "#0b5cff", title: "#dbe7ff", sub: "#7f8fb8" };

function Choice({ tone, icon, title, sub, onClick, disabled }) {
  const teal = tone === "teal";
  const accent = teal ? "#22d3b6" : "#f0594f";
  return (
    <button type="button" disabled={disabled} onClick={onClick} style={{
      flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, padding: "10px 8px", borderRadius: 16, cursor: disabled ? "default" : "pointer",
      border: `1.5px solid ${accent}`, background: teal ? "linear-gradient(135deg, rgba(20,184,166,.20), rgba(8,40,44,.65))" : "linear-gradient(135deg, rgba(239,68,68,.20), rgba(60,14,20,.65))",
      color: C.title, fontFamily: "inherit", direction: "rtl", boxShadow: `0 0 14px ${accent}33`, opacity: disabled ? 0.6 : 1,
    }}>
      <ChevronRight size={15} color={accent} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, textAlign: "right", lineHeight: 1.55 }}>
        <span style={{ display: "block", fontWeight: 900, fontSize: 12.5 }}>{title}</span>
        <span style={{ display: "block", fontSize: 10, color: C.sub, fontWeight: 600 }}>{sub}</span>
      </span>
      <span style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", color: accent, background: teal ? "rgba(13,60,62,.85)" : "rgba(92,28,34,.85)", border: `1px solid ${accent}55` }}>{icon}</span>
    </button>
  );
}

export function ExitSheet({ onBackup, onExit, onClose }) {
  const [step, setStep] = useState("choose");   // choose | enc | busy | done
  const [pass, setPass] = useState("");
  const [results, setResults] = useState([]);
  const lock = step === "busy";

  async function run(encrypt) {
    if (encrypt && pass.length < 4) return;
    setStep("busy");
    let res = [];
    try { res = await onBackup({ encrypt, pass }); } catch (e) { res = [{ label: "پشتیبان", ok: false, text: String(e?.message || e) }]; }
    setResults(res); setStep("done");
  }
  const bigBtn = (bg, color, border) => ({ width: "100%", padding: "11px 0", borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, fontWeight: 900, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" });
  return (
    <div onClick={lock ? undefined : onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,6,18,.62)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", fontFamily: FONT, direction: "rtl" }}>
      {/* لبه‌های آبی چپ و راست مثل طرح */}
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, borderRadius: 24, background: C.edge, padding: "0 7px", boxShadow: "0 0 26px rgba(11,92,255,.55)" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, background: `radial-gradient(120% 140% at 50% 0%, #111b3a 0%, ${C.panel} 60%)`, padding: "14px 12px 14px", border: "1px solid rgba(80,120,255,.25)" }}>
          {/* نقش‌های محو پس‌زمینه */}
          <Calculator size={64} color="#3b5bdb" style={{ position: "absolute", left: 14, top: 8, opacity: 0.14 }} />
          <BarChart3 size={46} color="#3b5bdb" style={{ position: "absolute", left: 84, top: 12, opacity: 0.12 }} />
          <Coins size={48} color="#3b5bdb" style={{ position: "absolute", left: 38, top: 34, opacity: 0.12 }} />
          <Receipt size={56} color="#3b5bdb" style={{ position: "absolute", right: 8, top: 14, opacity: 0.12 }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(25,50,110,.75)", border: "1px solid rgba(90,130,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f8bff" }}><LogOut size={24} /></span>
            <span style={{ fontWeight: 900, fontSize: 17, color: C.title }}>خروج از اپلیکیشن</span>
          </div>

          {step === "choose" && (
            <div style={{ position: "relative", display: "flex", gap: 8 }}>
              <Choice tone="red" onClick={onExit} title="خروج بدون پشتیبان‌گیری" sub="خروج مستقیم از برنامه" icon={<LogOut size={22} />} />
              <Choice tone="teal" onClick={() => setStep("enc")} title="خروج با پشتیبان‌گیری" sub="ذخیره اطلاعات پیش از خروج"
                icon={<><Database size={24} /><ShieldCheck size={13} style={{ position: "absolute", bottom: 5, right: 5, background: C.panel, borderRadius: "50%" }} /></>} />
            </div>
          )}

          {step === "enc" && (
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.9, marginBottom: 8, textAlign: "center" }}>فایل پشتیبان با رمز قفل شود؟ بعد از این مرحله، پنجره‌ی انتخاب محل ذخیره (فایل‌ها، درایو، وان‌درایو، تلگرام و …) باز می‌شود.</div>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="رمز فایل پشتیبان (حداقل ۴ نویسه)" style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid rgba(90,130,255,.4)", background: "rgba(10,16,34,.9)", color: C.title, fontFamily: "inherit", fontSize: 13, outline: "none", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => run(false)} style={{ ...bigBtn("transparent", C.title, "rgba(127,143,184,.6)"), flex: 1, width: "auto" }}>بدون رمز</button>
                <button type="button" disabled={pass.length < 4} onClick={() => run(true)} style={{ ...bigBtn(pass.length < 4 ? "#1c4a47" : "#14b8a6", "#fff", "#22d3b6"), flex: 1, width: "auto", opacity: pass.length < 4 ? 0.6 : 1 }}>با رمز</button>
              </div>
              <button type="button" onClick={() => setStep("choose")} style={{ width: "100%", marginTop: 8, border: 0, background: "transparent", color: C.sub, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>بازگشت</button>
            </div>
          )}

          {step === "busy" && <div style={{ position: "relative", textAlign: "center", color: C.title, fontSize: 13, fontWeight: 700, padding: "14px 0" }}>در حال ساخت پشتیبان...</div>}

          {step === "done" && (
            <div style={{ position: "relative" }}>
              <div style={{ marginBottom: 10 }}>
                {results.map((r, i) => <div key={i} style={{ fontSize: 12, lineHeight: 1.9, color: r.ok ? "#4ade80" : "#fb7185", textAlign: "center" }}>{r.ok ? "✓" : "✗"} {r.label}: {r.text}</div>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={onClose} style={{ ...bigBtn("transparent", C.title, "rgba(127,143,184,.6)"), flex: 1, width: "auto" }}>ماندن</button>
                <button type="button" onClick={onExit} style={{ ...bigBtn("#ef4444", "#fff", "#f0594f"), flex: 1, width: "auto" }}>خروج</button>
              </div>
            </div>
          )}

          {!lock && step === "choose" && (
            <button type="button" onClick={onClose} aria-label="بستن" style={{ position: "absolute", top: -6, left: -4, border: 0, background: "transparent", color: C.sub, padding: 6, display: "flex" }}><X size={18} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
