import { useState } from "react";

import { SectionTitle } from "../../components/common/SectionTitle.jsx";
import { useStyles } from "../../theme/styles.js";

/* ---------------------------------------------------------
   Side menu
--------------------------------------------------------- */
export function ProfileView({ settings, setSettings }) { const st=useStyles(); const p=settings.profile||{}; const [f,setF]=useState({name:p.name||"",phone:p.phone||"",email:p.email||""}); return <div><div style={{...st.card,padding:16}}><SectionTitle text="ویرایش اطلاعات کاربری"/><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="نام و نام خانوادگی" style={st.input}/><input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="شماره موبایل" style={st.input}/><input value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="ایمیل" style={st.input}/><button onClick={()=>{setSettings(x=>({...x,profile:{...(x.profile||{}),...f}}));alert("اطلاعات کاربری ذخیره شد.")}} style={st.primaryBtn}>ذخیره اطلاعات</button></div></div>; }
