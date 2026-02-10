import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let customers=[], items=[], moves=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
const avgCost=id=>{const ins=moves.filter(m=>m.itemId===id&&m.type==="in");const q=ins.reduce((a,x)=>a+Number(x.qty||0),0);const v=ins.reduce((a,x)=>a+Number(x.qty||0)*Number(x.unitCost||0),0);return q>0?v/q:0;}
function row(){return `<tr><td><select class="input" data-k="item"></select><div class="chip" style="margin-top:6px">متوسط تكلفة: <b data-k="avg">0.00</b></div></td><td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td><td><input class="input" data-k="price" type="number" step="0.01" value="0"></td><td class="chip" data-k="total">0.00</td><td><button class="btn sm danger" data-act="rm">حذف</button></td></tr>`;}
function fillSelects(){const opt=items.map(i=>`<option value="${i.id}">${(i.sku||"")+" - "+(i.name||"")}</option>`).join(""); document.querySelectorAll('#lines select[data-k="item"]').forEach(s=>s.innerHTML=opt);}
function addLine(){document.querySelector("#lines").insertAdjacentHTML("beforeend",row()); fillSelects(); calc();}
function calc(){
  const rs=[...document.querySelectorAll("#lines tr")]; let total=0,cogs=0;
  rs.forEach(r=>{const id=r.querySelector('[data-k="item"]').value; const q=Number(r.querySelector('[data-k="qty"]').value||0); const p=Number(r.querySelector('[data-k="price"]').value||0); const t=q*p; const ac=avgCost(id);
    r.querySelector('[data-k="avg"]').textContent=fmt(ac); r.querySelector('[data-k="total"]').textContent=fmt(t);
    total+=t; cogs+=q*ac;
  });
  const disc=Number($("discount").value||0); const net=Math.max(0,total-disc);
  $("total").textContent=fmt(total); $("net").textContent=fmt(net); $("cogs").textContent=fmt(cogs); $("gp").textContent=fmt(net-cogs);
}
function lines(){
  return [...document.querySelectorAll("#lines tr")].map(r=>({itemId:r.querySelector('[data-k="item"]').value,qty:Number(r.querySelector('[data-k="qty"]').value||0),price:Number(r.querySelector('[data-k="price"]').value||0)})).filter(x=>x.itemId&&x.qty>0);
}
async function loadData(){
  customers=await listDocs("customers").catch(()=>[]);
  items=await listDocs("items").catch(()=>[]);
  moves=await listDocs("inventoryMoves").catch(()=>[]);
  $("customer").innerHTML=customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  fillSelects(); calc();
}
async function save(){
  const customerId=$("customer").value; const date=$("date").value||todayISO(); const day=dayNameFromISO(date); const discount=Number($("discount").value||0);
  const ls=lines(); if(!customerId) return show("اختر عميل"); if(!ls.length) return show("أضف بنود");
  const enriched=ls.map(l=>{const it=items.find(x=>x.id===l.itemId); const ac=avgCost(l.itemId); return {...l,name:it?it.name:"",sku:it?it.sku:"",avgCost:ac,lineTotal:l.qty*l.price,lineCogs:l.qty*ac};});
  const total=enriched.reduce((a,x)=>a+x.lineTotal,0); const net=Math.max(0,total-discount); const cogs=enriched.reduce((a,x)=>a+x.lineCogs,0);
  const id=await upsert("invoices",null,{type:"sales",date,day,customerId,discount,total,net,cogs,lines:enriched});
  show("تم حفظ فاتورة المبيعات ✅ رقم: "+id,true);
}
document.addEventListener("input",(e)=>{if(e.target.closest("#lines")||e.target.id==="discount") calc();});
document.addEventListener("change",(e)=>{if(e.target.closest("#lines")) calc();});
document.addEventListener("click",(e)=>{const rm=e.target.closest('button[data-act="rm"]'); if(rm){rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) addLine(); calc();}});
$("addLineBtn").onclick=addLine; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
addLine(); loadData();
