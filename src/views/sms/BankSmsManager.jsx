import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { BellRing, RefreshCw } from "lucide-react";

import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";
import { parseBankSms } from "../../utils/smsParser.js";

/* ---------------------------------------------------------
   Bank SMS quick-add (پیامک بانکی)
--------------------------------------------------------- */
export function BankSmsManager({ openWithPrefill, onBack, categories, accounts, addTransaction }) {
  const st = useStyles();
  const t = useT();
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseBankSms(text) : null;
  const isNative = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [suggestions, setSuggestions] = useState([]); // [{ id, body, date, parsed }]
  const [confirmedIds, setConfirmedIds] = useState([]);
  const defaultAccountId = accounts[0]?.id;

  async function syncFromPhone() {
    setSyncing(true);
    setSyncError("");
    try {
      const mod = await import("capacitor-sms-inbox");
      const plugin = mod.SMSInboxReader || mod.SmsInboxReader || mod.SMSInbox || mod.SmsInbox || mod.default;
      if (!plugin) throw new Error("پلاگین پیامک در این نسخه پیدا نشد");
      let perm = await plugin.checkPermissions();
      if (perm.sms !== "granted") perm = await plugin.requestPermissions();
      if (perm.sms !== "granted") { setSyncError("اجازه‌ی دسترسی به پیامک‌ها داده نشد."); setSyncing(false); return; }
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const { smsList } = await plugin.getSMSList({ filter: { minDate: thirtyDaysAgo, maxCount: 100 } });
      const candidates = (smsList || [])
        .map((m) => ({ id: String(m.id), body: m.body || "", date: m.date, parsed: parseBankSms(m.body || "") }))
        .filter((m) => m.parsed.amount && /بانک|کارت|حساب|واریز|برداشت|خرید|پرداخت|انتقال/.test(m.body));
      setSuggestions(candidates);
      if (candidates.length === 0) setSyncError("پیامک بانکی جدیدی پیدا نشد (یا همه قبلاً بررسی شده‌اند).");
    } catch (e) {
      setSyncError("خواندن پیامک‌ها ممکن نشد. این قابلیت فقط در اپلیکیشن نصب‌شده (APK) کار می‌کند، نه در مرورگر.");
    }
    setSyncing(false);
  }

  function confirmSuggestion(s) {
    if (!defaultAccountId) { alert("اول یک حساب بانکی بساز."); return; }
    const catMatch = categories.find((c) => c.name === s.parsed.categoryHint && c.kind === s.parsed.type);
    addTransaction({
      type: s.parsed.type, amount: s.parsed.amount, categoryId: catMatch?.id || "",
      accountId: defaultAccountId, date: new Date(s.date).toISOString().slice(0, 10),
      note: s.body.slice(0, 140), tags: ["پیامک بانکی"],
    });
    setConfirmedIds((p) => [...p, s.id]);
  }

  return (
    <div>
      <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <BellRing size={16} color={BRAND.header} /> همگام‌سازی خودکار از پیامک‌های گوشی
        </div>
        {!isNative && (
          <div style={{ fontSize: 12, color: "#8a8194", marginBottom: 10 }}>
            این بخش فقط داخل اپلیکیشن نصب‌شده (APK) روی گوشی کار می‌کند، چون به مجوز خواندن پیامک نیاز داره — الان داری از پیش‌نمایش مرورگر استفاده می‌کنی.
          </div>
        )}
        <button onClick={syncFromPhone} disabled={syncing} style={{ ...st.primaryBtn, opacity: syncing ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <RefreshCw size={16} /> {syncing ? "در حال بررسی پیامک‌ها..." : "بررسی پیامک‌های بانکی گوشی"}
        </button>
        {syncError && <div style={{ fontSize: 12, color: BRAND.crimson, marginTop: 8 }}>{syncError}</div>}
      </div>

      {suggestions.length > 0 && (
        <>
          <SectionTitle text={`${toFaInt(suggestions.filter((s) => !confirmedIds.includes(s.id)).length)} تراکنش پیشنهادی از پیامک`} />
          <div style={{ ...st.card, padding: "4px 12px", marginBottom: 16 }}>
            {suggestions.map((s) => {
              const done = confirmedIds.includes(s.id);
              return (
                <div key={s.id} style={{ padding: "10px 4px", borderBottom: `1px solid ${t.border}`, opacity: done ? 0.45 : 1 }}>
                  <div style={{ fontSize: 12.5, marginBottom: 4 }}>{s.body.slice(0, 90)}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: s.parsed.type === "income" ? BRAND.darkgreen : BRAND.crimson }}>
                      {toFaInt(s.parsed.amount)} ریال — {s.parsed.type === "income" ? "دریافت" : "پرداخت"}
                    </span>
                    {!done ? (
                      <button onClick={() => confirmSuggestion(s)} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>ثبت کن</button>
                    ) : (
                      <span style={{ fontSize: 11.5, color: BRAND.darkgreen, fontWeight: 700 }}>✓ ثبت شد</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle text="یا متن پیامک را دستی بچسبان" />
      <div style={{ ...st.card, padding: 14 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="مثلا: از حساب شما مبلغ 250,000 ریال بابت خرید کسر شد..." rows={4}
          style={{ ...st.input, resize: "vertical", fontFamily: "inherit" }} />
        {parsed && (
          <div style={{ fontSize: 12.5, marginBottom: 10, color: "#8a8194" }}>
            تشخیص داده شده: {parsed.amount ? `${toFaInt(parsed.amount)} ریال` : "مبلغی یافت نشد"} — نوع: {parsed.type === "income" ? "دریافت" : "پرداخت"}
          </div>
        )}
        <button
          disabled={!parsed || !parsed.amount}
          onClick={() => { openWithPrefill({ amount: parsed.amount, type: parsed.type, note: parsed.note, categoryHint: parsed.categoryHint }); onBack(); }}
          style={{ ...st.primaryBtn, opacity: parsed && parsed.amount ? 1 : 0.5 }}>
          ادامه و تکمیل ثبت تراکنش
        </button>
      </div>
    </div>
  );
}
