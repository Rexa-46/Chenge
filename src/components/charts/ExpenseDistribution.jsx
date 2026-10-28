import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { categoryIconFor } from "../../utils/categoryIcons.js";
import { FONT } from "../../theme/palette.js";
import { addDays, todayISO } from "../../utils/dates.js";
import { faDigits, formatMoney, toFaInt } from "../../utils/format.js";

/* ---------------------------------------------------------
   توزیع هزینه‌ها — پنل تیره با ردیف‌های نئونیِ دسته‌ها (رنگ، درصد، مبلغ)
   و نمودار ستونی ۷ روز اخیر که ستون «امروز» روشن‌تر است.
--------------------------------------------------------- */
const NEON = ["#ff8a2b", "#ffc83d", "#2f8cff", "#32d15b", "#b05cff", "#22d3d8", "#ff4d8d", "#9aa7b4"];
const PANEL = { background: "linear-gradient(180deg,#101a24,#0a1118)", border: "1px solid #24394a", borderRadius: 16, boxShadow: "inset 0 0 24px rgba(34,211,238,.05)" };
const dayName = (iso) => { try { return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(new Date(iso + "T12:00:00")); } catch { return iso; } };

export function ExpenseDistribution({ data = [], transactions = [], currency, usdRate }) {
  const [openRow, setOpenRow] = useState({});
  const total = data.reduce((s, d) => s + d.amount, 0);
  const { bars, unit } = useMemo(() => {
    const today = todayISO();
    const div = currency === "toman" ? 10000 : currency === "usd" && usdRate ? usdRate : 1000;
    const unit = currency === "toman" ? "هزار تومان" : currency === "usd" && usdRate ? "دلار" : "هزار ریال";
    const bars = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today, -i);
      const sum = transactions.filter((x) => x.type === "expense" && String(x.date).slice(0, 10) === date).reduce((s, x) => s + Number(x.amount || 0), 0);
      bars.push({ name: i === 0 ? "امروز" : dayName(date), value: Math.round((sum / div) * 100) / 100, today: i === 0 });
    }
    return { bars, unit };
  }, [transactions, currency, usdRate]);
  if (!data.length) return <div style={{ ...PANEL, color: "#9fb3c0", textAlign: "center", fontSize: 13, padding: 24 }}>در این بازه هزینه‌ای ثبت نشده</div>;
  return (
    <div dir="rtl" style={{ ...PANEL, padding: 10, fontFamily: FONT, color: "#e8f1f7" }}>
      {data.map((d, i) => {
        const color = NEON[i % NEON.length]; const Icon = categoryIconFor(d.name);
        const kids = d.children || [];
        return (
          <div key={d.name + i}>
          <div onClick={kids.length ? () => setOpenRow((o) => ({ ...o, [d.name + i]: !o[d.name + i] })) : undefined} style={{ cursor: kids.length ? "pointer" : "default", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 6, borderRadius: 12, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.06)" }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color, filter: `drop-shadow(0 0 5px ${color}88)`, flexShrink: 0 }}><Icon size={24} strokeWidth={1.8} /></span>
            <span style={{ fontWeight: 800, fontSize: 14, flex: "0 0 auto", minWidth: 64 }}>{d.name}</span>
            <span style={{ flex: 1, textAlign: "left", fontSize: 12.5, color: "#c9d6df", fontWeight: 700 }}>{formatMoney(d.amount, currency, usdRate)}</span>
            <span style={{ fontSize: 12.5, color: "#9fb3c0", minWidth: 36, textAlign: "left" }}>{faDigits(Math.round((d.amount / total) * 100))}٪</span>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
          </div>
          {openRow[d.name + i] && kids.map((k) => (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 18px 5px 10px", fontSize: 12, color: "#c9d6df" }}>
              <span>↳ {k.name}{k.children?.length ? ` (${faDigits(k.children.length)})` : ""}</span><span>{formatMoney(k.amount, currency, usdRate)} · {faDigits(total ? Math.round((k.amount / total) * 100) : 0)}٪</span>
            </div>
          ))}
          </div>
        );
      })}
      <div style={{ marginTop: 10, padding: "10px 6px 4px", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}>
        <div style={{ fontSize: 11.5, color: "#9fb3c0", margin: "0 8px 4px" }}>({unit})</div>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={bars} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontFamily: FONT, fontSize: 9.5, fill: "#9fb3c0" }} />
              <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontFamily: FONT, fontSize: 10, fill: "#9fb3c0" }} tickFormatter={(v) => toFaInt(v)} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {bars.map((b, i) => <Cell key={i} fill={b.today ? "#22d3ee" : "#2b4658"} style={b.today ? { filter: "drop-shadow(0 0 8px #22d3ee99)" } : undefined} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
