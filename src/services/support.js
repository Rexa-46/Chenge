import { Capacitor, CapacitorHttp } from "@capacitor/core";

export const SUPPORT_EMAIL = "r.shadfar@live.com";
export const TICKETS_KEY = "rexa:tickets";
// ارسال واقعی تیکت به ایمیل پشتیبانی (بدون نیاز به سرور؛ از سرویس FormSubmit استفاده می‌شود)
export async function sendTicketEmail(tk, who = {}) {
  const payload = {
    _subject: `تیکت جدید Rexa — ${String(tk.id).slice(-6)}`,
    _template: "table",
    _captcha: "false",
    name: who.name || "کاربر Rexa",
    message: tk.text,
    ticket_id: tk.id,
    date: tk.date,
    platform: (typeof Capacitor !== "undefined" && Capacitor.getPlatform) ? Capacitor.getPlatform() : "web",
  };
  if (tk.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tk.email)) payload.email = tk.email; // آدرس پاسخ‌دادن
  const url = `https://formsubmit.co/ajax/${SUPPORT_EMAIL}`;
  let status = 0, data = {};
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.post({ url, headers: { "Content-Type": "application/json", Accept: "application/json" }, data: payload, connectTimeout: 12000, readTimeout: 20000 });
    status = r.status; data = typeof r.data === "string" ? (() => { try { return JSON.parse(r.data); } catch { return {}; } })() : (r.data || {});
  } else {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const tm = ctl ? setTimeout(() => ctl.abort(), 20000) : null;
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), signal: ctl?.signal });
      status = r.status; data = await r.json().catch(() => ({}));
    } finally { if (tm) clearTimeout(tm); }
  }
  if (status >= 200 && status < 300 && (data.success === true || data.success === "true")) return true;
  throw new Error(data.message || `HTTP ${status}`);
}
