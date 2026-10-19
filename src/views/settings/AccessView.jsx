import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { BellRing, Fingerprint, MessageSquare, Mic } from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

/* مدیریت دسترسی: هر مجوزِ گوشی فقط وقتی کاربر «اجازه بده» را بزند از اندروید درخواست می‌شود */
const smsPlugin = async () => { const mod = await import("capacitor-sms-inbox"); return mod.SMSInboxReader || mod.SmsInboxReader || mod.SMSInbox || mod.SmsInbox || mod.default; };
const PERMS = [
  { key: "notif", title: "اعلان سررسیدها", subtitle: "نمایش اعلان چک، قبض، قسط وام و یادآوری‌ها", Icon: BellRing,
    check: async () => (await LocalNotifications.checkPermissions()).display === "granted",
    ask: async () => (await LocalNotifications.requestPermissions()).display === "granted" },
  { key: "sms", title: "دسترسی پیامک بانکی", subtitle: "خواندن پیامک‌های بانکی برای ثبت سریع تراکنش", Icon: MessageSquare,
    check: async () => (await (await smsPlugin()).checkPermissions()).sms === "granted",
    ask: async () => (await (await smsPlugin()).requestPermissions()).sms === "granted" },
  { key: "mic", title: "میکروفون (ثبت صوتی)", subtitle: "ثبت تراکنش با گفتار", Icon: Mic,
    check: async () => { const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition"); const r = await SpeechRecognition.checkPermissions(); return (r.speechRecognition || r.permission) === "granted"; },
    ask: async () => { const { SpeechRecognition } = await import("@capgo/capacitor-speech-recognition"); const r = await SpeechRecognition.requestPermissions(); return (r.speechRecognition || r.permission) === "granted"; } },
];

export function AccessView({ settings, setSettings }) {
  const st = useStyles();
  const native = Capacitor.isNativePlatform();
  const [state, setState] = useState({});
  useEffect(() => {
    if (!native) return;
    PERMS.forEach(async (p) => { try { const ok = await p.check(); setState((s) => ({ ...s, [p.key]: ok ? "granted" : "no" })); } catch { setState((s) => ({ ...s, [p.key]: "na" })); } });
  }, [native]);
  async function ask(p) {
    try {
      const ok = await p.ask();
      setState((s) => ({ ...s, [p.key]: ok ? "granted" : "no" }));
      if (!ok) alert("اجازه داده نشد. اگر قبلاً رد کرده‌اید، از تنظیمات گوشی > برنامه‌ها > Rexa > مجوزها آن را فعال کنید.");
      else if (p.key === "sms") setSettings((x) => ({ ...x, smsAutoRead: true }));
    } catch { setState((s) => ({ ...s, [p.key]: "na" })); alert("این قابلیت فقط در برنامه‌ی نصب‌شده‌ی اندروید کار می‌کند."); }
  }
  const hasPin = !!(settings.pinHash || settings.pin);
  const bioOn = hasPin && !settings.biometricDisabled;
  return (
    <div>
      <div style={{ ...st.card, padding: 16, marginBottom: 14 }}>
        <SectionTitle text="مجوزهای گوشی" />
        <div style={{ fontSize: 11.5, color: "#8a8194", lineHeight: 1.9, marginBottom: 6 }}>هیچ مجوزی از قبل فعال نیست؛ هر کدام را خودت تأیید کن تا اندروید از تو اجازه بگیرد.</div>
        {PERMS.map((p) => {
          const s = state[p.key];
          return <Row key={p.key} title={p.title} subtitle={p.subtitle} leftIcon={<p.Icon size={17} />} leftColor={BRAND.header} chevron={null}
            extra={s === "granted" ? <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.darkgreen }}>فعال</span>
              : <button onClick={() => ask(p)} disabled={!native} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: native ? 1 : 0.5 }}>اجازه بده</button>} />;
        })}
        {!native && <div style={{ fontSize: 11.5, color: "#8a8194", marginTop: 6 }}>درخواست مجوز فقط در APK نصب‌شده کار می‌کند.</div>}
      </div>
      <div style={{ ...st.card, padding: 16 }}>
        <SectionTitle text="قفل برنامه" />
        <Row title="قفل با اثر انگشت / Face ID" subtitle={hasPin ? "با فعال بودن رمز عددی، اثر انگشت هم فعال است" : "ابتدا رمز عددی را در تنظیمات > امنیت فعال کن"} leftIcon={<Fingerprint size={17} />} leftColor={BRAND.violet}
          extra={<input type="checkbox" disabled={!hasPin} checked={bioOn} onChange={(e) => setSettings((p) => ({ ...p, biometricDisabled: !e.target.checked }))} />} chevron={null} />
      </div>
    </div>
  );
}
