import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { useT } from "../../theme/ThemeContext.js";
import { PIE_COLORS } from "../../theme/chartColors.js";
import { useStyles } from "../../theme/styles.js";
import { toFaInt } from "../../utils/format.js";
import { HeadingBreakdown } from "../../components/reports/HeadingBreakdown.jsx";

export function PieBlock({ title, data, color }) {
  const t = useT(); const st = useStyles();
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div style={{ ...st.card, padding: 12, marginBottom: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color }}>{title}: {toFaInt(total)} ریال</div>
      {!data.length ? <div style={{ textAlign: "center", color: t.sub, fontSize: 12.5, padding: 18 }}>در این بازه موردی نیست</div> : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={data} dataKey="amount" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive={false}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <HeadingBreakdown tree={data} color={color} total={total} currency="rial" />
        </>
      )}
    </div>
  );
}
