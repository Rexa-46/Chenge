import { Palette, Pencil } from "lucide-react";

import { resolveCardDesign } from "../../domain/bankDesigns.js";
import { CardLogo } from "./CardLogo.jsx";
import { expiryFromStored } from "../../utils/cardFormat.js";
import { formatMoney } from "../../utils/format.js";

export function BankCard({ account, balance, hidden, currency, usdRate, onEdit, onDesign }) {
  const rawCard = String(account.cardNumber || "").replace(/\D/g, "").slice(0, 16);
  const cardNumber = rawCard.length === 16 ? rawCard.replace(/(.{4})/g, "$1 ").trim() : (account.cardNumberLast4 ? `•••• •••• •••• ${account.cardNumberLast4}` : "شماره کارت ثبت نشده");
  const expiryDate = expiryFromStored(account.expiryDate) || "—";
  const d = resolveCardDesign(account);
  const pattern = d.pattern === "waves" ? "repeating-linear-gradient(160deg, rgba(255,255,255,.07) 0 14px, transparent 14px 30px)" : d.pattern === "diag" ? "repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 10px, transparent 10px 22px)" : "none";
  return (
    <div style={{
      minWidth: 300, maxWidth: 300, height: 176, borderRadius: 18, padding: 18, color: d.text, flexShrink: 0,
      background: `${pattern !== "none" ? pattern + ", " : ""}linear-gradient(135deg, ${d.from}, ${d.to})`,
      boxShadow: "0 6px 16px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", justifyContent: "space-between",
      scrollSnapAlign: "center", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}><CardLogo logo={account.cardLogo} size={30} /><div style={{ fontWeight: 800, fontSize: 15 }}>{account.name}</div></div>
        <div style={{ display: "flex", gap: 6 }}>{onDesign && <button onClick={onDesign} aria-label="تغییر طرح کارت" style={{ border: "none", background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Palette size={15} /></button>}<button onClick={onEdit} aria-label="ویرایش کارت" style={{ border: "none", background: "rgba(255,255,255,.14)", color: "#fff", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Pencil size={15} /></button></div>
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
