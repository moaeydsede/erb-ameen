import { requireSession, hasPerm } from "./session.js";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
const s=requireSession(); if(!hasPerm(s,"company")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
async function load(){const snap=await getDoc(doc(db,"company","main")); if(snap.exists()){const d=snap.data(); $("name").value=d.name||""; $("language").value=d.language||"ar"; $("baseCurrency").value=d.baseCurrency||"EGP"; $("multiCurrency").value=String(!!d.multiCurrency); $("pricingPolicy").value=d.pricingPolicy||"AVG";
$("phones").value=d.phones||"";
$("address").value=d.address||"";
$("costPriceMethod").value=d.costPriceMethod||"last";}}
async function save(){await setDoc(doc(db,"company","main"),{name:$("name").value.trim()||"ERP PRO",language:$("language").value,baseCurrency:$("baseCurrency").value.trim()||"EGP",multiCurrency:$("multiCurrency").value==="true",pricingPolicy:$("pricingPolicy").value,
phones:$("phones").value.trim(),
address:$("address").value.trim(),
costPriceMethod:$("costPriceMethod").value,updatedAt:serverTimestamp()},{merge:true});show("تم الحفظ ✅",true);}
$("saveBtn").onclick=save; load();
