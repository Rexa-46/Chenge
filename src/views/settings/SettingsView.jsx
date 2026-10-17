import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  ArrowDown, ArrowUp, Bell, BellRing, Check, Download, Eraser, Eye, EyeOff, Fingerprint, Moon, RotateCcw,
  Sun, Upload, Users,
} from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { AmountInput } from "../../components/inputs/AmountInput.jsx";
import { KeypadInput } from "../../components/inputs/KeypadInput.jsx";
import { normalizeHomeSections } from "../../domain/seeds.js";
import { clearPinLock, makePinRecord } from "../../services/pinLock.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND, COLOR_PRESETS } from "../../theme/palette.js";
import { pillStyle, useStyles, miniBtn } from "../../theme/styles.js";

const HOME_SECTION_LABELS = {
  shortcut: "میانبر تراکنش‌ها", operations: "عملیات", expense: "هزینه‌ها", income: "درآمدها", banks: "بانک‌ها و کارت‌ها",
  funds: "صندوق‌ها", balrep: "گزارش مانده حساب‌ها", budget: "بودجه‌بندی", loanchk: "وام‌ها و چک‌ها", contacts: "اشخاص و بدهی‌ها", bills: "یادآوری قبض‌ها",
};

/* ---------------------------------------------------------
   Settings View
--------------------------------------------------------- */
export function SettingsView({ settings, setSettings, exportBackup, importBackup, rebuildData, clearAllData }) {
  const st = useStyles();
  const t = useT();
  const fileRef = useRef();
  const [pinInput, setPinInput] = useState("");
  const [profile, setProfile] = useState(settings.profile || { name: "", phone: "", email: "" });
  return (
    <div>
      <SectionTitle text="اطلاعات کاربری" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <input placeholder="نام و نام خانوادگی" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={st.input} />
        <input placeholder="شماره تماس" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={st.input} />
        <input placeholder="ایمیل (اختیاری)" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} style={st.input} />
        <button onClick={() => setSettings((s) => ({ ...s, profile }))} style={st.primaryBtn}>ذخیره اطلاعات کاربری</button>
      </div>

      <SectionTitle text="رنگ‌بندی برنامه" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(COLOR_PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => setSettings((s) => ({ ...s, themeColor: key }))}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
              <span style={{
                width: 42, height: 42, borderRadius: "50%", background: p.header,
                border: settings.themeColor === key ? `3px solid ${p.fab}` : "3px solid transparent",
                boxShadow: settings.themeColor === key ? "0 0 0 2px #fff, 0 0 0 3px " + p.header : "none",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {settings.themeColor === key && <Check size={18} color="#fff" />}
              </span>
              <span style={{ fontSize: 10.5, color: t.text }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <SectionTitle text="ظاهر برنامه" />
      <div style={{ ...st.card, padding: "4px 12px", marginBottom: 18 }}>
        <Row title="تم روشن / تاریک" leftIcon={settings.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />} leftColor={BRAND.header}
          extra={<button onClick={() => setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{settings.theme === "dark" ? "روشن کن" : "تاریک کن"}</button>}
          chevron={null} />
      </div>

      <SectionTitle text="اندازه فونت" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: 0.9, l: "کوچک" }, { v: 1, l: "معمولی" }, { v: 1.15, l: "بزرگ" }, { v: 1.3, l: "خیلی بزرگ" }].map((o) => (
            <button key={o.v} onClick={() => setSettings((s) => ({ ...s, fontScale: o.v }))} style={pillStyle(settings.fontScale === o.v)}>{o.l}</button>
          ))}
        </div>
      </div>

      <SectionTitle text="تقویم و واحد پول" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 8 }}>تقویم</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={() => setSettings((s) => ({ ...s, calendarMode: "jalali" }))} style={pillStyle(settings.calendarMode !== "gregorian")}>شمسی</button>
          <button onClick={() => setSettings((s) => ({ ...s, calendarMode: "gregorian" }))} style={pillStyle(settings.calendarMode === "gregorian")}>میلادی</button>
        </div>
        <div style={{ fontSize: 11.5, color: "#8a8194", marginBottom: 14 }}>در این نسخه فقط قالب تاریخ تغییر می‌کند؛ متن رابط کاربری همچنان فارسی می‌ماند.</div>
        <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 8 }}>واحد نمایش پول</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setSettings((s) => ({ ...s, currency: "rial" }))} style={pillStyle(settings.currency === "rial")}>ریال</button>
          <button onClick={() => setSettings((s) => ({ ...s, currency: "toman" }))} style={pillStyle(settings.currency === "toman")}>تومان</button>
          <button onClick={() => setSettings((s) => ({ ...s, currency: "usd" }))} style={pillStyle(settings.currency === "usd")}>دلار</button>
        </div>
        {settings.currency === "usd" && (
          <>
            <div style={{ fontSize: 11.5, color: "#8a8194", marginBottom: 8 }}>اگر نرخ آنلاین در دسترس نبود، نرخ هر دلار به ریال را خودتان وارد کنید:</div>
            <AmountInput placeholder="مثلا 600000" value={settings.manualUsdRate} onChange={(v) => setSettings((s) => ({ ...s, manualUsdRate: v }))} style={st.input} />
          </>
        )}
      </div>

      <SectionTitle text="یادآوری‌ها و اعلان‌ها" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <label style={st.label}>هشدار سررسید چک چند روز قبل؟</label>
        <KeypadInput kind="digits" digitsMax={3} value={settings.checkReminderDays} onChange={(e) => setSettings((s) => ({ ...s, checkReminderDays: Number(e.target.value.replace(/[^0-9]/g, "") || 0) }))} style={st.input} inputMode="numeric" />
        <Row title="اعلان سررسید چک، قبض، قسط و یادآوری‌ها" leftIcon={<BellRing size={16} />} leftColor={BRAND.orange}
          extra={<button onClick={async () => {
            const next = settings.dueNotif === false;
            if (next && Capacitor.isNativePlatform()) {
              try {
                let p = await LocalNotifications.checkPermissions();
                if (p.display !== "granted") p = await LocalNotifications.requestPermissions();
                if (p.display !== "granted") { alert("اجازه‌ی اعلان داده نشد. از تنظیمات گوشی > برنامه‌ها > Rexa > اعلان‌ها آن را فعال کنید."); return; }
              } catch {}
            }
            setSettings((s) => ({ ...s, dueNotif: next }));
          }} style={{ background: settings.dueNotif !== false ? BRAND.green : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{settings.dueNotif !== false ? "فعال" : "غیرفعال"}</button>}
          chevron={null} />
        <Row title="اعلان تشخیص پیامک بانکی" leftIcon={<Bell size={16} />} leftColor={BRAND.orange}
          extra={<button onClick={() => setSettings((s) => ({ ...s, smsNotif: !s.smsNotif }))} style={{ background: settings.smsNotif ? BRAND.green : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{settings.smsNotif ? "فعال" : "غیرفعال"}</button>}
          chevron={null} />
        <button onClick={async () => {
          try {
            const mod = await import("capacitor-sms-inbox");
            const plugin = mod.SMSInboxReader || mod.SmsInboxReader || mod.SMSInbox || mod.SmsInbox || mod.default;
            const result = await plugin?.requestPermissions?.();
            if (result?.sms === "granted") { setSettings((s) => ({ ...s, smsAutoRead: true })); alert("مجوز خواندن پیامک فعال شد."); }
            else alert("مجوز خواندن پیامک داده نشد.");
          } catch { alert("این قابلیت فقط در APK اندروید در دسترس است."); }
        }} style={{ ...st.primaryBtn, background: BRAND.header, marginTop: 10 }}>فعال‌سازی دسترسی پیامک گوشی</button>
        <div style={{ fontSize: 11.5, color: "#8a8194", marginTop: 6 }}>Rexa برای خواندن پیامک‌های بانکی به مجوز Android نیاز دارد. این دسترسی برای APK مستقیم قابل استفاده است؛ انتشار در Google Play تابع سیاست‌های SMS آن فروشگاه است.</div>
      </div>

      <SectionTitle text="امنیت" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, color: "#8a8194", marginBottom: 10 }}>اول یک رمز عددی تنظیم کن؛ اثر انگشت به‌عنوان راه سریع‌تر بازکردن، علاوه بر رمز عددی کار می‌کند (رمز عددی همیشه به‌عنوان جایگزین در دسترس می‌ماند).</div>
        <KeypadInput kind="digits" digitsMax={6} placeholder="رمز عددی جدید (خالی = بدون قفل)" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} style={st.input} inputMode="numeric" />
        <button onClick={async () => {
          if (pinInput && pinInput.length < 4) { alert("رمز عددی باید حداقل ۴ رقم باشد."); return; }
          if (!pinInput) { setSettings((s) => ({ ...s, pin: "", pinHash: "", pinSalt: "" })); clearPinLock(); return; }
          const rec = await makePinRecord(pinInput);
          setSettings((s) => ({ ...s, pin: "", ...rec }));
          clearPinLock(); setPinInput("");
          alert("رمز عددی تنظیم شد.");
        }} style={{ ...st.primaryBtn, marginBottom: 14 }}>{pinInput ? "تنظیم رمز" : "حذف رمز"}</button>
        <Row title="باز کردن با اثر انگشت" leftIcon={<Fingerprint size={16} />} leftColor={BRAND.violet}
          extra={<button onClick={() => {
            if (!settings.biometricEnabled && !(settings.pinHash || settings.pin)) { alert("ابتدا یک رمز عددی تنظیم کنید تا قفل امن Rexa فعال شود."); return; }
            setSettings((s) => ({ ...s, biometricEnabled: !s.biometricEnabled }));
          }} style={{ background: settings.biometricEnabled ? BRAND.green : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{settings.biometricEnabled ? "فعال" : "غیرفعال"}</button>}
          chevron={null} />
        <div style={{ fontSize: 11, color: "#8a8194", marginTop: 6 }}>این گزینه از اثر انگشت یا Face ID واقعی گوشی استفاده می‌کند و فقط وقتی برنامه به‌صورت APK نصب شده باشد کار می‌کند (نه در پیش‌نمایش وب).</div>
      </div>

      <SectionTitle text="حساب مشترک خانوادگی" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, color: "#8a8194", marginBottom: 10 }}>
          با روشن‌کردن این گزینه، اطلاعات مالی (حساب‌ها، تراکنش‌ها، بودجه و...) به‌صورت مشترک ذخیره می‌شود و هر کسی که به همین برنامه دسترسی داشته باشد آن را می‌بیند. این حالت جایگزین ورود واقعی چند کاربره نیست، صرفاً یک دفتر مشترک است.
        </div>
        <Row title="فعال‌سازی حساب مشترک" leftIcon={<Users size={16} />} leftColor={BRAND.violet}
          extra={<button onClick={() => setSettings((s) => ({ ...s, sharedFamily: !s.sharedFamily }))} style={{ background: settings.sharedFamily ? BRAND.crimson : BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{settings.sharedFamily ? "غیرفعال کن" : "فعال کن"}</button>}
          chevron={null} />
      </div>

      <SectionTitle text="پشتیبان‌گیری و بازیابی" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <button onClick={exportBackup} style={{ ...st.primaryBtn, background: BRAND.header, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}><Download size={16} /> دریافت فایل پشتیبان</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])} />
        <button onClick={() => fileRef.current.click()} style={{ ...st.primaryBtn, background: BRAND.gold, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Upload size={16} /> بازیابی از فایل پشتیبان</button>
      </div>

      <SectionTitle text="نگهداری و تعمیر اطلاعات" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18 }}>
        <button onClick={rebuildData} style={{ ...st.primaryBtn, background: BRAND.violet, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}><RotateCcw size={16} /> بازسازی اطلاعات</button>
        <button onClick={clearAllData} style={{ ...st.primaryBtn, background: BRAND.crimson, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Eraser size={16} /> خام کردن اطلاعات</button>
        <div style={{ fontSize: 11.5, color: "#8a8194", marginTop: 9, lineHeight: 1.8 }}>قبل از هر دو عملیات پشتیبان تهیه می‌شود. «خام کردن» اطلاعات مالی این دستگاه را پاک و حساب‌های پایه را دوباره ایجاد می‌کند.</div>
      </div>

      <SectionTitle text="درباره همگام‌سازی با Google Drive" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18, fontSize: 12.5, color: "#8a8194" }}>
        اتصال مستقیم به Google Drive نیازمند ورود واقعی به حساب گوگل است که در این محیط در دسترس نیست. برای انتقال اطلاعات بین دستگاه‌ها از «دریافت فایل پشتیبان» استفاده کنید و همان فایل را در Drive خودتان نگه دارید یا در دستگاه دیگر «بازیابی» کنید.
      </div>

      <SectionTitle text="شخصی‌سازی نمای صفحه اول" />
      <div style={{ ...st.card, padding: "8px 12px", marginBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: "#8a8194", padding: "6px 4px 10px" }}>هر بخش را می‌توانید نمایش/مخفی کنید یا با فلش‌ها ترتیبش را عوض کنید.</div>
        {normalizeHomeSections(settings.homeSections).map((sec, i, arr) => {
          const meta = HOME_SECTION_LABELS[sec.key] || sec.key;
          function move(dir) {
            const idx = i + dir;
            if (idx < 0 || idx >= arr.length) return;
            const copy = [...arr];
            [copy[i], copy[idx]] = [copy[idx], copy[i]];
            setSettings((s) => ({ ...s, homeSections: copy }));
          }
          return (
            <div key={sec.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 4px", borderBottom: "1px solid #f0eef3" }}>
              <span style={{ fontSize: 13, fontWeight: 600, opacity: sec.visible ? 1 : 0.4 }}>{meta}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => move(-1)} style={miniBtn}><ArrowUp size={13} /></button>
                <button onClick={() => move(1)} style={miniBtn}><ArrowDown size={13} /></button>
                <button onClick={() => setSettings((s) => ({ ...s, homeSections: arr.map((x) => x.key === sec.key ? { ...x, visible: !x.visible } : x) }))}
                  style={{ ...miniBtn, background: sec.visible ? BRAND.green : "#aaa", color: "#fff" }}>
                  {sec.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle text="آموزش" />
      <div style={{ ...st.card, padding: 14, marginBottom: 18, fontSize: 13, lineHeight: 2, color: t.text }}>
        <div>• برای ثبت سریع تراکنش، دکمه‌ی سبز + پایین صفحه را بزن.</div>
        <div>• سه‌بار پشت‌سرهم روی هر جای صفحه بزن تا کادر «ثبت سریع» باز شود؛ هرچی تایپ کنی خودش تشخیص می‌ده هزینه بوده یا درآمد.</div>
        <div>• آیکون میکروفون بالای صفحه برای ثبت با صدا است (اگر گوشی‌ات پشتیبانی کند).</div>
        <div>• روی کارت‌های بانکی بالای صفحه چپ‌وراست بکش تا همه‌ی حساب‌هایت را ببینی.</div>
        <div>• از «شخصی‌سازی نمای صفحه اول» بالاتر همین صفحه، می‌توانی ترتیب و نمایش بخش‌های خانه را عوض کنی.</div>
      </div>

      <SectionTitle text="ارسال برنامه به دیگران" />
      <div style={{ ...st.card, padding: 14 }}>
        <button
          onClick={async () => {
            const text = "برنامه حسابداری Rexa رو امتحان کن!";
            if (navigator.share) { try { await navigator.share({ title: "Rexa", text }); } catch {} }
            else { try { await navigator.clipboard.writeText(text); alert("متن معرفی کپی شد."); } catch { alert(text); } }
          }}
          style={{ ...st.primaryBtn, background: BRAND.violet, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Users size={16} /> اشتراک‌گذاری برنامه
        </button>
      </div>
    </div>
  );
}
