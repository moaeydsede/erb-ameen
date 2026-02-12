import { auth, db } from "./firebase.js";
import { ERP } from "./config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { setSession } from "./session.js";
const $=id=>document.getElementById(id);
const toEmail=u=>`${u.toLowerCase()}@${ERP.USERNAME_EMAIL_DOMAIN}`;
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
async function profile(u){const s=await getDoc(doc(db,"users",u));if(!s.exists()) throw new Error("users/"+u+" غير موجود");const d=s.data();if(d.active===false) throw new Error("المستخدم غير فعّال");return d;}
window.erpLogin=async()=>{const u=$("username").value.trim(),p=$("password").value.trim();if(!u||!p) return show("أدخل اسم المستخدم وكلمة المرور");$("btn").disabled=true;show("");try{await signInWithEmailAndPassword(auth,toEmail(u),p);const pr=await profile(u);setSession({username:u,role:pr.role||"viewer",permissions:pr.permissions||{}});location.href="dashboard.html";}catch(e){console.error(e);show(e.message||"خطأ");}finally{$("btn").disabled=false}};
