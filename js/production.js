
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], boms=[], whs=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function fill(){
  const opt=items.filter(i=>i.kind==="item").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  $("fg").innerHTML=opt;
  const wopt=whs.filter(w=>w.active!==false).map(w=>`<option value="${w.id}">${w.name}</option>`).join("");
  $("fromWh").innerHTML=wopt; $("toWh").innerHTML=wopt;
}
function findBom(fgId){ return boms.find(b=>b.fgId===fgId || b.id===fgId); }
async function run(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const fgId=$("fg").value;
  const qty=Number($("qty").value||0);
  const fromWh=$("fromWh").value, toWh=$("toWh").value;
  if(!fgId||qty<=0) return show("اختر المنتج والكمية",false);
  if(!fromWh||!toWh) return show("اختر المستودعات",false);
  const bom=findBom(fgId);
  if(!bom) return show("لا يوجد BOM لهذا المنتج. أنشئه أولاً.",false);
  const factor = qty / Number(bom.fgQty||1);
  const lines = (bom.lines||[]).map(l=>({itemId:l.itemId, qty:Number(l.qty||0)*factor}));
  const prodId = await upsert("productions",null,{date,day,fgId,qty,fromWh,toWh,lines});
  // consume raw
  for(const l of lines){
    await upsert("moves",null,{itemId:l.itemId,dir:"out",qty:l.qty,date,day,note:"تصنيع - خام",warehouseId:fromWh,source:"production",refId:prodId});
  }
  // produce finished good
  await upsert("moves",null,{itemId:fgId,dir:"in",qty:qty,date,day,note:"تصنيع - جاهز",warehouseId:toWh,source:"production",refId:prodId});
  show("تم تنفيذ الإنتاج ✅",true);
}
$("runBtn").onclick=run;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value);
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
(async()=>{
  items=await listDocs("items").catch(()=>[]);
  boms=await listDocs("boms").catch(()=>[]);
  whs=await listDocs("warehouses").catch(()=>[]);
  fill();
})();
