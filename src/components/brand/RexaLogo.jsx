import { BRAND } from "../../theme/palette.js";

/* ===========================================================
   MAIN APP
=========================================================== */
/* ---------------------------------------------------------
   Rexa logo — fantasy coin-and-monogram mark, matches the app icon.
   Pure inline SVG so it renders inside the app itself (header,
   splash, side menu) without needing an image asset.
--------------------------------------------------------- */
export function RexaLogo({ size = 64, showWordmark = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 200 200">
        <defs>
          <radialGradient id="rexaCoin" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffe9b0" />
            <stop offset="55%" stopColor="#ffd166" />
            <stop offset="100%" stopColor="#e8a83c" />
          </radialGradient>
          <linearGradient id="rexaRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe6a0" />
            <stop offset="100%" stopColor="#e8951f" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#rexaRing)" />
        <circle cx="100" cy="100" r="76" fill="url(#rexaCoin)" stroke="#c9863a" strokeWidth="3" />
        <circle cx="100" cy="100" r="62" fill="none" stroke="#d6a24a" strokeWidth="3" />
        <text x="100" y="128" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="86" fill={BRAND.header}>R</text>
        <g fill="#fff" opacity="0.9">
          <path d="M162 44 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6 z" />
          <path d="M34 138 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z" opacity="0.7" />
        </g>
      </svg>
      {showWordmark && (
        <div style={{ fontWeight: 800, fontSize: size * 0.3, color: "#fff", letterSpacing: 1, fontFamily: "Georgia, serif" }}>Rexa</div>
      )}
    </div>
  );
}
