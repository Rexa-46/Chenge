import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";
import { Mic } from "lucide-react";

import { BRAND } from "../../theme/palette.js";
import { iconBtn } from "../../theme/styles.js";

export function VoiceCaptureButton({ onResult, dark }) {
  const [listening, setListening] = useState(false);
  const isNative = typeof Capacitor !== "undefined" && Capacitor.isNativePlatform && Capacitor.isNativePlatform();

  async function startNative() {
    try {
      setListening(true);
      try { await SpeechRecognition.requestPermissions(); } catch { /* some versions prompt inside start() instead */ }
      const result = await SpeechRecognition.start({
        language: "fa-IR", maxResults: 1, prompt: "چی می‌خوای ثبت کنی؟", partialResults: false, popup: true,
      });
      setListening(false);
      const transcript = result?.matches?.[0];
      if (transcript) onResult(transcript);
      else alert("چیزی شنیده نشد، دوباره امتحان کن.");
    } catch (e) {
      setListening(false);
      alert("مشکلی در تشخیص گفتار پیش اومد. دوباره امتحان کن یا از دکمه‌ی سه‌بار لمس صفحه برای ثبت متنی استفاده کن.");
    }
  }

  function startWeb() {
    const Rec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Rec) {
      alert("تشخیص گفتار روی این مرورگر پشتیبانی نمی‌شود. وقتی برنامه به‌صورت APK نصب بشه، از تشخیص گفتار واقعی گوشی استفاده می‌کنه. فعلاً می‌تونی از دکمه سه‌بار لمس صفحه برای ثبت متنی استفاده کنی.");
      return;
    }
    const rec = new Rec();
    rec.lang = "fa-IR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) onResult(transcript);
    };
    try { rec.start(); } catch { setListening(false); }
  }

  function start() { if (isNative) startNative(); else startWeb(); }

  return (
    <button onClick={start} style={{ ...iconBtn, color: dark ? (listening ? BRAND.orange : BRAND.header) : (listening ? "#ffd166" : "#fff") }} title="ثبت با صدا">
      <Mic size={20} />
    </button>
  );
}
