/* اعتبارسنجی ساختار فایل پشتیبان پیش از بازیابی: فایل ناقص یا بی‌ربط هرگز اعمال نمی‌شود */
const ARRAY_KEYS = ["accounts", "categories", "transactions", "journalEntries", "budgets", "loans", "checks", "bills", "assets", "recurring", "shortcuts", "members", "events", "projects", "fiscalPeriods", "notes", "reminders", "persons", "debts", "currencies", "goals"];
const DATA_KEYS = [...ARRAY_KEYS.filter((k) => k !== "journalEntries" && k !== "shortcuts"), "favorites", "settings"];
const TX_TYPES = ["expense", "income", "transfer"];
const MAX_SUPPORTED_BACKUP_VERSION = 4;
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

export function validateBackup(data) {
  const errors = [];
  if (!isObj(data)) return { ok: false, errors: ["محتوای فایل یک پشتیبان Rexa نیست."], counts: {} };
  if (data.backupVersion !== undefined && Number(data.backupVersion) > MAX_SUPPORTED_BACKUP_VERSION) errors.push("این پشتیبان با نسخه‌ی جدیدتری از Rexa گرفته شده؛ ابتدا برنامه را به‌روز کن.");
  if (!DATA_KEYS.some((k) => data[k] !== undefined)) errors.push("هیچ داده‌ی شناخته‌شده‌ای در فایل نیست.");
  for (const k of ARRAY_KEYS) if (data[k] !== undefined && !Array.isArray(data[k])) errors.push(`بخش «${k}» ساختار درستی ندارد.`);
  if (data.favorites !== undefined && !isObj(data.favorites)) errors.push("بخش «favorites» ساختار درستی ندارد.");
  if (data.settings !== undefined && !isObj(data.settings)) errors.push("بخش «settings» ساختار درستی ندارد.");
  if (!errors.length) {
    const badTx = (data.transactions || []).findIndex((t) => !isObj(t) || !TX_TYPES.includes(t.type) || !Number.isFinite(Number(t.amount)) || typeof t.date !== "string");
    if (badTx >= 0) errors.push(`تراکنش شماره‌ی ${badTx + 1} ناقص یا خراب است.`);
    for (const k of ["accounts", "categories", "loans", "checks", "bills", "assets", "recurring", "persons", "debts", "goals"]) {
      const i = (data[k] || []).findIndex((x) => !isObj(x));
      if (i >= 0) errors.push(`یکی از آیتم‌های «${k}» خراب است.`);
    }
    // ارجاع تراکنش‌ها به حساب‌های موجود در همین فایل (اگر هر دو در فایل باشند)
    if (Array.isArray(data.accounts) && data.accounts.length && Array.isArray(data.transactions)) {
      const ids = new Set(data.accounts.map((a) => a.id));
      if (data.transactions.length && data.transactions.every((t) => t.accountId && !ids.has(t.accountId))) errors.push("هیچ‌کدام از تراکنش‌ها به حساب‌های داخل فایل وصل نیست؛ فایل ناقص است.");
    }
  }
  const counts = {};
  for (const k of ["accounts", "transactions", "loans", "checks", "bills"]) if (Array.isArray(data[k])) counts[k] = data[k].length;
  return { ok: !errors.length, errors, counts };
}

// پشتیبان رمزگذاری‌شده (AES-GCM) همان قالب همگام‌سازی گیت‌هاب را دارد
export function isEncryptedBackup(parsed) {
  return isObj(parsed) && parsed.app === "rexa" && !!parsed.ct && !!parsed.iv && !!parsed.salt;
}
