import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { useT } from "../../theme/ThemeContext.js";
import { FONT, THEME } from "../../theme/palette.js";
import { evalCalc } from "../../utils/calc.js";
import { toBody } from "../../utils/portal.js";

export function NumKeypadSheet({ title, initial = "", kind = "amount", limit, onDone, onClose }) {
  const t = useT();
  const dark = t.card === THEME.dark.card;
  const calc = kind === "amount";
  const dot = kind === "amount" || kind === "decimal";
  const [expr, setExpr] = useState(String(initial || ""));
  const [fresh, setFresh] = useState(!!initial);
  const [bad, setBad] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;   // همیشه آخرین onClose صدا زده می‌شود (نه نسخه‌ی لحظه‌ی باز شدن)
  useEffect(() => { // دکمه‌ی بازگشت گوشی ابتدا همین ماشین‌حساب را می‌بندد
    const h = () => closeRef.current();
    (window.__rexaBack = window.__rexaBack || []).push(h);
    return () => { window.__rexaBack = (window.__rexaBack || []).filter((x) => x !== h); };
  }, []);
  const blue = dark ? "#8fb0ff" : "#2f5fe0";
  const lastNum = (e) => (e.match(/[0-9.]*$/) || [""])[0];
  function press(k) {
    setBad(false);
    if (k === "C") { setExpr(""); setFresh(false); return; }
    if (k === "⌫") { setExpr((e) => (fresh ? "" : e.slice(0, -1))); setFresh(false); return; }
    if (k === "=") { const r = evalCalc(expr); if (r === null) { setBad(true); return; } setExpr(String(Math.round(r * 1e6) / 1e6)); setFresh(true); return; }
    if (/^[+\-×÷]$/.test(k)) {
      if (!calc) return;
      setExpr((e) => { if (!e) return k === "-" ? "-" : e; return /[+\-×÷]$/.test(e) ? e.slice(0, -1) + k : e + k; });
      setFresh(false); return;
    }
    setExpr((e) => {
      const base = fresh ? "" : e;
      if (k === ".") { if (!dot || lastNum(base).includes(".")) return base; return base === "" || /[+\-×÷]$/.test(base) ? base + "0." : base + "."; }
      const add = k === "000" ? (calc && lastNum(base) !== "" && lastNum(base) !== "0" && !lastNum(base).includes(".") ? "000" : "") : k;
      if (!add) return base;
      if (!calc && limit && base.length + add.length > limit) return base;
      if ((calc || kind === "decimal") && lastNum(base) === "0") return base.slice(0, -1) + add; // صفر ابتدایی فقط در اعداد حذف می‌شود، نه در شماره‌ها
      return base + add;
    });
    setFresh(false);
  }
  function confirm() {
    if (calc) {
      if (!expr) { onDone(""); return; }
      const r = evalCalc(expr);
      if (r === null) { setBad(true); return; }
      onDone(String(Math.max(0, Math.round(r))));
    } else onDone(expr.replace(/\.$/, ""));
  }
  const pretty = calc
    ? expr.replace(/\d+(\.\d*)?/g, (m) => { const [i, d] = m.split("."); return Number(i).toLocaleString("en-US") + (d !== undefined ? "." + d : ""); })
    : expr;
  const hasOp = calc && /\d[+\-×÷]\d/.test(expr.replace(/^-/, ""));
  const preview = hasOp ? evalCalc(expr) : null;
  const rows = calc
    ? [["C", "⌫", "÷", "×"], ["7", "8", "9", "-"], ["4", "5", "6", "+"], ["1", "2", "3", "="], ["000", "0", ".", "OK"]]
    : [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], [dot ? "." : "C", "0", "⌫"]];
  const keyStyle = (k) => {
    const isOp = /^[+\-×÷=]$/.test(k), isFn = k === "C" || k === "⌫";
    return { height: 54, border: "none", borderRadius: 13, fontSize: k === "OK" ? 15 : 21, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      background: k === "OK" ? "linear-gradient(160deg, #62a8ff 0%, #2f62f0 100%)" : isOp ? (dark ? "rgba(143,176,255,.18)" : "rgba(47,95,224,.10)") : isFn ? (dark ? "rgba(255,120,120,.16)" : "rgba(214,60,60,.09)") : t.input,
      color: k === "OK" ? "#fff" : isOp ? blue : isFn ? "#d63c3c" : t.text };
  };
  return toBody(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.42)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center", maxWidth: 480, margin: "0 auto", fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} dir="ltr" style={{ width: "100%", background: t.card, borderRadius: "20px 20px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -8px 30px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={onClose} aria-label="بستن" style={{ background: "none", border: "none", color: t.sub, padding: 4, cursor: "pointer", display: "flex" }}><X size={22} /></button>
          <div dir="rtl" style={{ fontSize: 12.5, color: t.sub, fontWeight: 600, maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || "ورود عدد"}</div>
        </div>
        <div style={{ background: t.input, borderRadius: 14, padding: "10px 14px", marginBottom: 12, minHeight: 78, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", border: `1.5px solid ${bad ? "#d63c3c" : t.inputBorder}` }}>
          <div style={{ fontSize: 13, color: bad ? "#d63c3c" : t.sub, minHeight: 18, direction: "ltr" }}>{bad ? "عبارت نامعتبر است" : preview !== null && preview !== undefined ? `= ${(Math.round(preview * 1e6) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 6 })}` : ""}</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: t.text, direction: "ltr", wordBreak: "break-all", textAlign: "right", lineHeight: 1.3 }}>{(pretty || "0").replace(/-/g, "−")}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${rows[0].length}, 1fr)`, gap: 8 }}>
          {rows.flat().map((k) => (
            <button key={k} onClick={() => (k === "OK" ? confirm() : press(k))} aria-label={k === "OK" ? "تأیید" : k}
              style={keyStyle(k)}>{k === "OK" ? "تأیید" : k === "-" ? "−" : k}</button>
          ))}
        </div>
        {!calc && <button onClick={confirm} aria-label="تأیید" style={{ ...keyStyle("OK"), width: "100%", marginTop: 8 }}>تأیید</button>}
      </div>
    </div>
  );
}
