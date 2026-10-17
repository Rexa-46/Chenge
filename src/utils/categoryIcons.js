import {
  Banknote, Building2, Car, Drama, Droplets, Fuel, Gift, HandCoins, Home as HomeIcon, Pill, Shirt,
  ShoppingCart, Smartphone, Sparkles, Utensils, Wifi, Wrench, Zap,
} from "lucide-react";

export function categoryIconFor(name = "") {
  const n = String(name);
  if (/بنزین|سوخت|پمپ/.test(n)) return Fuel;
  if (/رستوران|کافه|غذا|شام|ناهار/.test(n)) return Utensils;
  if (/خوراک|بازار|سوپر|خرید|مارکت/.test(n)) return ShoppingCart;
  if (/برق|گاز/.test(n)) return Zap;
  if (/آب/.test(n)) return Droplets;
  if (/قبض|قبوض/.test(n)) return Zap;
  if (/تاکسی|اسنپ|تپسی|اتوبوس|مترو|حمل|کرایه|ماشین|خودرو/.test(n)) return Car;
  if (/درمان|دارو|دکتر|پزشک|بیمارستان|سلامت/.test(n)) return Pill;
  if (/حقوق|دستمزد|مزایا/.test(n)) return HandCoins;
  if (/پوشاک|لباس/.test(n)) return Shirt;
  if (/اینترنت/.test(n)) return Wifi;
  if (/موبایل|تلفن|شارژ/.test(n)) return Smartphone;
  if (/تفریح|سرگرمی|بازی/.test(n)) return Drama;
  if (/هدیه/.test(n)) return Gift;
  if (/تعمیر/.test(n)) return Wrench;
  if (/خانه|منزل|اجاره|رهن|ساختمان/.test(n)) return HomeIcon;
  if (/بانک|کارمزد/.test(n)) return Building2;
  if (/وام|قسط|درآمد|فروش|سود/.test(n)) return Banknote;
  return Sparkles;
}
