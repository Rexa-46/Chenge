import { BellRing, Fingerprint } from "lucide-react";

import { Row } from "../../components/common/Row.jsx";
import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function AccessView({ settings, setSettings }) { const st=useStyles(); return <div><div style={{...st.card,padding:16}}><SectionTitle text="مدیریت دسترسی"/><Row title="قفل با اثر انگشت / Face ID" subtitle="احراز هویت واقعی گوشی در APK" leftIcon={<Fingerprint size={17}/>} leftColor={BRAND.violet} extra={<input type="checkbox" checked={!!settings.biometricEnabled} onChange={e=>setSettings(p=>({...p,biometricEnabled:e.target.checked}))}/>} chevron={null}/><Row title="دسترسی پیامک بانکی" subtitle="مجوز خواندن پیامک‌های بانکی در Android" leftIcon={<BellRing size={17}/>} leftColor={BRAND.header} chevron={null}/></div></div>; }
