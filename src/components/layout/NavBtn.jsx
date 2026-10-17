// رنگ هر آیکن سه‌بعدی: روشن، تیره، و رنگ ضخامت (عمق)
export const NAV3D = {
  reports: { c1: "#c4a6ff", c2: "#7c3aed", side: "#4c1d95" },
  transactions: { c1: "#7cc0ff", c2: "#1d6fd8", side: "#12408a" },
  __add: { c1: "#ff9db9", c2: "#e11d5a", side: "#8f0f3a" },
  checks: { c1: "#ffd77a", c2: "#f59e0b", side: "#98590a" },
  home: { c1: "#7ee8c0", c2: "#059669", side: "#065f46" },
};
const NAV_BTN_RESET = { background: "none", border: "none", outline: "none", boxShadow: "none", WebkitTapHighlightColor: "transparent", appearance: "none", WebkitAppearance: "none", padding: 0, margin: 0, height: 66, pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 2, cursor: "pointer", fontFamily: "inherit", userSelect: "none" };
export function NavBtn({ it, isActive, onClick, dark }) {
  const Icon = it.icon; const c = NAV3D[it.key];
  const big = it.key === "__add";
  const size = big ? 40 : isActive ? 35 : 31;
  const depth = isActive || big ? 5 : 3;
  const g = `url(#nav3d-${it.key})`;
  const common = { size, strokeWidth: big ? 2.6 : 2.3, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <button onClick={onClick} aria-label={it.label} style={{ ...NAV_BTN_RESET, opacity: isActive || big || true ? 1 : 1 }}>
      <span style={{ position: "relative", width: size, height: size + depth, display: "block", transform: `perspective(260px) rotateX(${isActive || big ? 14 : 9}deg) translateY(${isActive ? -4 : 0}px)`, transformOrigin: "50% 100%", transition: "transform .2s ease", filter: `drop-shadow(0 ${isActive || big ? 7 : 4}px ${isActive || big ? 7 : 4}px rgba(0,0,0,${dark ? 0.55 : 0.28}))`, opacity: isActive || big ? 1 : 0.88 }}>
        {Array.from({ length: depth }, (_, i) => depth - i).map((d) => (
          <Icon key={d} {...common} color={c.side} fill={c.side} fillOpacity={0.9} style={{ position: "absolute", left: 0, top: d }} />
        ))}
        <Icon {...common} color={g} stroke={g} fill={g} fillOpacity={0.32} style={{ position: "absolute", left: 0, top: 0 }} />
      </span>
      <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600, marginTop: 2, color: isActive ? c.c2 : (dark ? "#b7c0d6" : "#5b6785"), textShadow: dark ? "0 0 5px rgba(0,0,0,.9)" : "0 0 5px rgba(255,255,255,.95), 0 0 9px rgba(255,255,255,.8)" }}>{it.label}</span>
    </button>
  );
}
