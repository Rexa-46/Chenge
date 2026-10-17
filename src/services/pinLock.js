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
export function readPinLock() {
  try { const v = JSON.parse(localStorage.getItem(PIN_LOCK_KEY) || "null"); return { fails: Number(v?.fails) || 0, until: Number(v?.until) || 0 }; } catch { return { fails: 0, until: 0 }; }
}
export function clearPinLock() { try { localStorage.removeItem(PIN_LOCK_KEY); } catch {} }
export function registerPinFail() {
  const fails = readPinLock().fails + 1;
  const until = fails >= PIN_FREE_TRIES ? Date.now() + Math.min(15 * 60, 30 * 2 ** (fails - PIN_FREE_TRIES)) * 1000 : 0;
  const next = { fails, until };
  try { localStorage.setItem(PIN_LOCK_KEY, JSON.stringify(next)); } catch {}
  return next;
}
