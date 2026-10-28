/* ---------------------------------------------------------
   گزارش بر اساس سرفصل: هر تراکنش به سرفصل اصلی (ریشه‌ی درخت حساب‌ها) می‌رسد
   و زیرمجموعه‌ها زیر همان سرفصل جمع می‌شوند. لمس سرفصل، زیرمجموعه‌ها را نشان می‌دهد.
--------------------------------------------------------- */
export function buildHeadingTree(txs, type, categories, amountOf = (x) => Number(x.amount || 0)) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const nodes = new Map();
  const getNode = (c, fallbackName) => {
    const id = c ? c.id : "__none";
    if (!nodes.has(id)) nodes.set(id, { id, name: c ? c.name : fallbackName, own: 0, amount: 0, parentId: c && byId.has(c.parentId) ? c.parentId : null, children: [] });
    return nodes.get(id);
  };
  txs.forEach((tx) => {
    if (tx.type !== type) return;
    const amt = amountOf(tx);
    if (!amt) return;
    const c = byId.get(tx.categoryId);
    // مسیر از خودِ حساب تا ریشه
    const chain = []; let p = c, guard = 0;
    while (p && guard++ < 10) { chain.push(p); p = byId.get(p.parentId); }
    if (!chain.length) { const n = getNode(null, "بدون دسته"); n.own += amt; n.amount += amt; return; }
    getNode(chain[0]).own += amt;
    chain.forEach((cc) => { getNode(cc).amount += amt; });
  });
  // اتصال فرزندها به پدر (فقط گره‌هایی که مبلغ دارند)
  nodes.forEach((n) => { if (n.parentId && nodes.has(n.parentId)) nodes.get(n.parentId).children.push(n); });
  const sortDesc = (a, b) => b.amount - a.amount;
  const roots = [...nodes.values()].filter((n) => !n.parentId || !nodes.has(n.parentId)).sort(sortDesc);
  const walk = (n) => { n.children.sort(sortDesc); n.children.forEach(walk); };
  roots.forEach(walk);
  return roots;
}
// تخت‌کردن درخت برای خروجی Excel/PDF (سرفصل و زیر آن با پیشوند)
export function flattenHeadingTree(tree, depth = 0, out = []) {
  tree.forEach((n) => {
    out.push({ name: `${depth ? "   ↳ " : ""}${n.name}`, amount: n.amount, depth });
    if (n.children.length && n.own > 0) out.push({ name: `${"   ".repeat(depth + 1)}↳ ${n.name} (مستقیم)`, amount: n.own, depth: depth + 1 });
    flattenHeadingTree(n.children, depth + 1, out);
  });
  return out;
}
// داده‌ی تخت برای نمودارها (فقط سرفصل‌های اصلی)
export const headingTotals = (tree) => tree.map((n) => ({ name: n.name, amount: n.amount, catId: n.id }));
