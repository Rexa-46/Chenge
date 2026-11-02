/* آیکن گرافیکی: کاشی گرادیانی رنگی با درخشش و سایه؛ رنگ هر آیکن از روی کلید/نامش ثابت می‌ماند */
const GRADS = [
  ["#ffb36b", "#ff5e62"], ["#5ff0a0", "#12a37f"], ["#6bc4ff", "#3b5bdb"], ["#ffd36b", "#f26b1d"],
  ["#d79bff", "#6c3fa0"], ["#ff8fb1", "#d6336c"], ["#6ff7e0", "#0c8f9c"], ["#ffe36b", "#e09100"],
  ["#9aa5ff", "#5b4bc4"], ["#a6f5b8", "#2fa35f"], ["#f6a6ff", "#b83293"], ["#7ae8ff", "#2b7bd3"],
];
const hash = (s) => { let h = 0; const str = String(s || ""); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };
export const gradFor = (seed) => GRADS[hash(seed) % GRADS.length];

export function IconBadge({ icon: Icon, seed, size = 34, selected = false, style }) {
  const [a, b] = gradFor(seed);
  return (
    <span style={{
      position: "relative", width: size, height: size, borderRadius: Math.round(size * 0.3), flexShrink: 0, overflow: "hidden",
      display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
      background: `linear-gradient(145deg, ${a}, ${b})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 4px rgba(0,0,0,.14), 0 3px 8px ${b}66${selected ? ", 0 0 0 2.5px #fff, 0 0 0 4.5px " + b : ""}`,
      ...style,
    }}>
      <span style={{ position: "absolute", top: -size * 0.25, left: -size * 0.1, width: size * 0.9, height: size * 0.6, borderRadius: "50%", background: "rgba(255,255,255,.28)", transform: "rotate(-20deg)" }} />
      <Icon size={Math.round(size * 0.56)} strokeWidth={2.2} style={{ position: "relative", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.28))" }} />
    </span>
  );
}
