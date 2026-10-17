import { uid } from "../utils/id.js";

/* ---------------------------------------------------------
   Seed data
--------------------------------------------------------- */
export const seedAccounts = () => ([
  { id: uid(), name: "بانک ملت", type: "bank", initial: 5000000 },
  { id: uid(), name: "صندوق نقدی", type: "fund", initial: 800000 },
  { id: uid(), name: "کارت عابر ملت", type: "card", initial: 0 },
]);
export const seedCategories = () => {
  const vehicle = { id: uid(), name: "خودرو", kind: "expense" };
  return [
    vehicle,
    { id: uid(), name: "بنزین", kind: "expense", parentId: vehicle.id },
    { id: uid(), name: "خوراک و بازار", kind: "expense" },
    { id: uid(), name: "قبوض", kind: "expense" },
    { id: uid(), name: "حمل و نقل", kind: "expense" },
    { id: uid(), name: "درمان", kind: "expense" },
    { id: uid(), name: "متفرقه", kind: "expense" },
    { id: uid(), name: "حقوق", kind: "income" },
    { id: uid(), name: "درآمد متفرقه", kind: "income" },
  ];
};
const DEFAULT_HOME_SECTIONS = [
  { key: "shortcut", visible: true }, { key: "operations", visible: true }, { key: "expense", visible: true }, { key: "income", visible: true },
  { key: "banks", visible: true }, { key: "funds", visible: true }, { key: "balrep", visible: true },
  { key: "budget", visible: true }, { key: "loanchk", visible: true }, { key: "bills", visible: true },
];
// برای کاربرانی که چیدمان قدیمی ذخیره دارند: بخش «عملیات» اضافه و بخش حذف‌شده‌ی «اشخاص و بدهی‌ها» کنار گذاشته می‌شود
export const normalizeHomeSections = (list) => {
  const base = (Array.isArray(list) && list.length ? list : DEFAULT_HOME_SECTIONS).filter((x) => x.key !== "contacts");
  if (base.some((x) => x.key === "operations")) return base;
  const out = [...base];
  out.splice(out.findIndex((x) => x.key === "shortcut") + 1, 0, { key: "operations", visible: true });
  return out;
};
export const seedSettings = () => ({
  theme: "light", pin: "", pinHash: "", pinSalt: "", dueNotif: true, sharedFamily: false, themeColor: "purple",
  profile: { name: "alireza shadfar", phone: "", email: "" },
  homeLayout: "cards", homeSections: DEFAULT_HOME_SECTIONS,
  fontScale: 1, calendarMode: "jalali", currency: "rial",
  checkReminderDays: 7, smsNotif: false, smsAutoRead: false, biometricEnabled: false,
  manualUsdRate: "", shortcuts: [], lastRatesUpdate: "",
});
