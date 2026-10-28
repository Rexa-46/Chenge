import { useState } from "react";

import { reportRange } from "../domain/reportMath.js";
import { todayISO } from "../utils/dates.js";
import { readUi, writeUi } from "./usePersistedState.js";

// persistKey: نوع بازه (روزانه/ماهیانه/…) و تاریخ‌های دلخواه آخرین بار را به خاطر می‌سپارد
export function useRangeState(initial = "month", persistKey) {
  const saved = persistKey ? readUi(`range:${persistKey}`, null) : null;
  const [kind, setKindRaw] = useState(saved?.kind || initial);
  const [from, setFromRaw] = useState(saved?.from || todayISO());
  const [to, setToRaw] = useState(saved?.to || todayISO());
  const save = (patch) => { if (persistKey) writeUi(`range:${persistKey}`, { kind, from, to, ...patch }); };
  const setKind = (v) => { setKindRaw(v); save({ kind: v }); };
  const setFrom = (v) => { setFromRaw(v); save({ from: v }); };
  const setTo = (v) => { setToRaw(v); save({ to: v }); };
  return { kind, setKind, from, setFrom, to, setTo, range: reportRange(kind, from, to) };
}
