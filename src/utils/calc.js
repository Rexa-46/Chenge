export function evalCalc(expr) {
  const tokens = String(expr).match(/\d+\.?\d*|\.\d+|[+\-×÷]/g);
  if (!tokens) return null;
  const nums = [], ops = [];
  let expectNum = true, sign = 1;
  for (const tk of tokens) {
    if (/^[+\-×÷]$/.test(tk)) {
      if (expectNum) { if (tk === "-") sign = -sign; else if (tk !== "+") return null; continue; }
      ops.push(tk); expectNum = true;
    } else { nums.push(sign * parseFloat(tk)); sign = 1; expectNum = false; }
  }
  if (!nums.length) return null;
  while (ops.length >= nums.length) ops.pop();
  const outN = [nums[0]], outO = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i], bb = nums[i + 1];
    if (op === "×") outN[outN.length - 1] *= bb;
    else if (op === "÷") { if (bb === 0) return null; outN[outN.length - 1] /= bb; }
    else { outO.push(op); outN.push(bb); }
  }
  let r = outN[0];
  outO.forEach((op, i) => { r = op === "+" ? r + outN[i + 1] : r - outN[i + 1]; });
  return Number.isFinite(r) ? r : null;
}
