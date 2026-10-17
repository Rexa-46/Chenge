import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { syncReady } from "../../services/githubSync.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { faLongDate } from "../../utils/dates.js";

export function CloudSyncView({ cloud }) {
  const st = useStyles(); const t = useT();
  const { cfg, state } = cloud;
  const [token, setToken] = useState(cfg.token);
  const [repo, setRepo] = useState(cfg.repo);
  const [pass, setPass] = useState(cfg.pass);
  const connected = syncReady(cfg);
  const ltr = { ...st.input, direction: "ltr", textAlign: "left" };
  const btn = (bg, extra = {}) => ({ ...st.primaryBtn, background: bg, opacity: state.busy ? 0.6 : 1, ...extra });
  return <div>
    <div style={{ ...st.card, padding: 14, marginBottom: 14 }}>
      <div style={{ fontWeight: 800, marginBottom: 8 }}>ذخیره‌ی داده‌ها روی گیت‌هاب</div>
      <div style={{ fontSize: 12.5, lineHeight: 2, color: t.sub }}>
        داده‌های شما روی همین گوشی با رمز خودتان رمزگذاری می‌شود و فقط متن رمزشده در یک ریپوی <b>خصوصی</b> گیت‌هاب ذخیره می‌شود. با همین ریپو و رمز می‌توانید در گوشی دیگر یا بعد از نصب دوباره، داده‌ها را برگردانید.
        <br />۱) در گیت‌هاب یک ریپوی خصوصی بسازید (مثلاً rexa-data).
        <br />۲) در Settings ← Developer settings ← Fine-grained tokens توکنی فقط برای همان ریپو با دسترسی Contents: Read and write بسازید.
        <br />۳) رمز همگام‌سازی را فراموش نکنید؛ بدون آن داده قابل بازیابی نیست.
      </div>
    </div>
    <div style={{ ...st.card, padding: 14, marginBottom: 14 }}>
      <label style={st.label}>ریپوی خصوصی (نام‌کاربری/نام‌ریپو)</label>
      <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="username/rexa-data" style={ltr} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <label style={st.label}>توکن گیت‌هاب</label>
      <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_..." type="password" style={ltr} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <label style={st.label}>رمز همگام‌سازی (حداقل ۸ نویسه)</label>
      <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="رمز رمزگذاری داده‌ها" type="password" style={ltr} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      <button disabled={state.busy} onClick={() => cloud.connect({ token, repo, pass })} style={btn(BRAND.header)}>{state.busy ? "در حال انجام..." : connected ? "ذخیره‌ی تنظیمات و همگام‌سازی" : "اتصال به گیت‌هاب"}</button>
    </div>
    {state.msg && <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, lineHeight: 1.9, color: state.msg.ok ? BRAND.darkgreen : BRAND.crimson }}>{state.msg.text}</div>}
    {state.conflict && <div style={{ ...st.card, padding: 14, marginBottom: 14, border: "1.5px solid #f0c777" }}>
      <div style={{ fontWeight: 800, marginBottom: 6, color: "#8a5a00" }}>تفاوت بین این گوشی و گیت‌هاب</div>
      <div style={{ fontSize: 12.5, lineHeight: 2, color: t.sub, marginBottom: 10 }}>روی گیت‌هاب داده‌ی دیگری هست{state.conflict.updatedAt ? ` (آخرین ذخیره: ${faLongDate(new Date(state.conflict.updatedAt))})` : ""}. کدام نگه داشته شود؟</div>
      <button disabled={state.busy} onClick={() => { if (window.confirm("داده‌های این گوشی با نسخه‌ی گیت‌هاب جایگزین می‌شود. ادامه می‌دهید؟")) cloud.runSync("pull"); }} style={btn(BRAND.green)}>دریافت از گیت‌هاب (جایگزین داده‌ی این گوشی)</button>
      <button disabled={state.busy} onClick={() => { if (window.confirm("داده‌ی گیت‌هاب با داده‌ی این گوشی جایگزین می‌شود. ادامه می‌دهید؟")) cloud.runSync("push", { force: true }); }} style={btn(BRAND.crimson, { marginTop: 8 })}>جایگزینی گیت‌هاب با داده‌ی این گوشی</button>
    </div>}
    {connected && <div style={{ ...st.card, padding: 14 }}>
      <div style={{ fontSize: 12.5, color: t.sub, marginBottom: 10 }}>{cfg.lastAt ? `آخرین همگام‌سازی: ${faLongDate(new Date(cfg.lastAt))}` : "هنوز همگام‌سازی نشده است."}</div>
      <Row title="همگام‌سازی خودکار" subtitle="بعد از هر تغییر و هنگام باز شدن برنامه" leftIcon={<RefreshCw size={16} />} leftColor={BRAND.teal}
        extra={<button onClick={() => cloud.setAuto(!cfg.auto)} style={{ background: cfg.auto ? BRAND.green : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{cfg.auto ? "فعال" : "غیرفعال"}</button>} chevron={null} />
      <button disabled={state.busy} onClick={() => cloud.runSync("push")} style={btn(BRAND.violet, { marginTop: 10 })}>ارسال به گیت‌هاب</button>
      <button disabled={state.busy} onClick={() => { if (window.confirm("داده‌های این گوشی با نسخه‌ی گیت‌هاب جایگزین می‌شود. ادامه می‌دهید؟")) cloud.runSync("pull"); }} style={btn(BRAND.green, { marginTop: 8 })}>دریافت از گیت‌هاب</button>
      <button disabled={state.busy} onClick={() => { if (window.confirm("اتصال قطع شود و توکن و رمز از این گوشی پاک شوند؟ (داده‌های گیت‌هاب حذف نمی‌شوند)")) { cloud.disconnect(); setToken(""); setPass(""); setRepo(""); } }} style={btn("#8a8a8a", { marginTop: 8 })}>قطع اتصال</button>
    </div>}
  </div>;
}
