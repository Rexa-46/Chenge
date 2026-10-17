import { useState } from "react";

import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function CalculatorView() {
  const st = useStyles();
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState("");
  function calc() { try { if (!/^[0-9+\-*/().% ]+$/.test(expr)) return; const value = Function(`"use strict"; return (${expr})`)(); if (Number.isFinite(value)) setResult(String(value)); } catch {} }
  const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"];
  return <div><div style={{ ...st.card, padding: 16, marginBottom: 14 }}><div style={{ fontSize: 12, color: useT().sub, marginBottom: 6 }}>ماشین حساب</div><div style={{ fontSize: 26, fontWeight: 800, direction: "ltr", textAlign: "left", minHeight: 38 }}>{result || expr || "۰"}</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>{keys.map((k) => <button key={k} onClick={() => k === "=" ? calc() : setExpr((x) => x + k)} style={{ height: 52, border: "none", borderRadius: 12, background: k === "=" ? BRAND.header : "#fff", color: k === "=" ? "#fff" : "#241a30", fontSize: 18, fontWeight: 700 }}>{k}</button>)}<button onClick={() => { setExpr(""); setResult(""); }} style={{ gridColumn: "1 / -1", height: 44, border: "none", borderRadius: 12, background: BRAND.crimson, color: "#fff", fontWeight: 700 }}>پاک کردن</button></div></div>;
}
