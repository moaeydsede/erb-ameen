
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let data=[];
function render(){
  const q=($("q").value||"").trim();
  const rows=data.filter(r=>!q || r.name.includes(q)).sort((a,b)=>b.rem-a.rem);
  $("rows").innerHTML = rows.map(r=>`<tr><td><b>${r.name}</b></td><td>${fmt(r.net)}</td><td>${fmt(r.paid)}</td><td><b>${fmt(r.rem)}</b></td></tr>`).join("") || `<tr><td colspan="4" class="notice">لا بيانات</td></tr>`;
}
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const inv=await listDocs("invoices").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  const cust=acc.filter(a=>a.type==="supplier");
  const m=new Map(cust.map(c=>[c.id,{name:`${c.code||""} - ${c.name||""}`,net:0,paid:0,rem:0}]));
  inv.forEach(i=>{
    if(i.type==="purchases" && m.has(i.supplierId)) m.get(i.supplierId).net+=Number(i.net||0);
    if(i.type==="purchase-return" || i.type==="purchase_return"){ if(m.has(i.supplierId)) m.get(i.supplierId).net-=Number(i.net||0); }
  });
  vou.forEach(v=>{
    if(v.type==="payment"){
      (v.lines||[]).forEach(l=>{ if(m.has(l.accountId)) m.get(l.accountId).paid+=Number(l.debit||0); });
    }
  });
  data=[...m.values()].map(r=>({...r,rem:Math.max(0,r.net-r.paid)}));
  render();
})();
$("q").addEventListener("input",render);
$("printBtn").onclick=()=>window.print();
