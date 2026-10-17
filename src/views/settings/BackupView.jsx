import { useRef } from "react";

import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { useT } from "../../theme/ThemeContext.js";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function BackupView({ exportBackup, importBackup }) { const st=useStyles(); const ref=useRef(null); return <div><div style={{...st.card,padding:16}}><SectionTitle text="پشتیبان‌گیری و بازیابی"/><div style={{fontSize:12,color:useT().sub,lineHeight:1.9,marginBottom:12}}>از اطلاعات برنامه فایل پشتیبان بگیر و در صورت نیاز آن را بازیابی کن.</div><button onClick={exportBackup} style={{...st.primaryBtn,background:BRAND.header,marginBottom:10}}>دریافت فایل پشتیبان</button><button onClick={()=>ref.current?.click()} style={{...st.primaryBtn,background:BRAND.gold,color:"#241a30"}}>بازیابی از فایل پشتیبان</button><input ref={ref} type="file" accept="application/json,.json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)importBackup(f);e.target.value=""}}/></div></div>; }
