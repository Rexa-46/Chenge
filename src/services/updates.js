import { Browser } from "@capacitor/browser";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

// باز کردن لینک دانلود در مرورگر گوشی (داخل WebView برنامه، window.open کاری نمی‌کند)
export async function openExternalUrl(url) {
  if (!url) return;
  try { if (Capacitor.isNativePlatform()) { await Browser.open({ url }); return; } } catch {}
  try { window.location.href = url; } catch {}
}
let _updErr = "";
async function rawGet(url, accept) {
  if (Capacitor.isNativePlatform()) { const r = await CapacitorHttp.get({ url, headers: { Accept: accept, "Cache-Control": "no-cache" }, connectTimeout: 8000, readTimeout: 12000 }); return { status: r.status, data: r.data, url: r.url }; }
  const r = await fetch(url, { headers: { Accept: accept } }); return { status: r.status, data: accept.includes("json") ? await r.json().catch(() => ({})) : null, url: r.url };
}
// آخرین نسخه‌ی منتشرشده: اول API گیت‌هاب، اگر نشد خود صفحه‌ی releases/latest (بدون محدودیت API)
export async function checkLatestRelease(repo) {
  _updErr = "";
  try {
    const r = await rawGet(`https://api.github.com/repos/${repo}/releases/latest?t=${Date.now()}`, "application/vnd.github+json");
    const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
    if (r.status === 200 && data) {
      const n = Number(String(data.tag_name || "").replace(/\D/g, ""));
      const apk = (data.assets || []).find((x) => /\.apk$/i.test(x.name));
      return { build: n, name: data.name || data.tag_name, url: apk?.browser_download_url || data.html_url, page: data.html_url };
    }
    _updErr = `API ${r.status}`;
  } catch (e) { _updErr = `API ${e?.message || e}`; }
  try {
    const r = await rawGet(`https://github.com/${repo}/releases/latest`, "text/html");
    const m = String(r.url || "").match(/\/releases\/tag\/([^/?#]+)/);
    if (r.status === 200 && m) {
      const tag = decodeURIComponent(m[1]); const n = Number(tag.replace(/\D/g, ""));
      return { build: n, name: `Rexa build ${n}`, url: `https://github.com/${repo}/releases/download/${tag}/Rexa-build-${n}.apk`, page: `https://github.com/${repo}/releases/tag/${tag}` };
    }
    _updErr += ` | صفحه ${r.status}`;
  } catch (e) { _updErr += ` | صفحه ${e?.message || e}`; }
  return null;
}
export const getUpdateError = () => _updErr;
