import { nativeLoad, nativeSave } from "./nativeStorage.js";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Storage abstraction: uses the host window.storage API when present,
// and falls back to localStorage automatically when this same code runs
// as a standalone deployed app / APK build.
const hasCloudStorage = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";

// خواندن: فقط «وجود نداشتن کلید» مقدار پیش‌فرض برمی‌گرداند. هر خطای واقعی (دیتابیس/کلید رمز/JSON خراب) به بالا پرتاب می‌شود
// تا برنامه «بارگذاری‌شده» حساب نشود و داده‌ی واقعی با داده‌ی خالی بازنویسی نشود.
export async function loadKey(key, fallback, shared) {
  await flushSaves();
  if (hasCloudStorage) {
    const res = await window.storage.get(key, !!shared);
    return res && res.value ? JSON.parse(res.value) : fallback;
  }
  if (Capacitor.isNativePlatform()) return await nativeLoad(key, fallback);
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

// ذخیره‌ی دسته‌ای با تأخیر کوتاه (۲۵۰ میلی‌ثانیه): نوشتن‌های پشت‌سرهم یکی می‌شوند و در پس‌زمینه/بستن برنامه فوراً نوشته می‌شوند.
const SAVE_DELAY_MS = 250;
const _saveQueue = new Map();
let _saveTimer = null;
let _chain = Promise.resolve();   // نوشتن‌ها پشت‌سرهم و به ترتیب انجام می‌شوند

async function writeOne(key, value, shared) {
  if (hasCloudStorage) { await window.storage.set(key, JSON.stringify(value), !!shared); return; }
  if (Capacitor.isNativePlatform()) { await nativeSave(key, value); return; }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function flushSaves() {
  clearTimeout(_saveTimer); _saveTimer = null;
  const pending = Array.from(_saveQueue.entries());
  _saveQueue.clear();
  if (!pending.length) return _chain;
  _chain = _chain.then(async () => {
    for (const [key, item] of pending) {
      try { await writeOne(key, item.value, item.shared); }
      catch (e) {
        console.error("save fail", key, e);
        // اگر در این فاصله مقدار تازه‌تری نیامده، نوشتن ناموفق دوباره در صف می‌ماند
        if (!_saveQueue.has(key)) { _saveQueue.set(key, item); scheduleFlush(2000); }
      }
    }
  });
  return _chain;
}
function scheduleFlush(ms) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(flushSaves, ms);
}
export async function saveKey(key, value, shared) {
  _saveQueue.set(key, { value, shared });
  scheduleFlush(SAVE_DELAY_MS);
}
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushSaves);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSaves(); });
  try { CapacitorApp.addListener("pause", flushSaves); } catch {}
  try { CapacitorApp.addListener("appStateChange", (s) => { if (!s?.isActive) flushSaves(); }); } catch {}
}
