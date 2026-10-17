import { useCallback, useEffect, useRef, useState } from "react";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";

import { getSentenceError, resolveTodaySentence } from "../../services/dailySentence.js";
import { BRAND, FONT } from "../../theme/palette.js";

export function DailySentenceSplash({ onDone }) {
  const [sentence, setSentence] = useState(null);
  const en = sentence?.en || "";
  const faPron = sentence?.faPron || "";
  const faMean = sentence?.fa || "";
  const [speaking, setSpeaking] = useState(false);
  const [fading, setFading] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const timers = useRef([]);
  const finished = useRef(false);
  const speakId = useRef(0);
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // فید و ورود به برنامه
  const leave = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    clearTimers();
    try { window.speechSynthesis?.cancel(); } catch {}
    try { if (Capacitor.isNativePlatform()) TextToSpeech.stop(); } catch {}
    setSpeaking(false);
    setFading(true);
    setTimeout(onDone, 650);
  }, [onDone]);

  // پایان تلفظ → ۲ ثانیه مکث → فید
  const afterSpeech = useCallback(() => {
    if (finished.current) return;
    setSpeaking(false);
    clearTimers();
    later(leave, 2000);
  }, [leave]);

  const speak = useCallback(() => {
    if (!en) return;
    clearTimers();
    // اندروید (APK): صدای مرورگر در WebView کار نمی‌کند؛ از موتور TTS خود گوشی استفاده می‌شود
    if (Capacitor.isNativePlatform()) {
      const id = ++speakId.current;
      const done = () => { if (id === speakId.current) afterSpeech(); };
      (async () => {
        try { await TextToSpeech.stop(); } catch {}
        setSpeaking(true);
        try { await TextToSpeech.speak({ text: en, lang: "en-US", rate: 0.85, pitch: 1.0, volume: 1.0, category: "playback" }); } catch {}
        done();
      })();
      later(done, 15000);
      return;
    }
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      // دستگاه صدا ندارد: ۵ ثانیه برای خواندن جمله، بعد ۲ ثانیه و فید
      setSpeaking(false);
      later(afterSpeech, 5000);
      return;
    }
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(en);
      u.lang = "en-US"; u.rate = 0.85; u.pitch = 1;
      let started = false;
      u.onstart = () => { started = true; setSpeaking(true); };
      u.onend = afterSpeech;
      u.onerror = afterSpeech;
      synth.speak(u);
      // اگر ۳ ثانیه شروع نشد (مثلا صدا مسدود بود) یا onend هرگز نیامد، ادامه بده
      later(() => { if (!started) afterSpeech(); }, 3000);
      later(afterSpeech, 15000);
    } catch { later(afterSpeech, 5000); }
  }, [en, afterSpeech]);

  useEffect(() => {
    let alive = true;
    resolveTodaySentence().then((r) => { if (!alive) return; if (r) setSentence(r); else { setFailMsg(getSentenceError() || "اینترنت در دسترس نیست"); later(leave, 4500); } }).catch(() => { if (alive) leave(); });
    return () => { alive = false; clearTimers(); try { window.speechSynthesis?.cancel(); } catch {} try { if (Capacitor.isNativePlatform()) TextToSpeech.stop(); } catch {} };
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    if (!sentence) return;
    later(speak, 500);
    // eslint-disable-next-line
  }, [sentence]);

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 24px", boxSizing: "border-box", fontFamily: FONT, color: "#fff",
      background: `linear-gradient(160deg, ${BRAND.header}, ${BRAND.violet})`,
      opacity: fading ? 0 : 1, transition: "opacity .6s ease", position: "relative",
    }}>
      <style>{`@keyframes rexaPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.18);opacity:1}}`}</style>
      <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.8, letterSpacing: 0.5, marginBottom: 22 }}>جمله روز انگلیسی</div>
      <div style={{ fontSize: 40, marginBottom: 18, animation: speaking ? "rexaPulse 1s ease-in-out infinite" : "none" }}>🔊</div>
      {!sentence ? (
        failMsg ? <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9, textAlign: "center", lineHeight: 1.9, maxWidth: 340, direction: "ltr" }}>جمله‌ی امروز از اینترنت گرفته نشد<br />{failMsg}</div>
        : <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.85, textAlign: "center" }}>در حال آماده‌سازی جمله امروز...</div>
      ) : (<>
        <div style={{ direction: "ltr", textAlign: "center", fontSize: 26, fontWeight: 800, lineHeight: 1.45, maxWidth: 360 }}>{en}</div>
        {faPron ? <div style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: "#e8dcf5", textAlign: "center", lineHeight: 1.8, maxWidth: 340 }}>{faPron}</div> : null}
        <div style={{ marginTop: 14, width: 48, height: 2, borderRadius: 2, background: "rgba(255,255,255,.35)" }} />
        <div style={{ marginTop: 14, fontSize: 16.5, fontWeight: 700, textAlign: "center", lineHeight: 1.9, maxWidth: 340 }}>{faMean}</div>
              </>)}
      <div style={{ display: "flex", gap: 10, marginTop: 34 }}>
        <button onClick={speak} style={{ border: "1.5px solid rgba(255,255,255,.45)", background: "rgba(255,255,255,.12)", color: "#fff", borderRadius: 22, padding: "9px 18px", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>پخش دوباره</button>
        <button onClick={leave} style={{ border: "none", background: "#fff", color: BRAND.header, borderRadius: 22, padding: "9px 22px", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>ورود به برنامه</button>
      </div>
    </div>
  );
}
