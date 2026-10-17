import { X } from "lucide-react";

import { RexaLogo } from "../brand/RexaLogo.jsx";
import { BRAND } from "../../theme/palette.js";

/* ---------------------------------------------------------
   Side menu
--------------------------------------------------------- */
export function SideMenu({ onClose, setSubView, profileName }) {
  const sections=[
    {title:"تنظیمات و برنامه",items:[["ویرایش اطلاعات کاربری","profile"],["پشتیبان‌گیری","backup"],["همگام‌سازی ابری (گیت‌هاب)","cloud"],["مدیریت دسترسی","access"],["تنظیمات پایه","basic"],["تنظیمات و امنیت","settings"],["آموزش","tutorial"],["ارسال برنامه به دیگران","share"],["امتیاز به برنامه","rate"],["درباره","about"]]}
  ];
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.42)",zIndex:310,maxWidth:480,margin:"0 auto"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:0,bottom:0,left:0,width:"86%",maxWidth:390,background:"#fff",boxShadow:"3px 0 18px rgba(0,0,0,.22)",overflowY:"auto",paddingTop:"env(safe-area-inset-top,0px)",paddingBottom:"calc(28px + env(safe-area-inset-bottom,0px))"}}><div style={{background:BRAND.header,color:"#fff",padding:"16px",position:"sticky",top:0,zIndex:2}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}><div style={{display:"flex",alignItems:"center",gap:10}}><RexaLogo size={42}/><div><div style={{fontWeight:800,fontSize:15}}>{profileName||"کاربر Rexa"}</div><div style={{fontSize:11,color:"#d8c9e8",marginTop:3}}>Rexa · نسخه ۵.۱.۲</div></div></div><button onClick={onClose} style={{background:"rgba(255,255,255,.12)",border:0,borderRadius:9,color:"#fff",width:36,height:36}}><X size={21}/></button></div></div><div style={{padding:"8px 14px 0"}}>{sections.map(sec=><div key={sec.title}><div style={{fontSize:11,fontWeight:800,color:BRAND.violet,padding:"13px 6px 7px"}}>{sec.title}</div><div style={{border:"1px solid #eeeaf2",borderRadius:12,overflow:"hidden",marginBottom:6}}>{sec.items.map(([label,key],i)=><div key={key} onClick={()=>setSubView(key)} style={{padding:"12px 10px",borderBottom:i===sec.items.length-1?"none":"1px solid #f0eef3",fontSize:13.5,fontWeight:600,color:"#241a30",background:"#fff"}}>{label}</div>)}</div></div>)}<div style={{textAlign:"center",color:"#918899",fontSize:10.5,padding:"14px 0 10px"}}>Rexa Personal Finance · نسخه ۵.۱.۲ · Android</div></div></div></div>;
}
