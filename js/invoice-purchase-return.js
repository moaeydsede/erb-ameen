import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let suppliers=[], items=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr><td><select class="input" data-k="item"></select></td><td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td><td><input class="input" data-k="cost" type="number" step="0.01" value="0"></td><td class="chip" data-k="total">0.00</td><td><button class="btn sm danger" data-act="rm">حذف</button></td></tr>`;}
function fillSelects(){const opt=items.map(i=>`<option value="${i.id}">${(i.sku||"")+" - "+(i.name||"")}</option>`).join(""); document.querySelectorAll('#lines select[data-k="item"]').forEach(s=>s.innerHTML=opt);}
function addLine(){document.querySelector("#lines").insertAdjacentHTML("beforeend",row()); fillSelects(); calc();}
function calc(){
  const rs=[...document.querySelectorAll("#lines tr")]; let total=0;
  rs.forEach(r=>{const q=Number(r.querySelector('[data-k="qty"]').value||0); const c=Number(r.querySelector('[data-k="cost"]').value||0); const t=q*c; r.querySelector('[data-k="total"]').textContent=fmt(t); total+=t;});
  const disc=Number($("discount").value||0); const net=Math.max(0,total-disc);
  $("total").textContent=fmt(total); $("net").textContent=fmt(net);
}
function lines(){
  return [...document.querySelectorAll("#lines tr")].map(r=>({itemId:r.querySelector('[data-k="item"]').value,qty:Number(r.querySelector('[data-k="qty"]').value||0),unitCost:Number(r.querySelector('[data-k="cost"]').value||0)})).filter(x=>x.itemId&&x.qty>0&&x.unitCost>0);
}
async function loadData(){
  suppliers=await listDocs("suppliers").catch(()=>[]);
  items=await listDocs("items").catch(()=>[]);
  $("supplier").innerHTML=suppliers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  fillSelects(); calc();
}
async function save(){
  const supplierId=$("supplier").value; const date=$("date").value||todayISO(); const day=dayNameFromISO(date); const discount=Number($("discount").value||0);
  const ls=lines(); if(!supplierId) return show("اختر مورد"); if(!ls.length) return show("أضف بنود مع التكلفة");
  const enriched=ls.map(l=>{const it=items.find(x=>x.id===l.itemId); return {...l,name:it?it.name:"",sku:it?it.sku:"",lineTotal:l.qty*l.unitCost};});
  const total=enriched.reduce((a,x)=>a+x.lineTotal,0); const net=Math.max(0,total-discount);
  await upsert("invoices",null,{type:"purchase_return",date,day,supplierId,discount,total,net,lines:enriched});
  // مرتجع مشتريات: خروج من المخزون (OUT)
  for(const l of enriched){
    await upsert("inventoryMoves",null,{date,day,type:"out",reason:"purchase_return",itemId:l.itemId,qty:l.qty,unitCost:l.unitCost,ref:""});
  }
  show("تم حفظ مرتجع المشتريات ✅",true);
}
document.addEventListener("input",(e)=>{if(e.target.closest("#lines")||e.target.id==="discount") calc();});
document.addEventListener("click",(e)=>{const rm=e.target.closest('button[data-act="rm"]'); if(rm){rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) addLine(); calc();}});
$("addLineBtn").onclick=addLine; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
addLine(); loadData();
