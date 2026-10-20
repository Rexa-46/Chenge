import { secureGet, secureRemove, secureSet } from "./nativeStorage.js";
/* ---------------------------------------------------------
   امنیت رمز عددی: رمز هرگز به‌صورت متن ساده ذخیره نمی‌شود (هش + salt)،
   داخل فایل پشتیبان نمی‌رود و بعد از چند تلاش اشتباه موقتاً قفل می‌شود.
--------------------------------------------------------- */
const PIN_LOCK_KEY = "rexa:pinLock";
const PIN_FREE_TRIES = 5;
export const withoutPin = (st = {}) => { const { pin, pinHash, pinSalt, ...rest } = st; return rest; };
const hexOf = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
async function derivePinHash(pin, salt, scheme) {
  if (scheme === "p1") {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
    return hexOf(bits);
  }
  // روش جایگزین وقتی crypto.subtle در دسترس نباشد
  const str = `${salt}:${pin}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let r = 0; r < 3000; r++) for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}
export async function makePinRecord(pin) {
  let salt = "";
  try { salt = hexOf(crypto.getRandomValues(new Uint8Array(16))); } catch { salt = Math.random().toString(16).slice(2) + Date.now().toString(16); }
  let scheme = typeof crypto !== "undefined" && crypto.subtle ? "p1" : "f1";
  let hash;
  try { hash = await derivePinHash(String(pin), salt, scheme); } catch { scheme = "f1"; hash = await derivePinHash(String(pin), salt, scheme); }
  return { pinHash: `${scheme}:${hash}`, pinSalt: salt };
}
export async function verifyPin(input, { pin, pinHash, pinSalt }) {
  try {
    if (pinHash) {
      const [scheme, hash] = String(pinHash).split(":");
      return (await derivePinHash(String(input), pinSalt || "", scheme)) === hash;
    }
    if (pin) return String(input) === String(pin); // رمز قدیمی؛ بلافاصله بعد از ورود به هش تبدیل می‌شود
  } catch {}
  return false;
}
/* شمارنده‌ی تلاش‌های ناموفق:
   - در حافظه + localStorage + (در APK) SecureStorage نگه‌داری می‌شود؛
   - زمان قفل با ساعت دیواری و یک ساعت یکنواخت (performance.now) سنجیده می‌شود؛ عقب بردن ساعت گوشی (lastSeen)
     و جلو بردن ساعت در همان اجرای برنامه (anchor) قفل را کوتاه نمی‌کند. */
let _lock = null;
let _anchor = null;   // { until, ms, perf } — فقط برای همین اجرای برنامه
const normLock = (v) => ({ fails: Number(v?.fails) || 0, until: Number(v?.until) || 0, lastSeen: Number(v?.lastSeen) || 0 });
function persistLock(next) {
  _lock = next;
  try { localStorage.setItem(PIN_LOCK_KEY, JSON.stringify(next)); } catch {}
  secureSet(PIN_LOCK_KEY, JSON.stringify(next)).catch(() => {});
}
export function readPinLock() {
  if (_lock) return _lock;
  try { _lock = normLock(JSON.parse(localStorage.getItem(PIN_LOCK_KEY) || "null")); } catch { _lock = normLock(null); }
  return _lock;
}
// خواندن نسخه‌ی SecureStorage و ادغام با نسخه‌ی محلی (بیشترین شمارش/قفل برنده است)
export async function hydratePinLock() {
  const local = readPinLock();
  try {
    const raw = await secureGet(PIN_LOCK_KEY);
    if (raw) {
      const sec = normLock(JSON.parse(raw));
      _lock = { fails: Math.max(local.fails, sec.fails), until: Math.max(local.until, sec.until), lastSeen: Math.max(local.lastSeen, sec.lastSeen) };
    }
  } catch {}
  return _lock;
}
export function lockRemainingMs(lock = readPinLock()) {
  const eff = Math.max(Date.now(), lock.lastSeen || 0);         // ساعت به عقب برده شده → نادیده
  let rem = Math.max(0, (lock.until || 0) - eff);
  if (_anchor && _anchor.until === lock.until) rem = Math.max(rem, _anchor.ms - (performance.now() - _anchor.perf));   // ساعت به جلو برده شده → نادیده
  return Math.max(0, rem);
}
export function touchPinLock() { const l = readPinLock(); const now = Date.now(); if (now > l.lastSeen) persistLock({ ...l, lastSeen: now }); }
export function clearPinLock() {
  _lock = normLock(null); _anchor = null;
  try { localStorage.removeItem(PIN_LOCK_KEY); } catch {}
  secureRemove(PIN_LOCK_KEY).catch(() => {});
}
export function registerPinFail() {
  const cur = readPinLock();
  const fails = cur.fails + 1;
  const now = Math.max(Date.now(), cur.lastSeen || 0);
  const ms = fails >= PIN_FREE_TRIES ? Math.min(15 * 60, 30 * 2 ** (fails - PIN_FREE_TRIES)) * 1000 : 0;
  const next = { fails, until: ms ? now + ms : 0, lastSeen: now };
  _anchor = ms ? { until: next.until, ms, perf: performance.now() } : null;
  persistLock(next);
  return next;
}
