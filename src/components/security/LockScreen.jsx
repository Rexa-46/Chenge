import { useEffect, useState } from "react";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { Capacitor } from "@capacitor/core";
import { Fingerprint } from "lucide-react";

import { RexaLogo } from "../brand/RexaLogo.jsx";
import { clearPinLock, hydratePinLock, lockRemainingMs, readPinLock, registerPinFail, touchPinLock, verifyPin } from "../../services/pinLock.js";
import { BRAND, FONT } from "../../theme/palette.js";
import { toFaInt } from "../../utils/format.js";

export function LockScreen({ pin, pinHash, pinSalt, onUnlock, biometricEnabled }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioChecked, setBioChecked] = useState(false);
  const isNative = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const [now, setNow] = useState(Date.now());
  const [lock, setLock] = useState(() => readPinLock());
  const remaining = Math.ceil(lockRemainingMs(lock) / 1000);   // now فقط برای رندر دوباره‌ی شمارش معکوس است
  useEffect(() => {
    if (!remaining) return;
    const tm = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tm);
  }, [remaining > 0]);
  useEffect(() => { hydratePinLock().then((l) => { setLock({ ...l }); touchPinLock(); }); }, []);
  async function submitPin() {
    if (remaining > 0 || !val) return;
    if (await verifyPin(val, { pin, pinHash, pinSalt })) { clearPinLock(); onUnlock(); return; }
    setLock({ ...registerPinFail() }); setNow(Date.now()); setErr(true); setVal("");
  }

  async function tryBiometric() {
    if (!biometricEnabled || !isNative) { setBioChecked(true); return; }
    try {
      const info = await BiometricAuth.checkBiometry();
      setBioAvailable(!!info.isAvailable);
      if (info.isAvailable) {
        try {
          await BiometricAuth.authenticate({
            reason: "برای باز کردن Rexa هویتت رو تایید کن",
            cancelTitle: "لغو",
            allowDeviceCredential: false,   // رمز/الگوی گوشی نباید رمز Rexa را دور بزند
          });
          onUnlock();
          return;
        } catch { /* user cancelled or failed — fall back to PIN, shown below */ }
      }
    } catch { /* biometric not available on this device */ }
    setBioChecked(true);
  }
  // فقط یک‌بار هنگام نمایش قفل، بیومتریک امتحان می‌شود
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { tryBiometric(); }, []);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: BRAND.header, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff", gap: 18, maxWidth: 480, margin: "0 auto" }}>
      <RexaLogo size={64} />
      <div style={{ fontWeight: 700, fontSize: 16 }}>Rexa قفل است</div>
      {biometricEnabled && isNative && bioAvailable && (
        <button onClick={tryBiometric} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
          <span style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Fingerprint size={30} /></span>
          <span style={{ fontSize: 12 }}>ورود با اثر انگشت</span>
        </button>
      )}
      <input
        type="password" inputMode="numeric" maxLength={6} value={val}
        onChange={(e) => { setVal(e.target.value.replace(/[^0-9]/g, "")); setErr(false); }}
        placeholder="رمز عبور"
        style={{ width: 180, textAlign: "center", fontSize: 22, letterSpacing: 6, padding: "10px", borderRadius: 10, border: "none", outline: "none" }}
      />
      {remaining > 0
        ? <div style={{ color: "#ffb3c1", fontSize: 13, textAlign: "center", maxWidth: 260 }}>تلاش ناموفق زیاد بود. {toFaInt(remaining)} ثانیه دیگر دوباره تلاش کنید.</div>
        : err && <div style={{ color: "#ffb3c1", fontSize: 13 }}>رمز اشتباه است</div>}
      <button onClick={submitPin} disabled={remaining > 0}
        style={{ background: BRAND.fab, color: "#fff", border: "none", borderRadius: 9, padding: "10px 30px", fontWeight: 700, cursor: "pointer", opacity: remaining > 0 ? 0.5 : 1 }}>
        باز کردن
      </button>
      {biometricEnabled && !isNative && bioChecked && (
        <div style={{ fontSize: 11.5, color: "#d8c9e8", marginTop: 6, maxWidth: 260, textAlign: "center" }}>
          قفل اثر انگشت فقط در نسخه‌ی نصب‌شده‌ی APK کار می‌کند؛ در این پیش‌نمایش وب فقط رمز عددی در دسترس است.
        </div>
      )}
    </div>
  );
}
