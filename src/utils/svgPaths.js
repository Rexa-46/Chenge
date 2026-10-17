export const polarPt = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};
export function slicePath(cx, cy, r, a0, a1) {
  const [x0, y0] = polarPt(cx, cy, r, a0), [x1, y1] = polarPt(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1} Z`;
}
export function ringPath(cx, cy, r0, r1, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [ox0, oy0] = polarPt(cx, cy, r1, a0), [ox1, oy1] = polarPt(cx, cy, r1, a1);
  const [ix0, iy0] = polarPt(cx, cy, r0, a0), [ix1, iy1] = polarPt(cx, cy, r0, a1);
  return `M ${ox0} ${oy0} A ${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${r0} ${r0} 0 ${large} 0 ${ix0} ${iy0} Z`;
}
