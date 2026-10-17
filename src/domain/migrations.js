import { uid } from "../utils/id.js";

export function migrateTransactions(list = [], loans = []) {
  const loanMap = new Map((Array.isArray(loans) ? loans : []).map((l) => [l.id, l]));
  return (Array.isArray(list) ? list : []).map((t) => {
    if (t?.loanId && t.loanRole === "receipt") return { ...t, isFinancing: true, pnlAmount: 0, sourceType: t.sourceType || "loan_receipt", sourceId: t.sourceId || t.loanId };
    if (t?.loanId && t.loanRole === "installment") {
      const l = loanMap.get(t.loanId);
      const totalInterest = l ? Math.max(0, Number(l.installments || 0) * Number(l.monthlyPayment || 0) - Number(l.principal || 0)) : 0;
      const interestPart = l?.installments ? totalInterest / Number(l.installments) : Number(t.interestPart || 0);
      return { ...t, isFinancing: true, pnlAmount: Number(t.pnlAmount ?? interestPart), principalPart: Number(t.principalPart ?? Math.max(0, Number(t.amount || 0) - interestPart)), interestPart, sourceType: t.sourceType || "loan_installment", sourceId: t.sourceId || `${t.loanId}:${t.loanSeq || t.id}` };
    }
    return t;
  });
}

export function normalizeCategoriesForHierarchy(list) {
  const out = Array.isArray(list) ? list.map(c => ({ ...c })) : [];
  const hasVehicle = out.some(c => c.kind === "expense" && c.name === "خودرو" && !c.parentId);
  const fuel = out.find(c => c.kind === "expense" && c.name === "بنزین" && !c.parentId);
  if (fuel && !hasVehicle) {
    const parent = { id: uid(), name: "خودرو", kind: "expense" };
    out.push(parent);
    fuel.parentId = parent.id;
  } else if (fuel && hasVehicle) {
    const parent = out.find(c => c.kind === "expense" && c.name === "خودرو" && !c.parentId);
    fuel.parentId = parent.id;
  }
  return out;
}
