import { useT } from "../../theme/ThemeContext.js";
import { categoryIconFor } from "../../utils/categoryIcons.js";
import { polarPt, ringPath, slicePath } from "../../utils/svgPaths.js";

export function ColorPie({ data, selected, onSelect }) {
  const t = useT();
  const cx = 150, cy = 150, R = 134, HOLE = 28, RING = 40, START = 35;
  const total = data.reduce((s, d) => s + d.amount, 0);
  let acc = START;
  const slices = total > 0 ? data.map((d, i) => {
    const span = (d.amount / total) * 360;
    const s = { ...d, i, a0: acc, a1: acc + span, span, color: d.color };
    acc += span;
    return s;
  }) : [];
  const single = slices.length === 1;

  return (
    <svg viewBox="0 0 300 300" style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      {total <= 0 && <circle cx={cx} cy={cy} r={R - 4} fill={t.inputBorder} />}
      {slices.map((s) => {
        const mid = (s.a0 + s.a1) / 2;
        const isSel = selected === s.i;
        const [ox, oy] = isSel ? polarPt(0, 0, 9, mid) : [0, 0];
        const Icon = categoryIconFor(s.name);
        const [ix, iy] = polarPt(cx, cy, R * 0.63, mid);
        const arcLen = (s.span * Math.PI / 180) * R * 0.63;
        const size = Math.min(46, arcLen * 0.75);
        return (
          <g key={s.i} transform={`translate(${ox} ${oy})`} onClick={() => onSelect(isSel ? null : s.i)} style={{ cursor: "pointer" }}>
            {single
              ? <circle cx={cx} cy={cy} r={R} fill={s.color} />
              : <path d={slicePath(cx, cy, R, s.a0, s.a1)} fill={s.color} stroke={t.card} strokeWidth={8} strokeLinejoin="round" />}
            {single
              ? <circle cx={cx} cy={cy} r={(HOLE + RING) / 2} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={RING - HOLE} />
              : <path d={ringPath(cx, cy, HOLE, RING, s.a0, s.a1)} fill="#fff" fillOpacity={0.4} />}
            {size >= 16 && (
              <Icon x={ix - size / 2} y={iy - size / 2} size={size} color="#fff" strokeWidth={1.7}
                fill="#fff" fillOpacity={0.28} style={{ opacity: 0.6, pointerEvents: "none" }} />
            )}
          </g>
        );
      })}
      {total <= 0 && <circle cx={cx} cy={cy} r={RING} fill="#fff" fillOpacity={0.4} />}
      <circle cx={cx} cy={cy} r={HOLE} fill={t.card} style={{ pointerEvents: "none" }} />
    </svg>
  );
}
