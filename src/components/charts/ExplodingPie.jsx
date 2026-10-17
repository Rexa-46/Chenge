import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";

import { EmptyRow } from "../common/EmptyRow.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { PIE_COLORS } from "../../theme/chartColors.js";
import { formatMoney } from "../../utils/format.js";

/* ---------------------------------------------------------
   Exploding / stylized pie chart — click a slice to pop it out
   a little and see its label. Recharts doesn't do true 3D, so
   "3D" here means a soft drop-shadow + slightly thicker ring to
   give it some depth rather than a flat chart.
--------------------------------------------------------- */
function renderExplodingSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, isActive } = props;
  const RADIAN = Math.PI / 180;
  const midAngle = (startAngle + endAngle) / 2;
  const offset = isActive ? 14 : 0;
  const ox = Math.cos(-midAngle * RADIAN) * offset;
  const oy = Math.sin(-midAngle * RADIAN) * offset;
  return (
    <g transform={`translate(${ox},${oy})`} style={{ filter: "drop-shadow(0px 3px 4px rgba(0,0,0,0.35))" }}>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={isActive ? outerRadius + 6 : outerRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill} stroke="#fff" strokeWidth={2} />
    </g>
  );
}
export function ExplodingPie({ data, height = 220, currency, usdRate }) {
  const t = useT();
  const [active, setActive] = useState(null);
  if (!data || data.length === 0) return <EmptyRow text="داده‌ای برای نمایش نیست" />;
  const item = active != null ? data[active] : null;
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="name" innerRadius={height * 0.16} outerRadius={height * 0.36}
            paddingAngle={2}
            onClick={(_, i) => setActive(active === i ? null : i)}
            shape={(props) => renderExplodingSlice({ ...props, isActive: active === props.index })}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} cursor="pointer" />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ textAlign: "center", minHeight: 20, fontSize: 13, fontWeight: 700, color: item ? PIE_COLORS[active % PIE_COLORS.length] : t.sub }}>
        {item ? `${item.name} — ${formatMoney(item.amount, currency, usdRate)}` : "برای جزئیات روی هر بخش بزن"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={i} onClick={() => setActive(active === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: t.sub, cursor: "pointer" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
