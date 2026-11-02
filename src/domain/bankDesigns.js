/* ---------------------------------------------------------
   طرح کارت‌های بانکی. رنگ‌ها تقریبیِ هویت بصری هر بانک‌اند (لوگوی رسمی استفاده نشده).
   bins: ۶ رقم اول شماره کارت برای تشخیص خودکار بانک
--------------------------------------------------------- */
const B = (id, name, from, to, bins = [], text = "#fff", pattern = "circles") => ({ id, name, from, to, bins, text, pattern, kind: "bank" });
const G = (id, name, from, to, text = "#fff", pattern = "circles") => ({ id, name, from, to, bins: [], text, pattern, kind: "generic" });

export const BANK_DESIGNS = [
  B("melli", "بانک ملی ایران", "#0b3d91", "#1b6fc7", ["603799"], "#fff", "waves"),
  B("mellat", "بانک ملت", "#b3122b", "#e0394f", ["610433", "991975"]),
  B("tejarat", "بانک تجارت", "#14509c", "#2d7fd1", ["627353", "585983"], "#fff", "diag"),
  B("saderat", "بانک صادرات ایران", "#0a3b7a", "#2a63b4", ["603769"], "#fff", "waves"),
  B("sepah", "بانک سپه", "#1a2f6b", "#f08a1c", ["589210"], "#fff", "diag"),
  B("refah", "بانک رفاه کارگران", "#0d4f8b", "#37a0d8", ["589463"]),
  B("keshavarzi", "بانک کشاورزی", "#1e7a36", "#58b043", ["603770", "639217"], "#fff", "waves"),
  B("maskan", "بانک مسکن", "#d9621a", "#f0a030", ["628023"], "#fff", "diag"),
  B("sanatmadan", "بانک صنعت و معدن", "#154a8a", "#4a86c8", ["627961"]),
  B("tosee-saderat", "بانک توسعه صادرات", "#0c2f6a", "#2f6cb8", ["627648", "207177"], "#fff", "waves"),
  B("tosee-taavon", "بانک توسعه تعاون", "#0f7a6b", "#35b59d", ["502908"]),
  B("postbank", "پست بانک ایران", "#1f8a3d", "#6cc04a", ["627760"], "#fff", "diag"),
  B("parsian", "بانک پارسیان", "#a31643", "#d9446f", ["622106", "639194", "627884"], "#fff", "waves"),
  B("pasargad", "بانک پاسارگاد", "#7a4a12", "#d1a33a", ["502229", "639347"], "#fff", "diag"),
  B("eghtesad-novin", "بانک اقتصاد نوین", "#5a2a82", "#9a5fc9", ["627412"]),
  B("saman", "بانک سامان", "#0b7d8f", "#2fc0c9", ["621986"], "#fff", "waves"),
  B("sina", "بانک سینا", "#1b4f9c", "#5aa6e0", ["639346"]),
  B("karafarin", "بانک کارآفرین", "#4b2a7b", "#2fa66b", ["627488", "502910"], "#fff", "diag"),
  B("sarmayeh", "بانک سرمایه", "#2a7a3c", "#7bc25a", ["639607"]),
  B("ayandeh", "بانک آینده", "#6b3a1b", "#d27a2e", ["636214", "175000"], "#fff", "waves"),
  B("shahr", "بانک شهر", "#8a1a22", "#d94a3a", ["502806", "504706"]),
  B("day", "بانک دی", "#0f6a8a", "#35b0c9", ["502938"], "#fff", "diag"),
  B("hekmat", "بانک حکمت ایرانیان", "#1c2f66", "#b3322f", ["636949"]),
  B("ansar", "بانک انصار", "#14663f", "#3aa56b", ["627381"], "#fff", "waves"),
  B("mehr-eghtesad", "بانک مهر اقتصاد", "#c23a6b", "#f08a4b", ["639370"]),
  B("gharz-mehr", "بانک قرض‌الحسنه مهر ایران", "#1e7d4a", "#6bbf6a", ["606373"], "#fff", "diag"),
  B("resalat", "بانک قرض‌الحسنه رسالت", "#1b6b45", "#4fb07a", ["504172"]),
  B("iran-zamin", "بانک ایران زمین", "#4a2b86", "#8a63c8", ["505785"], "#fff", "waves"),
  B("tourism", "بانک گردشگری", "#d9701a", "#f2b24a", ["505416"]),
  B("khavarmiane", "بانک خاورمیانه", "#12468a", "#3b86d0", ["505809", "585947"], "#fff", "diag"),
  B("markazi", "بانک مرکزی", "#17335f", "#4a6a9a", ["636795"]),
  B("noor", "مؤسسه اعتباری نور", "#1a5f7a", "#3aa0b8", ["507677"], "#fff", "waves"),
  B("kosar", "مؤسسه اعتباری کوثر", "#1c4f96", "#4a8fd6", ["505801"]),
  B("melal", "مؤسسه اعتباری ملل", "#243a7a", "#5a78c4", ["606256"], "#fff", "diag"),
  B("ghavamin", "بانک قوامین", "#1d6a4f", "#4fb08d", ["639599"]),
  B("tosee", "مؤسسه اعتباری توسعه", "#0e4a6e", "#2f8bb5", ["628157"], "#fff", "waves"),
  B("blu", "بلوبانک", "#0a8fe0", "#5ac8fa", [], "#fff", "waves"),
  B("digipay", "دیجی‌پی", "#e0342f", "#ff7a59", [], "#fff", "diag"),
  B("sadad", "پرداخت سداد", "#0b3d91", "#0f9ac8", [], "#fff", "waves"),
];

export const GENERIC_DESIGNS = [
  G("rexa", "بنفش رکسا (پیش‌فرض)", "#6C3FA0", "#3E1461"),
  G("night", "شب مشکی", "#1f2937", "#030712", "#fff", "waves"),
  G("gold", "طلایی", "#c9a227", "#7a5a0e", "#fff", "diag"),
  G("platinum", "پلاتینیوم نقره‌ای", "#9aa4b2", "#4b5563"),
  G("ocean", "اقیانوسی", "#0ea5e9", "#0b4f6c", "#fff", "waves"),
  G("emerald", "زمردی", "#10b981", "#065f46"),
  G("sunset", "غروب", "#f97316", "#be185d", "#fff", "diag"),
  G("rose", "گل‌رز", "#fb7185", "#9f1239"),
  G("sky", "آسمانی", "#38bdf8", "#6366f1", "#fff", "waves"),
  G("forest", "جنگلی", "#16a34a", "#14532d", "#fff", "diag"),
  G("cherry", "آلبالویی", "#be123c", "#4c0519"),
  G("lavender", "اطلسی", "#a78bfa", "#6d28d9", "#fff", "waves"),
  G("graphite", "گرافیتی", "#475569", "#0f172a", "#fff", "diag"),
  G("coffee", "قهوه‌ای", "#a16207", "#451a03"),
  G("mint", "نعنایی", "#5eead4", "#0f766e", "#073b36", "waves"),
  G("sand", "شنی روشن", "#f5e6c8", "#d9b779", "#3b2a10", "diag"),
];

export const ALL_DESIGNS = [...BANK_DESIGNS, ...GENERIC_DESIGNS];
const byId = new Map(ALL_DESIGNS.map((d) => [d.id, d]));
export const DEFAULT_DESIGN = byId.get("rexa");

export function detectBankDesign(cardNumber) {
  const n = String(cardNumber || "").replace(/\D/g, "");
  if (n.length < 6) return null;
  const bin = n.slice(0, 6);
  return BANK_DESIGNS.find((d) => d.bins.includes(bin)) || null;
}
// طرح انتخابی کاربر ← تشخیص از شماره کارت ← پیش‌فرض
export function resolveCardDesign(account) {
  const chosen = account?.cardDesign && account.cardDesign !== "auto" ? byId.get(account.cardDesign) : null;
  return chosen || detectBankDesign(account?.cardNumber) || DEFAULT_DESIGN;
}
