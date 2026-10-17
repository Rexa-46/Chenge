import { useEffect, useRef, useState } from "react";
import { secureGet, secureRemove, secureSet } from "../services/nativeStorage.js";

import { APP_BUILD } from "../config/buildInfo.js";
import {
  decryptSnapshot, encryptSnapshot, ghGetFile, ghPutFile, ghRepoInfo, loadSyncCfg, localSnapshotHash,
  SYNC_CFG_KEY, SYNC_DEBOUNCE_MS, syncErrorText, syncReady,
} from "../services/githubSync.js";

// منطق همگام‌سازی: getSnapshot() داده‌ی فعلی را می‌دهد، applySnapshot(data) داده‌ی دریافتی را جایگزین می‌کند
export function useGithubSync({ loaded, getSnapshot, applySnapshot, deps }) {
  const [cfg, setCfg] = useState(loadSyncCfg);
  const cfgRef = useRef(cfg);
  const [state, setState] = useState({ busy: false, msg: null, conflict: null });
  const busy = useRef(false);
  const timer = useRef(null);
  const started = useRef(false);
  const secretsLoaded = useRef(false);
  const [secretsReady, setSecretsReady] = useState(false);   // تا بعد از خواندن توکن، همگام‌سازی خودکار شروع نشود
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [tok, pass] = await Promise.all([secureGet("rexa.github.token"), secureGet("rexa.github.pass")]);
        if (!alive) return;
        const token = tok || ""; const syncPass = pass || "";
        const next = { ...cfgRef.current, token, pass: syncPass };
        cfgRef.current = next; setCfg(next); secretsLoaded.current = true; setSecretsReady(true);
      } catch { secretsLoaded.current = true; if (alive) setSecretsReady(true); }
    })();
    return () => { alive = false; };
  }, []);
  const saveCfg = (patch) => {
    const next = { ...cfgRef.current, ...patch };
    cfgRef.current = next; setCfg(next);
    const safe = { ...next, token: undefined, pass: undefined };
    delete safe.token; delete safe.pass;
    try { localStorage.setItem(SYNC_CFG_KEY, JSON.stringify(safe)); } catch {}
    if (patch.token !== undefined) secureSet("rexa.github.token", patch.token).catch(() => {});
    if (patch.pass !== undefined) secureSet("rexa.github.pass", patch.pass).catch(() => {});
    return next;
  };
  const fail = (e) => setState((x) => ({ ...x, busy: false, msg: { ok: false, text: syncErrorText(e) } }));
  const remoteInfo = (text) => { try { const m = JSON.parse(text); return { updatedAt: m.updatedAt, device: m.device }; } catch { return {}; } };

  async function runSync(mode, { force = false } = {}) {
    const c = cfgRef.current;
    if (!syncReady(c) || busy.current) return;
    busy.current = true; setState((x) => ({ ...x, busy: true, msg: null }));
    try {
      const remote = await ghGetFile(c);
      const snap = getSnapshot(); const hash = localSnapshotHash(snap);
      const localDirty = hash !== c.lastHash;
      const remoteChanged = remote.exists && remote.sha !== c.lastSha;
      let action = mode;
      if (mode === "auto") action = !remote.exists ? "push" : !remoteChanged ? (localDirty ? "push" : "none") : (c.lastSha && !localDirty ? "pull" : "conflict");
      else if (mode === "push" && remoteChanged && !force) action = "conflict";
      if (action === "conflict") { setState({ busy: false, msg: null, conflict: { ...remoteInfo(remote.text), sha: remote.sha } }); return; }
      if (action === "none") { setState({ busy: false, conflict: null, msg: { ok: true, text: "همه‌چیز با گیت‌هاب یکی است." } }); return; }
      if (action === "pull") {
        if (!remote.exists) { setState({ busy: false, conflict: null, msg: { ok: false, text: "هنوز داده‌ای در گیت‌هاب ذخیره نشده است." } }); return; }
        const { data } = await decryptSnapshot(remote.text, c.pass);
        applySnapshot(data);
        saveCfg({ lastSha: remote.sha, lastAt: new Date().toISOString() });
        setTimeout(() => { saveCfg({ lastHash: localSnapshotHash(getSnapshot()) }); }, 1500);
        setState({ busy: false, conflict: null, msg: { ok: true, text: "داده‌ها از گیت‌هاب دریافت شد." } });
        return;
      }
      const text = await encryptSnapshot(snap, c.pass, { device: c.device, build: APP_BUILD });
      const sha = await ghPutFile(c, text, remote.exists ? remote.sha : undefined);
      saveCfg({ lastSha: sha, lastHash: hash, lastAt: new Date().toISOString() });
      setState({ busy: false, conflict: null, msg: { ok: true, text: "داده‌ها (رمزگذاری‌شده) در گیت‌هاب ذخیره شد." } });
    } catch (e) { fail(e); }
    finally { busy.current = false; }
  }
  // اتصال: ابتدا ریپو و دسترسی بررسی می‌شود؛ ریپوی عمومی پذیرفته نمی‌شود
  async function connect(patch) {
    const next = { ...cfgRef.current, ...patch, token: (patch.token || "").trim(), repo: (patch.repo || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "") };
    if (!syncReady(next)) { setState((x) => ({ ...x, msg: { ok: false, text: "توکن، نام ریپو به شکل «نام‌کاربری/نام‌ریپو» و رمز همگام‌سازی (حداقل ۸ نویسه) لازم است." } })); return false; }
    if (typeof crypto === "undefined" || !crypto.subtle) { setState((x) => ({ ...x, msg: { ok: false, text: "رمزنگاری در این محیط در دسترس نیست." } })); return false; }
    setState((x) => ({ ...x, busy: true, msg: null }));
    try {
      const info = await ghRepoInfo(next);
      if (!info.isPrivate) { setState((x) => ({ ...x, busy: false, msg: { ok: false, text: "این ریپو عمومی است. برای اطلاعات مالی فقط ریپوی «خصوصی (Private)» مجاز است." } })); return false; }
      if (!info.canPush) { setState((x) => ({ ...x, busy: false, msg: { ok: false, text: "توکن اجازه‌ی نوشتن در این ریپو را ندارد." } })); return false; }
    } catch (e) { fail(e); return false; }
    const changedTarget = next.repo !== cfgRef.current.repo || next.token !== cfgRef.current.token;
    saveCfg({ ...next, ...(changedTarget ? { lastSha: "", lastHash: "", lastAt: "" } : {}) });
    setState((x) => ({ ...x, busy: false }));
    await runSync("auto");
    return true;
  }
  async function disconnect() {
    clearTimeout(timer.current);
    await secureRemove("rexa.github.token").catch(() => {});
    await secureRemove("rexa.github.pass").catch(() => {});
    saveCfg({ token: "", pass: "", repo: "", lastSha: "", lastHash: "", lastAt: "" });
    setState({ busy: false, msg: { ok: true, text: "اتصال قطع شد و توکن از این گوشی پاک شد." }, conflict: null });
  }
  // همگام‌سازی خودکار: یک بار بعد از بارگذاری برنامه و ۲۰ ثانیه بعد از هر تغییر داده
  useEffect(() => {
    if (!loaded || started.current || !secretsLoaded.current) return;
    started.current = true;
    if (cfgRef.current.auto && syncReady(cfgRef.current)) runSync("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, secretsReady]);
  useEffect(() => {
    if (!loaded || !started.current) return;
    if (!cfgRef.current.auto || !syncReady(cfgRef.current)) return;
    clearTimeout(timer.current);
    // حالت auto فقط وقتی چیزی را می‌فرستد که داده‌ی این گوشی واقعاً با آخرین همگام‌سازی فرق داشته باشد
    timer.current = setTimeout(() => runSync("auto"), SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, deps);
  return { cfg, state, runSync, connect, disconnect, setAuto: (auto) => saveCfg({ auto }) };
}
