import { KeypadInput } from "./KeypadInput.jsx";

/* ---------------------------------------------------------
   Amount input — shows a live thousands separator (۱٬۲۳۴٬۵۶۷)
   while typing; the value passed to onChange is always the plain
   numeric string (no commas), so nothing downstream needs to change.
--------------------------------------------------------- */
export function AmountInput({ value, onChange, placeholder, style }) {
  const display = value ? Number(value).toLocaleString("en-US") : "";
  return (
    <KeypadInput
      kind="amount"
      value={value}
      display={display}
      onChange={(e) => onChange(String(e.target.value || "").replace(/[^0-9]/g, ""))}
      placeholder={placeholder}
      style={{ ...style, direction: "ltr", textAlign: "right" }}
    />
  );
}
