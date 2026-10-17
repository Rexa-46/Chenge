import { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

import { APP_BUILD, APP_REPO } from "../config/buildInfo.js";
import { checkLatestRelease, getUpdateError } from "../services/updates.js";
import { toFaInt } from "../utils/format.js";

export function useAppUpdates({ loaded }) {
  // بررسی نسخه‌ی جدید برنامه از GitHub Releases (فقط در APK)
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateMsg, setUpdateMsg] = useState("");
  async function checkUpdateNow(manual = true) {
    if (!APP_REPO || !APP_BUILD) { if (manual) setUpdateMsg("اطلاعات نسخه در این ساخت موجود نیست (فقط نسخه‌ی ساخته‌شده توسط GitHub Actions)."); return; }
    try {
      const r = await checkLatestRelease(APP_REPO);
      try { localStorage.setItem("rexa:updChk", String(Date.now())); } catch {}
      if (r && r.build > Number(APP_BUILD)) { setUpdateInfo(r); setUpdateMsg(manual ? `نسخه‌ی جدید ${r.name} آماده است.` : ""); }
      else { setUpdateInfo(null); if (manual) setUpdateMsg(r ? `شما آخرین نسخه را دارید (نسخه‌ی شما ${toFaInt(APP_BUILD)}، آخرین منتشرشده ${toFaInt(r.build)}).` : `بررسی انجام نشد (${getUpdateError() || "اینترنت یا دسترسی به ریپو"}).`); }
    } catch { if (manual) setUpdateMsg("بررسی انجام نشد (اینترنت قطع است)."); }
  }
  useEffect(() => {
    if (!loaded || !Capacitor.isNativePlatform()) return;
    // هر بار برنامه باز شود یا از پس‌زمینه برگردد (حداکثر هر ۱۰ دقیقه) نسخه‌ی جدید بررسی می‌شود
    const run = () => { let last = 0; try { last = Number(localStorage.getItem("rexa:updChk") || 0); } catch {} if (Date.now() - last > 10 * 60 * 1000) checkUpdateNow(false); };
    run();
    let h; CapacitorApp.addListener("appStateChange", (st) => { if (st.isActive) run(); }).then((x) => { h = x; }).catch(() => {});
    return () => { try { h?.remove(); } catch {} };
  }, [loaded]);

  return { updateInfo, setUpdateInfo, updateMsg, checkUpdateNow };
}
