import { useState } from "react";

import { useStyles } from "../../theme/styles.js";

export function RateAppView() { const st=useStyles(); const [r,setR]=useState(0); return <div><div style={{...st.card,padding:20,textAlign:"center"}}><div style={{fontWeight:800}}>امتیاز به برنامه</div><div style={{display:"flex",justifyContent:"center",gap:6,margin:"15px 0"}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setR(n)} style={{border:0,background:"none",fontSize:30,opacity:n<=r?1:.3}}>★</button>)}</div><button disabled={!r} onClick={()=>alert("امتیاز شما ثبت شد.")} style={{...st.primaryBtn,opacity:r?1:.5}}>ثبت امتیاز</button></div></div>; }
