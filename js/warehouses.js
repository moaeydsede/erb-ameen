
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, removeDoc } from "./data.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let editing=null, cache=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function clear(){editing=null;$("name").value="";$("active").value="true";$("saveBtn").textContent="حفظ";}
function render(){
  const q=($("q").value||"").trim();
  const rows=cache.filter(x=>!q || (x.name||"").includes(q)).sort((a,b)=>(a.name||"").localeCompare(b.name||"","ar"));
  $("rows").innerHTML = rows.map(w=>`<tr>
    <td><b>${w.name||""}</b></td>
    <td>${w.active===false?"موقوف":"نشط"}</td>
    <td style="white-space:nowrap">
      <button class="btn sm" data-act="edit" data-id="${w.id}">تعديل</button>
      <button class="btn sm danger" data-act="del" data-id="${w.id}">حذف</button>
    </td>
  </tr>`).join("") || `<tr><td colspan="3" class="notice">لا توجد مستودعات</td></tr>`;
}
async function load(){
  cache=await listDocs("warehouses").catch(()=>[]);
  if(!cache.length){ await upsert("warehouses",null,{name:"المستودع الرئيسي",active:true,isDefault:true}); cache=await listDocs("warehouses").catch(()=>[]); }
  render();
}
async function save(){
  const name=($("name").value||"").trim();
  const active=$("active").value==="true";
  if(!name) return show("اكتب الاسم",false);
  await upsert("warehouses",editing,{name,active});
  show("تم الحفظ ✅",true); clear(); await load();
}
async function del(id){
  if(!confirm("تأكيد حذف المستودع؟")) return;
  await removeDoc("warehouses",id);
  show("تم الحذف ✅",true); await load();
}
document.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]"); if(!b) return;
  const id=b.dataset.id;
  const act=b.dataset.act;
  const w=cache.find(x=>x.id===id);
  if(act==="edit" && w){ editing=id; $("name").value=w.name||""; $("active").value=(w.active===false?"false":"true"); $("saveBtn").textContent="تحديث"; }
  if(act==="del") del(id);
});
$("saveBtn").onclick=save;
$("resetBtn").onclick=clear;
$("q").addEventListener("input",render);
clear(); load();
