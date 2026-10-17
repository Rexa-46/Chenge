import { Pencil } from "lucide-react";

import { BRAND } from "../../theme/palette.js";
import { expiryFromStored } from "../../utils/cardFormat.js";
import { formatMoney } from "../../utils/format.js";

export function BankCard({ account, balance, hidden, currency, usdRate, onEdit }) {
  const rawCard = String(account.cardNumber || "").replace(/\D/g, "").slice(0, 16);
  const cardNumber = rawCard.length === 16 ? rawCard.replace(/(.{4})/g, "$1 ").trim() : (account.cardNumberLast4 ? `•••• •••• •••• ${account.cardNumberLast4}` : "شماره کارت ثبت نشده");
  const expiryDate = expiryFromStored(account.expiryDate) || "—";
  return (
    <div style={{
      minWidth: 300, maxWidth: 300, height: 176, borderRadius: 18, padding: 18, color: "#fff", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.violet}, ${BRAND.header})`,
      boxShadow: "0 6px 16px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", justifyContent: "space-between",
      scrollSnapAlign: "center", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{account.name}</div>
        <button onClick={onEdit} aria-label="ویرایش کارت" style={{ border: "none", background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Pencil size={15} /></button>
      </div>
      <div style={{ fontSize: rawCard.length === 16 ? 16 : 13, letterSpacing: rawCard.length === 16 ? 2.2 : 0.5, fontWeight: 700, zIndex: 1, direction: "ltr", textAlign: "left", whiteSpace: "nowrap" }}>
        {cardNumber}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9.5, opacity: 0.72 }}>تاریخ انقضا</div>
          <div style={{ fontSize: 13, fontWeight: 800, direction: "ltr" }}>{expiryDate}</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{account.type === "card" ? "کارت" : "بانک"}</div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{hidden ? "••••••••" : formatMoney(balance, currency, usdRate)}</div>
        </div>
      </div>
    </div>
  );
}
