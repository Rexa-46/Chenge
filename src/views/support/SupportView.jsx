import { useEffect, useRef, useState } from "react";

import { EmptyRow } from "../../components/common/EmptyRow.jsx";
import { sendTicketEmail, SUPPORT_EMAIL, TICKETS_KEY } from "../../services/support.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { faLongDate } from "../../utils/dates.js";
import { uid } from "../../utils/id.js";

export function SupportView({ settings }) {
  const st = useStyles(); const t = useT();
  const prof = settings?.profile || {};
  const [message, setMessage] = useState("");
  const [replyEmail, setReplyEmail] = useState(prof.email || "");
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const loadTickets = () => {
    try { return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]").map((x) => (typeof x.sent === "boolean" ? x : { ...x, sent: false, pending: false, status: "ارسال نشده" })); } catch { return []; }
  };
  const [tickets, setTickets] = useState(loadTickets);
  const ref = useRef(tickets);
  const queue = useRef(false);
  const save = (next) => { ref.current = next; setTickets(next); try { localStorage.setItem(TICKETS_KEY, JSON.stringify(next)); } catch {} };
  const patch = (id, p) => save(ref.current.map((x) => (x.id === id ? { ...x, ...p } : x)));
  async function deliver(tk) {
    patch(tk.id, { pending: true, status: "در حال ارسال..." });
    try {
      await sendTicketEmail(tk, { name: prof.name });
      patch(tk.id, { sent: true, pending: false, status: "ارسال‌شده", sentAt: new Date().toISOString(), error: "" });
      return true;
    } catch (e) {
      patch(tk.id, { sent: false, pending: true, status: "در انتظار ارسال", error: String(e?.message || e).slice(0, 140) });
      return false;
    }
  }
  async function flush() {
    if (queue.current) return; queue.current = true;
    try { for (const tk of ref.current.filter((x) => x.pending && !x.sent)) await deliver(tk); } finally { queue.current = false; }
  }
  useEffect(() => {
    flush();
    const on = () => flush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, []);
  async function send() {
    const text = message.trim(); if (!text || busy) return;
    const tk = { id: uid(), text, date: new Date().toISOString(), email: replyEmail.trim(), sent: false, pending: true, status: "در حال ارسال..." };
    save([tk, ...ref.current]); setMessage(""); setBusy(true); setNote(null);
    const ok = await deliver(tk);
    setBusy(false);
    setNote(ok ? { ok: true, text: "تیکت ثبت شد و به ایمیل پشتیبانی ارسال شد." } : { ok: false, text: "ارسال انجام نشد (اینترنت یا سرویس ایمیل). تیکت ذخیره شد و دوباره تلاش می‌شود؛ می‌توانید «ارسال دوباره» یا «ارسال با برنامه ایمیل» را هم بزنید." });
  }
  async function retry(tk) { setNote(null); const ok = await deliver(tk); setNote(ok ? { ok: true, text: "تیکت ارسال شد." } : { ok: false, text: "هنوز ارسال نشد. اینترنت را بررسی کنید یا با برنامه ایمیل بفرستید." }); }
  function viaMailApp(tk) {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("تیکت Rexa")}&body=${encodeURIComponent(tk.text)}`;
    try { window.location.href = url; } catch {}
  }
  const color = (x) => (x.sent ? BRAND.teal : x.status === "در حال ارسال..." ? BRAND.gold : BRAND.crimson);
  const smallBtn = { border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>پشتیبانی و تیکت</div>
      <div style={{ fontSize: 12, color: t.sub, marginBottom: 10, lineHeight: 1.9 }}>پیام شما ثبت می‌شود و مستقیم به ایمیل پشتیبانی ارسال می‌گردد. اطلاعات مالی شما همراه پیام فرستاده نمی‌شود.</div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="متن درخواست یا مشکل..." style={{ ...st.input, minHeight: 120, resize: "vertical" }} />
      <input value={replyEmail} onChange={(e) => setReplyEmail(e.target.value)} placeholder="ایمیل شما برای پاسخ (اختیاری)" style={{ ...st.input, direction: "ltr", textAlign: "left" }} inputMode="email" autoCapitalize="off" />
      <button onClick={send} disabled={busy} style={{ ...st.primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? "در حال ارسال..." : "ثبت و ارسال تیکت"}</button>
      {note && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, lineHeight: 1.9, color: note.ok ? BRAND.darkgreen : BRAND.crimson }}>{note.text}</div>}
    </div>
    <div style={{ ...st.card, padding: "4px 12px" }}>
      {tickets.length === 0 ? <EmptyRow text="تیکتی ثبت نشده" /> : tickets.map((x) => (
        <div key={x.id} style={{ padding: "11px 0", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.9, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{x.text}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span style={{ fontSize: 11.5, color: t.sub }}>{faLongDate(new Date(x.date))}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: color(x) }}>{x.status}</span>
          </div>
          {!x.sent && x.status !== "در حال ارسال..." && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => retry(x)} style={{ ...smallBtn, background: BRAND.header, color: "#fff" }}>ارسال دوباره</button>
              <button onClick={() => viaMailApp(x)} style={{ ...smallBtn, background: t.input, color: t.text }}>ارسال با برنامه ایمیل</button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>;
}
