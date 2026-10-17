import { useState } from "react";

import { reportRange } from "../domain/reportMath.js";
import { todayISO } from "../utils/dates.js";

export function useRangeState(initial = "month") {
  const [kind, setKind] = useState(initial);
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  return { kind, setKind, from, setFrom, to, setTo, range: reportRange(kind, from, to) };
}
