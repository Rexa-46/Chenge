import {
  Anchor, Banknote, Briefcase, Building2, Coins, CreditCard, Crown, Diamond, Flame, Gem, Globe, Heart, Landmark, Leaf,
  Moon, PiggyBank, Rocket, Shield, ShieldCheck, Star, Sun, TrendingUp, Wallet, Zap,
} from "lucide-react";

/* لوگوی کارت: آیکن آماده («icon:نام») یا تصویر دلخواه کاربر («img:داده») */
export const LOGO_ICONS = { Landmark, CreditCard, Wallet, PiggyBank, Banknote, Coins, Gem, Crown, Star, Shield, ShieldCheck, Leaf, Flame, Zap, Sun, Moon, Heart, Diamond, Anchor, Globe, Rocket, Briefcase, Building2, TrendingUp };

export function CardLogo({ logo, size = 30 }) {
  if (!logo || logo === "none") return null;
  if (logo.startsWith("img:")) {
    return <span style={{ width: size, height: size, borderRadius: size / 4, background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}><img src={logo.slice(4)} alt="" style={{ maxWidth: "88%", maxHeight: "88%", objectFit: "contain" }} /></span>;
  }
  const I = LOGO_ICONS[logo.replace(/^icon:/, "")];
  if (!I) return null;
  return <span style={{ width: size, height: size, borderRadius: size / 4, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I size={Math.round(size * 0.62)} color="#fff" /></span>;
}
