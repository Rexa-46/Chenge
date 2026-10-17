import { RexaLogo } from "../../components/brand/RexaLogo.jsx";
import { BRAND } from "../../theme/palette.js";
import { useStyles } from "../../theme/styles.js";

export function ShareAppView() { const st=useStyles(); return <div><div style={{...st.card,padding:20,textAlign:"center"}}><RexaLogo size={70}/><div style={{fontWeight:800,margin:"10px 0"}}>Rexa</div><button onClick={async()=>{try{if(navigator.share)await navigator.share({title:"Rexa",text:"Rexa؛ مدیریت مالی شخصی"});else{await navigator.clipboard.writeText("Rexa؛ مدیریت مالی شخصی");alert("متن معرفی کپی شد.")}}catch{}}} style={{...st.primaryBtn,background:BRAND.violet}}>ارسال برنامه به دیگران</button></div></div>; }
