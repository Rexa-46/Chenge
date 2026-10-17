// منحنی تراز: درآمد > هزینه = لبخند سبز | هزینه > درآمد = اخم قرمز | برابر = خط صاف نارنجی (بدون هیچ نوشته)
export function SmileFrownArc({ income, expense }) {
  const net = income - expense;
  const color = net > 0 ? "#22A559" : net < 0 ? "#E5384B" : "#F59E0B";
  const w = 220, h = 56, strokeW = 13;
  const d = net > 0
    ? `M 18 ${h * 0.30} Q ${w / 2} ${h * 0.90} ${w - 18} ${h * 0.30}`   // لبخند ∪ (درآمد بیشتر)
    : net < 0
      ? `M 18 ${h * 0.70} Q ${w / 2} ${h * 0.14} ${w - 18} ${h * 0.70}`  // اخم ∩ (هزینه بیشتر)
      : `M 18 ${h / 2} L ${w - 18} ${h / 2}`;
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 14 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
        <path d={d} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
      </svg>
    </div>
  );
}
