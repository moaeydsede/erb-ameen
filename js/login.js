import { auth, db } from "./firebase.js";
import { ERP } from "./config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { setSession } from "./session.js";

const $ = (id)=>document.getElementById(id);

function usernameToEmail(username){
  return `${username.toLowerCase()}@${ERP.USERNAME_EMAIL_DOMAIN}`;
}

function show(msg, ok=false){
  const el = $("msg");
  el.textContent = msg || "";
  el.className = "notice " + (ok ? "ok" : "err");
  el.style.display = msg ? "block" : "none";
}

async function loadProfile(username){
  const ref = doc(db, "users", username);
  const snap = await getDoc(ref);
  if(!snap.exists()) throw new Error("المستخدم غير موجود في قاعدة البيانات");
  const data = snap.data();
  if(data.active === false) throw new Error("هذا المستخدم غير فعّال");
  return data;
}

window.erpLogin = async function(){
  const username = $("username").value.trim();
  const password = $("password").value.trim();
  if(!username || !password){ show("أدخل اسم المستخدم وكلمة المرور"); return; }

  $("btn").disabled = true;
  show("");

  try{
    // 1) Auth sign-in (داخلياً عبر Email افتراضي)
    const email = usernameToEmail(username);
    await signInWithEmailAndPassword(auth, email, password);

    // 2) Load profile from Firestore
    const profile = await loadProfile(username);

    // 3) Save session (username + role + permissions)
    setSession({
      username,
      role: profile.role || "viewer",
      permissions: profile.permissions || {},
      displayName: profile.displayName || username,
      companyId: "main" // شركة واحدة فقط
    });

    location.href = "dashboard.html";
  }catch(e){
    console.error(e);
    const msg =
      (e.code === "auth/invalid-credential" || e.code==="auth/wrong-password") ? "بيانات الدخول غير صحيحة" :
      (e.code === "auth/user-not-found") ? "المستخدم غير موجود في Authentication" :
      (e.code === "auth/too-many-requests") ? "محاولات كثيرة.. جرّب لاحقاً" :
      (e.message || "خطأ غير معروف");
    show(msg, false);
  }finally{
    $("btn").disabled = false;
  }
}
