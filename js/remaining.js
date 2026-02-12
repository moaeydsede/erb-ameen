
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const inv=await listDocs("invoices").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  const cust=acc.filter(a=>a.type==="customer");
  const sup=acc.filter(a=>a.type==="supplier");
  const cm=new Map(cust.map(c=>[c.id,{name:`${c.code||""} - ${c.name||""}`,net:0,paid:0}]));
  const sm=new Map(sup.map(c=>[c.id,{name:`${c.code||""} - ${c.name||""}`,net:0,paid:0}]));
  inv.forEach(i=>{
    if(i.type==="sales" && cm.has(i.customerId)) cm.get(i.customerId).net+=Number(i.net||0);
    if(((i.type==="sales-return" || i.type==="sales_return") || i.type==="sales_return") && cm.has(i.customerId)) cm.get(i.customerId).net-=Number(i.net||0);
    if(i.type==="purchases" && sm.has(i.supplierId)) sm.get(i.supplierId).net+=Number(i.net||0);
    if(((i.type==="purchase-return" || i.type==="purchase_return") || i.type==="purchase_return") && sm.has(i.supplierId)) sm.get(i.supplierId).net-=Number(i.net||0);
  });
  vou.forEach(v=>{
    if(v.type==="receipt"){ (v.lines||[]).forEach(l=>{ if(cm.has(l.accountId)) cm.get(l.accountId).paid+=Number(l.credit||0); }); }
    if(v.type==="payment"){ (v.lines||[]).forEach(l=>{ if(sm.has(l.accountId)) sm.get(l.accountId).paid+=Number(l.debit||0); }); }
  });
  $("cust").innerHTML=[...cm.values()].map(r=>`<tr><td><b>${r.name}</b></td><td>${fmt(r.net)}</td><td>${fmt(r.paid)}</td><td><b>${fmt(Math.max(0,r.net-r.paid))}</b></td></tr>`).join("")||`<tr><td colspan="4" class="notice">لا بيانات</td></tr>`;
  $("sup").innerHTML=[...sm.values()].map(r=>`<tr><td><b>${r.name}</b></td><td>${fmt(r.net)}</td><td>${fmt(r.paid)}</td><td><b>${fmt(Math.max(0,r.net-r.paid))}</b></td></tr>`).join("")||`<tr><td colspan="4" class="notice">لا بيانات</td></tr>`;
})();
