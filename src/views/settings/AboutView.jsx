import { Capacitor } from "@capacitor/core";

import { RexaLogo } from "../../components/brand/RexaLogo.jsx";
import { APP_BUILD, APP_REPO } from "../../config/buildInfo.js";
import { openExternalUrl } from "../../services/updates.js";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";

export function AboutView({ updateInfo, updateMsg, checkUpdateNow }) {
  const st = useStyles(); const t = useT();
  return <div><div style={{ ...st.card, padding: 20, textAlign: "center" }}>
    <RexaLogo size={78} />
    <div style={{ fontWeight: 900, fontSize: 19, marginTop: 8 }}>Rexa</div>
    <div style={{ fontSize: 12, color: t.sub, marginTop: 5 }}>مدیریت مالی شخصی</div>
    <div style={{ borderTop: "1px solid #eee", margin: "18px 0", paddingTop: 14, fontSize: 12.5, lineHeight: 2 }}>نسخه ۴.۶.۹{APP_BUILD ? ` (ساخت ${toFaInt(APP_BUILD)})` : ""}<br />Android / Capacitor<br />Rexa Personal Finance</div>
    {Capacitor.isNativePlatform() && APP_REPO && <>
      <button onClick={() => checkUpdateNow?.(true)} style={st.primaryBtn}>بررسی به‌روزرسانی</button>
      {updateMsg && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: BRAND.darkgreen }}>{updateMsg}</div>}
      {updateInfo && <button onClick={() => openExternalUrl(updateInfo.url)} style={{ ...st.primaryBtn, marginTop: 10, background: BRAND.green }}>دانلود نسخه‌ی {updateInfo.name}</button>}
    </>}
  </div></div>;
}
