import { requireSession } from "./session.js";
import { listDocs, setById, removeDoc } from "./data.js";
const s=requireSession(); if(s.role!=="admin") location.href="dashboard.html";
const $=id=>document.getElementById(id);
let cache=[];
const KEYS=["company","accounts","invoices","manufacturing","vouchers","reports","cfo","viewPurchasePrices","viewCosts","viewProfit","printInvoices","exportExcel"];
const T={viewer:{company:false,accounts:false,invoices:false,manufacturing:false,vouchers:false,reports:false,cfo:false,viewPurchasePrices:false,viewCosts:false,viewProfit:false,printInvoices:false,exportExcel:false},
sales:{company:false,accounts:false,invoices:true,viewPurchasePrices:false,viewCosts:false,viewProfit:true,printInvoices:true,exportExcel:true,manufacturing:false,vouchers:true,reports:false,cfo:false},
accountant:{company:false,accounts:true,invoices:true,manufacturing:false,vouchers:true,reports:true,cfo:false},
warehouse:{company:false,accounts:false,invoices:false,manufacturing:true,vouchers:false,reports:false,cfo:false},
admin_all:{company:true,accounts:true,invoices:true,manufacturing:true,vouchers:true,reports:true,cfo:true}};
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function exhibits={}
function getP(){const p={};KEYS.forEach(k=>p[k]=!!document.getElementById("p_"+k).checked);return p;}
function setP(p){KEYS.forEach(k=>document.getElementById("p_"+k).checked=!!(p&&p[k]));}
function clear(){ $("username").value=""; $("role").value="viewer"; $("active").checked=true; setP(T.viewer); $("saveBtn").textContent="حفظ"; $("authNote").innerHTML=""; }
function fill(u){ $("username").value=u.id; $("role").value=u.role||"viewer"; $("active").checked=u.active!==false; setP(u.permissions||{}); $("saveBtn").textContent="تحديث"; $("authNote").innerHTML=`<div class="notice">⚠️ كلمة المرور تُنشأ مرة واحدة من Firebase Authentication. البريد: <b>${u.id}@erp-pro.local</b></div>`;}
async function load(){ cache=await listDocs("users").catch(()=>[]); $("rows").innerHTML = cache.map(u=>`<tr><td>${u.id}</td><td><span class="chip">${u.role||"viewer"}</span></td><td>${u.active===false?'<span class="chip">غير فعّال</span>':'<span class="chip">فعّال</span>'}</td><td style="white-space:nowrap"><button class="btn sm" data-act="edit" data-id="${u.id}">تعديل</button><button class="btn sm danger" data-act="del" data-id="${u.id}">حذف</button></td></tr>`).join("") || `<tr><td colspan="4" class="notice">لا يوجد مستخدمين</td></tr>`; }
async function save(){ const u=$("username").value.trim().toLowerCase(); if(!u) return show("اكتب اسم المستخدم"); await setById("users",u,{username:u,role:$("role").value,active:$("active").checked,permissions:getP()}); show("تم حفظ المستخدم ✅",true); clear(); load(); }
async function delUser(id){ if(!confirm("تأكيد حذف المستخدم؟")) return; await removeDoc("users",id); show("تم الحذف ✅",true); load(); }
document.addEventListener("click",(e)=>{const b=e.target.closest("button[data-act]"); if(!b) return; const u=cache.find(x=>x.id===b.dataset.id); if(b.dataset.act==="edit"&&u) fill(u); if(b.dataset.act==="del") delUser(b.dataset.id);});
$("template").addEventListener("change",()=>{const t=$("template").value; if(t) setP(T[t]);});
$("saveBtn").onclick=save; $("resetBtn").onclick=clear; clear(); load();
