import { useStyles } from "../../theme/styles.js";

export function TutorialView() { const st=useStyles(); const a=["دکمه + برای هزینه، درآمد، چک و انتقال است.","میکروفون و ثبت سریع برای ثبت طبیعی هزینه و درآمد هستند.","منوی سه‌خط دسترسی به حساب‌ها، اشخاص، بودجه، وام، چک و گزارش‌ها را دارد.","برای حفظ اطلاعات مرتب پشتیبان بگیر.","اثر انگشت را از مدیریت دسترسی فعال کن."]; return <div>{a.map((x,i)=><div key={i} style={{...st.card,padding:14,marginBottom:10,display:"flex",gap:10}}><b>{i+1}</b><span style={{fontSize:13,lineHeight:1.9}}>{x}</span></div>)}</div>; }
