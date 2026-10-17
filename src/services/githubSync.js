import { Capacitor, CapacitorHttp } from "@capacitor/core";

import { uid } from "../utils/id.js";

/* ---------------------------------------------------------
   همگام‌سازی ابری با گیت‌هاب: داده‌ها با رمز شما (AES-GCM) رمزنگاری می‌شوند و
   به‌صورت یک فایل در ریپوی گیت‌هابِ خودتان ذخیره می‌شوند. سرور = GitHub.
   توکن و رمز فقط روی همین دستگاه می‌مانند و داخل پشتیبان/فایل همگام‌سازی نمی‌روند.
--------------------------------------------------------- */
export const SYNC_CFG_KEY = "rexa:sync";
const SYNC_PATH = "rexa-data.enc.json";

const emptySyncCfg = () => ({ token: "", repo: "", pass: "", auto: true, lastSha: "", lastHash: "", lastAt: "", device: "" });
export function loadSyncCfg() {
  try { const raw = JSON.parse(localStorage.getItem(SYNC_CFG_KEY) || "{}"); const c = { ...emptySyncCfg(), ...raw, token: "", pass: "" }; if (!c.device) c.device = uid(); return c; } catch { return { ...emptySyncCfg(), device: uid(), token: "", pass: "" }; }
}
const b64 = (bytes) => { let s = ""; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
const utf8b64 = (text) => b64(new TextEncoder().encode(text));
const b64utf8 = (str) => new TextDecoder().decode(unb64(str.replace(/\s/g, "")));
function hashText(str) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return `${str.length}-${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`; }
async function aesKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function encryptSnapshot(obj, pass, meta = {}) {
  const iter = 200000, salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(pass, salt, iter);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return JSON.stringify({ app: "rexa", v: 1, kdf: "PBKDF2-SHA256", iter, salt: b64(salt), iv: b64(iv), ct: b64(ct), updatedAt: new Date().toISOString(), ...meta });
}
export async function decryptSnapshot(text, pass) {
  let env; try { env = JSON.parse(text); } catch { throw new Error("BAD_FILE"); }
  if (env.app !== "rexa" || !env.ct) throw new Error("BAD_FILE");
  try {
    const key = await aesKey(pass, unb64(env.salt), env.iter || 200000);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(env.iv) }, key, unb64(env.ct));
    return { data: JSON.parse(new TextDecoder().decode(pt)), meta: env };
  } catch { throw new Error("BAD_PASS"); }
}
async function ghFetch(cfg, method, path, body, raw) {
  const url = `https://api.github.com${path}`;
  const headers = { Authorization: `Bearer ${cfg.token}`, Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (body) headers["Content-Type"] = "application/json";
  let status, data;
  if (Capacitor.isNativePlatform()) {
    const r = await CapacitorHttp.request({ url, method, headers, data: body, connectTimeout: 15000, readTimeout: 30000, responseType: raw ? "text" : "json" });
    status = r.status; data = r.data;
  } else {
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    status = r.status; data = raw && r.ok ? await r.text() : await r.json().catch(() => ({}));
  }
  if (typeof data === "string" && !raw) { try { data = JSON.parse(data); } catch {} }
  return { status, data };
}
const ghErr = (r) => { const e = new Error(r.data?.message || `HTTP ${r.status}`); e.status = r.status; return e; };
export async function ghGetFile(cfg) {
  const path = `/repos/${cfg.repo}/contents/${SYNC_PATH}`;
  const r = await ghFetch(cfg, "GET", path);
  if (r.status === 404) return { exists: false };
  if (r.status !== 200) throw ghErr(r);
  let text = r.data.content && r.data.encoding === "base64" ? b64utf8(r.data.content) : null;
  if (text === null || (r.data.size > 0 && !text)) { const r2 = await ghFetch(cfg, "GET", path, null, true); if (r2.status !== 200) throw ghErr(r2); text = typeof r2.data === "string" ? r2.data : JSON.stringify(r2.data); }
  return { exists: true, sha: r.data.sha, text };
}
export async function ghPutFile(cfg, text, sha) {
  const r = await ghFetch(cfg, "PUT", `/repos/${cfg.repo}/contents/${SYNC_PATH}`, { message: `Rexa sync ${new Date().toISOString()}`, content: utf8b64(text), ...(sha ? { sha } : {}) });
  if (r.status !== 200 && r.status !== 201) throw ghErr(r);
  return r.data?.content?.sha || "";
}
export async function ghRepoInfo(cfg) {
  const r = await ghFetch(cfg, "GET", `/repos/${cfg.repo}`);
  if (r.status !== 200) throw ghErr(r);
  return { isPrivate: !!r.data.private, canPush: r.data.permissions ? !!r.data.permissions.push : true };
}
export function syncErrorText(e) {
  const m = String(e?.message || e);
  if (m === "BAD_PASS") return "رمز همگام‌سازی با داده‌ی روی گیت‌هاب نمی‌خواند.";
  if (m === "BAD_FILE") return "فایل روی گیت‌هاب فایل Rexa نیست.";
  if (e?.status === 401) return "توکن نامعتبر یا منقضی است.";
  if (e?.status === 403) return "دسترسی توکن کافی نیست (باید Contents: Read and write باشد) یا محدودیت گیت‌هاب.";
  if (e?.status === 404) return "ریپو پیدا نشد یا توکن به آن دسترسی ندارد.";
  if (e?.status === 409 || e?.status === 422) return "تعارض در ذخیره؛ دوباره تلاش کنید.";
  if (/network|failed to fetch|timeout|load failed/i.test(m)) return "اتصال اینترنت برقرار نیست.";
  return `خطا: ${m.slice(0, 120)}`;
}

export const SYNC_DEBOUNCE_MS = 20000;
export const syncReady = (c) => !!(c.token && /^[\w.-]+\/[\w.-]+$/.test(c.repo || "") && (c.pass || "").length >= 8);
export const localSnapshotHash = (snap) => { const { exportedAt, ...rest } = snap || {}; return hashText(JSON.stringify(rest)); };
