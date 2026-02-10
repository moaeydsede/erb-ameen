import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, removeDoc } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"accounts")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let editingId=null, cache=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function clear(){editingId=null;$("code").value="";$("name").value="";$("type").value="general";$("openingBalance").value="0";$("currency").value="";$("saveBtn").textContent="حفظ";}
function fill(a){editingId=a.id;$("code").value=a.code||"";$("name").value=a.name||"";$("type").value=a.type||"general";$("openingBalance").value=String(a.openingBalance||0);$("currency").value=a.currency||"";$("saveBtn").textContent="تحديث";}
async function load(){
  const q=($("q").value||"").trim().toLowerCase();
  cache=await listDocs("accounts").catch(()=>[]);
  const list=q?cache.filter(x=>(x.name||"").toLowerCase().includes(q)||(x.code||"").toLowerCase().includes(q)):cache;
  $("rows").innerHTML=(list.map(a=>`<tr><td>${a.code||""}</td><td>${a.name||""}</td><td><span class="chip">${a.type||"general"}</span></td><td>${fmt(a.openingBalance||0)}</td><td>${a.currency?`<span class="chip">${a.currency}</span>`:""}</td><td style="white-space:nowrap"><button class="btn sm" data-act="edit" data-id="${a.id}">تعديل</button><button class="btn sm danger" data-act="del" data-id="${a.id}">حذف</button></td></tr>`).join(""))||`<tr><td colspan="6" class="notice">لا توجد حسابات</td></tr>`;
}
async function save(){
  const data={code:$("code").value.trim(),name:$("name").value.trim(),type:$("type").value,openingBalance:Number($("openingBalance").value||0),currency:$("currency").value.trim()};
  if(!data.name) return show("اكتب اسم الحساب");
  await upsert("accounts",editingId,data);
  show("تم الحفظ ✅",true); clear(); load();
}
async function del(id){ if(!confirm("تأكيد الحذف؟")) return; await removeDoc("accounts",id); show("تم الحذف ✅",true); load(); }
document.addEventListener("click",(e)=>{const b=e.target.closest("button[data-act]"); if(!b) return; const a=cache.find(x=>x.id===b.dataset.id); if(b.dataset.act==="edit"&&a) fill(a); if(b.dataset.act==="del") del(b.dataset.id);});
$("saveBtn").onclick=save; $("resetBtn").onclick=clear; $("q").oninput=load; load();
