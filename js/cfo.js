import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"cfo")) location.href="dashboard.html";
const kpi=document.getElementById("kpi");
(async()=>{
  const invoices=await listDocs("invoices").catch(()=>[]);
  const vouchers=await listDocs("vouchers").catch(()=>[]);
  const sales=invoices.filter(x=>x.type==="sales");
  const salesNet=sales.reduce((a,x)=>a+Number(x.net||0),0);
  const discounts=sales.reduce((a,x)=>a+Number(x.discount||0),0);
  const cogs=sales.reduce((a,x)=>a+Number(x.cogs||0),0);
  const gp=salesNet-cogs;
  const cashIn=vouchers.filter(x=>x.type==="receipt").reduce((a,x)=>a+Number(x.amount||0),0);
  kpi.innerHTML=`<div class="box"><div class="t">صافي المبيعات</div><div class="v">${fmt(salesNet)}</div></div>
  <div class="box"><div class="t">COGS</div><div class="v">${fmt(cogs)}</div></div>
  <div class="box"><div class="t">مجمل الربح</div><div class="v">${fmt(gp)}</div></div>
  <div class="box"><div class="t">مقبوضات</div><div class="v">${fmt(cashIn)}</div></div>
  <div class="box"><div class="t">إجمالي الخصومات</div><div class="v">${fmt(discounts)}</div></div>
  <div class="box"><div class="t">عدد فواتير المبيعات</div><div class="v">${sales.length}</div></div>`;
})();
