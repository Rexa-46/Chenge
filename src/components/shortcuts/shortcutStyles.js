import {
  Banknote, Building2, Bus, Car, CarTaxiFront, ConciergeBell, Drama, Droplets, Fuel, Gift, HandCoins,
  Home as HomeIcon, Pill, Shirt, ShoppingCart, Smartphone, Sparkles, Wifi, Wrench, Zap,
} from "lucide-react";

/* ---------------------------------------------------------
   Accounts / Categories / Budgets Managers
--------------------------------------------------------- */
// رنگ پس‌زمینه، رنگ آیکن و آیکن هر میانبر — مطابق تصویر مرجع «میانبر تراکنش‌ها»
export const SHORTCUT_STYLES = {
  taxi: { bg: "#FFE8C7", fg: "#E6A912", icons: [CarTaxiFront, Bus] },
  bus: { bg: "#FFE8C7", fg: "#E6A912", icons: [Bus] },
  car: { bg: "#FFF3C8", fg: "#B5A04A", icons: [Car] },
  fuel: { bg: "#FFF3C8", fg: "#B5A04A", icons: [Fuel] },
  food: { bg: "#FFF3C8", fg: "#F2C21B", icons: [ConciergeBell] },
  market: { bg: "#FFF3C8", fg: "#F2C21B", icons: [ShoppingCart] },
  home: { bg: "#FFF3C8", fg: "#9C8A5A", icons: [HomeIcon] },
  water: { bg: "#FFF3C8", fg: "#9C8A5A", icons: [Droplets] },
  electric: { bg: "#FFF3C8", fg: "#9C8A5A", icons: [Zap] },
  repair: { bg: "#FFF3C8", fg: "#9C8A5A", icons: [Wrench] },
  internet: { bg: "#DDF4FF", fg: "#2F8FC4", icons: [Wifi] },
  clothes: { bg: "#C9FBFA", fg: "#0B8E93", icons: [Shirt] },
  salary: { bg: "#B9FFF9", fg: "#14A39B", icons: [HandCoins] },
  bank: { bg: "#F1F3FA", fg: "#7B808C", icons: [Building2] },
  fun: { bg: "#FFE8EC", fg: "#F0546A", icons: [Drama] },
  health: { bg: "#FFE3E3", fg: "#E04B4B", icons: [Pill] },
  gift: { bg: "#FDE6F3", fg: "#D6489B", icons: [Gift] },
  phone: { bg: "#FFDADA", fg: "#E5483F", icons: [Smartphone] },
  loan: { bg: "#FFDADA", fg: "#E5483F", icons: [Banknote] },
  other: { bg: "#EAE7FB", fg: "#6C56C8", icons: [Sparkles] },
};
export const SHORTCUT_ICON_KEYS = Object.keys(SHORTCUT_STYLES);
export function shortcutStyle(sc) {
  if (sc.icon === "other" && sc.type === "income") return SHORTCUT_STYLES.salary;
  return SHORTCUT_STYLES[sc.icon] || SHORTCUT_STYLES.other;
}
