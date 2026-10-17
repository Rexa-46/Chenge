import { nativeLoad, nativeSave } from "./nativeStorage.js";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Storage abstraction: uses the Claude-artifact window.storage API when present
// (always true inside claude.ai), and falls back to localStorage automatically
// when this same code runs as a standalone deployed app / APK build.
const hasCloudStorage = typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
export async function loadKey(key, fallback, shared) {
  flushSaves();
  try {
    if (hasCloudStorage) {
      const res = await window.storage.get(key, !!shared);
      return res && res.value ? JSON.parse(res.value) : fallback;
    }
    if (Capacitor.isNativePlatform()) return await nativeLoad(key, fallback);
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
// ذخیره‌ی دسته‌ای: نوشتن‌های پشت‌سرهم یکی می‌شوند و بیرون از لحظه‌ی کلیک انجام می‌شوند (ثبت تراکنش دیگر هنگ نمی‌کند)
const _saveQueue = new Map();
let _saveTimer = null;
function flushSaves() {
  clearTimeout(_saveTimer); _saveTimer = null;
  const pending = Array.from(_saveQueue.entries());
  _saveQueue.clear();
  for (const [key, { value, shared }] of pending) {
    try {
      if (hasCloudStorage) window.storage.set(key, JSON.stringify(value), !!shared);
      else if (Capacitor.isNativePlatform()) nativeSave(key, value).catch((e) => console.error("sqlite save fail", e));
      else window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("save fail", e); }
  }
}
export async function saveKey(key, value, shared) {
  _saveQueue.set(key, { value, shared });
  clearTimeout(_saveTimer);
  // نوشتن سنگین (JSON.stringify همه‌ی تراکنش‌ها) در زمان بیکاری انجام می‌شود تا کلیک‌ها هنگ نکنند
  _saveTimer = setTimeout(() => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(flushSaves, { timeout: 3000 });
    else flushSaves();
  }, 900);
}
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushSaves);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSaves(); });
  try { CapacitorApp.addListener("pause", flushSaves); } catch {}
}
