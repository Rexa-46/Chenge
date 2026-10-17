import { parseSlipText } from "./slipParser.js";
import { withTimeout } from "../utils/async.js";

/* --- خواندن برگه پوز: OCR کاملاً آفلاین و رایگان (Tesseract.js) ---
   موتور و دادهٔ زبان فارسی داخل خود برنامه است (public/ocr)؛ بدون اینترنت، بدون کلید API. */
let _ocrWorkerPromise = null;
let _ocrProgressCb = null;
let _ocrCoreIdx = 0;          // اگر هسته‌ی سریع روی گوشی بالا نیامد، به هسته‌ی ساده می‌رویم
let _ocrDiag = "";            // آخرین مرحله‌ی بارگذاری (برای نمایش در خطا)
const ocrUrl = (p) => new URL(`ocr/${p}`, document.baseURI).href;
// پشتیبانی WebAssembly SIMD (هسته‌ی «relaxed» عمداً استفاده نمی‌شود؛ روی بعضی WebViewها گیر می‌کند)
function ocrSimdOk() {
  try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); } catch { return false; }
}
const ocrCores = () => ["tesseract-core-simd-lstm.wasm.js"];   // فقط هسته‌ی SIMD (حجم کمتر)؛ گوشی‌های امروزی همگی پشتیبانی می‌کنند
export function getOcrWorker() {
  if (!_ocrWorkerPromise) {
    const core = ocrCores()[0];
    _ocrWorkerPromise = (async () => {
      _ocrDiag = "شروع";
      const [{ createWorker }, langMod] = await Promise.all([import("tesseract.js"), import("./ocrLangFas.js")]);
      _ocrDiag = "آماده‌سازی داده‌ی زبان";
      const fasData = Uint8Array.from(atob(langMod.default), (c) => c.charCodeAt(0));   // داده‌ی زبان داخل خود برنامه است
      return await createWorker([{ code: "fas", data: fasData }], 1, {
        workerPath: ocrUrl("worker.min.js"),
        corePath: ocrUrl(core),
        workerBlobURL: false,
        cacheMethod: "none",
        logger: (m) => { _ocrDiag = `${m.status} ${Math.round((m.progress || 0) * 100)}٪`; try { _ocrProgressCb?.(m); } catch {} },
      });
    })().catch((e) => { _ocrDiag = `${_ocrDiag} / ${e?.message || e}`; _ocrWorkerPromise = null; throw e; });
  }
  return _ocrWorkerPromise;
}
// عکس → بوم خاکستری با کنتراست کشیده‌شده (برای برگه‌های حرارتی کم‌رنگ)
function prepareSlipCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const px = img.width * img.height, shortSide = Math.min(img.width, img.height);
        const scale = px > 1.2e6 ? Math.sqrt(1.2e6 / px) : shortSide < 600 ? Math.min(2, 600 / shortSide) : 1;   // حدود ۱ مگاپیکسل: خیلی سریع‌تر و برای برگه کافی
        const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const im = ctx.getImageData(0, 0, w, h), d = im.data, hist = new Uint32Array(256);
        for (let i = 0; i < d.length; i += 4) { const g = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114); d[i] = d[i + 1] = d[i + 2] = g; hist[g]++; }
        const total = w * h; let acc = 0, lo = 0, hi = 255;
        for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.01) { lo = v; break; } }
        acc = 0;
        for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.01) { hi = v; break; } }
        const span = Math.max(40, hi - lo);
        for (let i = 0; i < d.length; i += 4) { const g = Math.max(0, Math.min(255, Math.round(((d[i] - lo) * 255) / span))); d[i] = d[i + 1] = d[i + 2] = g; }
        ctx.putImageData(im, 0, 0);
        resolve(canvas);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function extractSlip(file, categories, onStatus) {
  _ocrProgressCb = (m) => {
    const st = m.status || "";
    if (st === "recognizing text") onStatus?.(`در حال خواندن متن... ${Math.round((m.progress || 0) * 100)}٪`);
    else if (/language/i.test(st)) onStatus?.("بارگذاری زبان فارسی...");
    else if (/load|init/i.test(st)) onStatus?.("آماده‌سازی موتور خواندن متن...");
  };
  onStatus?.("آماده‌سازی تصویر...");
  const canvas = await prepareSlipCanvas(file);
  onStatus?.("آماده‌سازی موتور خواندن متن...");
  let worker = null;
  const cores = ocrCores();
  for (let k = _ocrCoreIdx; k < cores.length && !worker; k++) {
    _ocrCoreIdx = k;
    try { worker = await withTimeout(getOcrWorker(), k === 0 && cores.length > 1 ? 40000 : 90000); }
    catch (e) { _ocrWorkerPromise = null; }       // این هسته بالا نیامد → هسته‌ی بعدی
  }
  if (!worker) { _ocrCoreIdx = 0; throw new Error(ocrSimdOk() ? `بارگذاری موتور خواندن متن ناموفق بود — مرحله: ${_ocrDiag}` : "این گوشی از موتور خواندن متن پشتیبانی نمی‌کند (WebView قدیمی؛ آن را به‌روزرسانی کنید)"); }
  const run = async (psm, ms) => {
    await worker.setParameters({ tessedit_pageseg_mode: psm, preserve_interword_spaces: "1" });
    try { const { data } = await withTimeout(worker.recognize(canvas), ms); return parseSlipText(data?.text || "", categories); }
    catch (e) {
      if (/زمان/.test(e?.message || "")) { try { await worker.terminate(); } catch {} _ocrWorkerPromise = null; throw new Error("خواندن متن بیش از حد طول کشید"); }
      throw e;
    }
  };
  let best = await run("6", 60000);                 // یک بار با حالت سریع و دقیق برای برگه
  if (!best.amount) {                               // فقط اگر مبلغ پیدا نشد، حالت دوم
    onStatus?.("تلاش دوباره برای پیدا کردن مبلغ...");
    try { const r2 = await run("4", 40000); if (r2.amount) best = { ...r2, merchant: best.merchant || r2.merchant }; } catch {}
  }
  return best;
}
