import { useCallback, useState } from "react";

/* حالتی که با بسته شدن برنامه از بین نمی‌رود: هر بار مقدار آخر خوانده می‌شود (localStorage) */
const PREFIX = "rexa:ui:";
export const readUi = (key, fallback) => {
  try { const raw = localStorage.getItem(PREFIX + key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; }
};
export const writeUi = (key, value) => { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {} };

export function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => readUi(key, typeof initial === "function" ? initial() : initial));
  const set = useCallback((next) => {
    setValue((prev) => {
      const v = typeof next === "function" ? next(prev) : next;
      writeUi(key, v);
      return v;
    });
  }, [key]);
  return [value, set];
}
