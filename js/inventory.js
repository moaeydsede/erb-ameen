import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, removeDoc } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], moves=[], editing=null;
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
const onHand=id=>moves.filter(m=>m.itemId===id).reduce((a,m)=>a+(m.type==="in"?1:-1)*Number(m.qty||0),0);
const avgCost=id=>{const ins=moves.filter(m=>m.itemId===id&&m.type==="in");const q=ins.reduce((a,x)=>a+Number(x.qty||0),0);const v=ins.reduce((a,x)=>a+Number(x.qty||0)*Number(x.unitCost||0),0);return q>0?v/q:0;}
async function load(){items=await listDocs("items").catch(()=>[]);moves=await listDocs("inventoryMoves").catch(()=>[]);renderItems();renderMoves();}
function renderItems(){
  const q=($("qItem").value||"").trim().toLowerCase();
  const list=q?items.filter(i=>(i.name||"").toLowerCase().includes(q)||(i.sku||"").toLowerCase().includes(q)):items;
  $("itemsRows").innerHTML=(list.map(i=>`<tr><td>${i.sku||""}</td><td>${i.name||""}</td><td>${fmt(onHand(i.id))}</td><td>${fmt(avgCost(i.id))}</td><td style="white-space:nowrap"><button class="btn sm" data-act="edit" data-id="${i.id}">تعديل</button><button class="btn sm danger" data-act="del" data-id="${i.id}">حذف</button></td></tr>`).join(""))||`<tr><td colspan="5" class="notice">لا توجد مواد</td></tr>`;
  $("moveItem").innerHTML=items.map(i=>`<option value="${i.id}">${(i.sku||"")+" - "+(i.name||"")}</option>`).join("");
}
function renderMoves(){
  $("movesRows").innerHTML=(moves.slice(0,200).map(m=>{const it=items.find(i=>i.id===m.itemId);return `<tr><td>${m.date||""}</td><td>${m.day||""}</td><td>${it?it.name:"—"}</td><td><span class="chip">${m.type==="in"?"دخول":"خروج"}</span></td><td>${fmt(m.qty||0)}</td><td>${fmt(m.unitCost||0)}</td><td>${m.note||""}</td></tr>`;}).join(""))||`<tr><td colspan="7" class="notice">لا توجد حركة</td></tr>`;
}
async function saveItem(){const data={sku:$("sku").value.trim(),name:$("name").value.trim()}; if(!data.name) return show("اكتب اسم المادة"); await upsert("items",editing,data); show("تم حفظ المادة ✅",true); editing=null; $("sku").value=""; $("name").value=""; load();}
async function delItem(id){if(!confirm("تأكيد حذف المادة؟")) return; await removeDoc("items",id); show("تم الحذف ✅",true); load();}
async function saveMove(){
  const itemId=$("moveItem").value, type=$("moveType").value;
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const qty=Number($("qty").value||0), unitCost=Number($("unitCost").value||0), note=$("note").value.trim();
  if(!itemId) return show("اختر مادة"); if(qty<=0) return show("اكتب الكمية"); if(type==="in" && unitCost<=0) return show("اكتب تكلفة الدخول");
  await upsert("inventoryMoves",null,{itemId,type,date,day,qty,unitCost,note}); show("تم حفظ الحركة ✅",true);
  $("qty").value="1"; $("unitCost").value="0"; $("note").value=""; load();
}
document.addEventListener("click",(e)=>{const b=e.target.closest("button[data-act]"); if(!b) return; const it=items.find(x=>x.id===b.dataset.id); if(b.dataset.act==="edit"&&it){editing=it.id; $("sku").value=it.sku||""; $("name").value=it.name||"";} if(b.dataset.act==="del") delItem(b.dataset.id);});
$("saveItemBtn").onclick=saveItem; $("saveMoveBtn").onclick=saveMove; $("qItem").oninput=renderItems;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
load();
