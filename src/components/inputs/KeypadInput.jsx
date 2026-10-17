import { useState } from "react";

import { NumKeypadSheet } from "./NumKeypadSheet.jsx";

export function KeypadInput({ kind = "digits", value, onChange, placeholder, style, maxLength, digitsMax, display, ...rest }) {
  const [open, setOpen] = useState(false);
  const raw = value == null ? "" : String(value);
  const initial = kind === "digits" ? raw.replace(/\D/g, "") : raw;
  return (
    <>
      <input {...rest} readOnly inputMode="none" value={display ?? raw} placeholder={placeholder} style={{ ...style, cursor: "pointer" }}
        onClick={() => setOpen(true)} onFocus={(e) => { try { e.target.blur(); } catch {} setOpen(true); }} />
      {open && <NumKeypadSheet title={placeholder} initial={initial} kind={kind} limit={digitsMax ?? maxLength}
        onClose={() => setOpen(false)} onDone={(v) => { setOpen(false); onChange?.({ target: { value: v } }); }} />}
    </>
  );
}
