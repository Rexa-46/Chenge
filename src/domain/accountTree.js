/* ---------------------------------------------------------
   حساب‌ها: درخت حساب‌ها (هزینه‌ها، درآمدها، صندوق‌ها، بانک‌ها، اشخاص، بدهکاران،
   بستانکاران، دارائی‌ها، بدهی‌ها، سرمایه) همراه با جستجو.
   هم به‌عنوان صفحه‌ی مدیریت استفاده می‌شود و هم به‌عنوان انتخاب‌گر در ثبت تراکنش.
--------------------------------------------------------- */
export const ACCOUNT_GROUPS = [
  { kind: "expense", label: "هزینه‌ها" }, { kind: "income", label: "درآمدها" },
  { kind: "fund", label: "صندوق‌ها" }, { kind: "bank", label: "بانک‌ها" },
  { kind: "person", label: "اشخاص" }, { kind: "receivable", label: "بدهکاران" },
  { kind: "payable", label: "بستانکاران" }, { kind: "asset", label: "دارائی‌ها" },
  { kind: "liability", label: "بدهی‌ها" }, { kind: "capital", label: "سرمایه" },
];
export const DEBT_GROUPS = ["receivable", "payable"]; // حساب «دو طرفه» در هر دو گروه بدهکاران و بستانکاران دیده می‌شود
export const faKey = (x = "") => String(x).replace(/ي/g, "ی").replace(/ك/g, "ک").toLowerCase().trim();
export function accountPath(categories, c) {
  const names = [c.name]; let p = c; let guard = 0;
  while (p?.parentId && guard++ < 8) { p = categories.find((x) => x.id === p.parentId); if (p) names.unshift(p.name); }
  return [ACCOUNT_GROUPS.find((g) => g.kind === c.kind)?.label || "سایر", ...names];
}
