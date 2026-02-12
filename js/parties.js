import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, putDoc, removeDoc } from "./data.js";
const s=requireSession(); if(!hasPerm(s,"accounts")) location.href="dashboard.html";
const type=document.body.dataset.partyType;
const col=type==="customer"?"customers":"suppliers";
const $=id=>document.getElementById(id);
let editingId=null, cache=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function clear(){editingId=null;$("code").value="";$("name").value="";$("phone").value="";$("address").value="";$("saveBtn").textContent="حفظ";}
function fill(p){editingId=p.id;$("code").value=p.code||"";
  $("name").value=p.name||"";$("phone").value=p.phone||"";$("address").value=p.address||"";$("saveBtn").textContent="تحديث";}
async function load(){const q=($("q").value||"").trim().toLowerCase();cache=await listDocs(col).catch(()=>[]);const list=q?cache.filter(x=>(x.name||"").toLowerCase().includes(q)||(x.phone||"").toLowerCase().includes(q)):cache;$("rows").innerHTML=(list.map(p=>`<tr><td>${p.name||""}</td><td>${p.phone||""}</td><td>${p.address||""}</td><td style="white-space:nowrap"><button class="btn sm" data-act="edit" data-id="${p.id}">تعديل</button><button class="btn sm danger" data-act="del" data-id="${p.id}">حذف</button></td></tr>`).join(""))||`<tr><td colspan="4" class="notice">لا توجد بيانات</td></tr>`;}
async function save(){const data={name:$("name").value.trim(),phone:$("phone").value.trim(),address:$("address").value.trim()}; if(!data.name) return show("اكتب الاسم"); await upsert(col,editingId,data); show("تم الحفظ ✅",true); clear(); load();}
async function del(id){if(!confirm("تأكيد الحذف؟")) return; await removeDoc(col,id);
  try{ await removeDoc("accounts",id);}catch{} show("تم الحذف ✅",true); load();}
document.addEventListener("click",(e)=>{const b=e.target.closest("button[data-act]"); if(!b) return; const p=cache.find(x=>x.id===b.dataset.id); if(b.dataset.act==="edit"&&p) fill(p); if(b.dataset.act==="del") del(b.dataset.id);});
$("saveBtn").onclick=save; $("resetBtn").onclick=clear; $("q").oninput=load; load();
