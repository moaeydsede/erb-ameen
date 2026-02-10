import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"cfo")) location.href="dashboard.html";

const $=id=>document.getElementById(id);

function sum(arr, fn){ return arr.reduce((a,x)=>a+Number(fn(x)||0),0); }
function monthKey(d){ return (d||"").slice(0,7); } // YYYY-MM

function bar(container, label, value, max){
  const pct = max>0 ? Math.round((value/max)*100) : 0;
  return `<div class="kpi-row"><div class="kpi-l">${label}</div><div class="kpi-bar"><div class="kpi-fill" style="width:${pct}%"></div></div><div class="kpi-v">${fmt(value)}</div></div>`;
}

(async()=>{
  const invoices=await listDocs("invoices").catch(()=>[]);
  const vouchers=await listDocs("vouchers").catch(()=>[]);
  // Sales and returns
  const sales = invoices.filter(i=>i.type==="sales");
  const salesR = invoices.filter(i=>i.type==="sales_return");
  const purch = invoices.filter(i=>i.type==="purchases");
  const purchR = invoices.filter(i=>i.type==="purchase_return");

  const salesNet = sum(sales, i=>i.net);
  const salesRet = sum(salesR, i=>i.net);
  const rev = Math.max(0, salesNet - salesRet);

  const purchNet = sum(purch, i=>i.net);
  const purchRet = sum(purchR, i=>i.net);
  const buys = Math.max(0, purchNet - purchRet);

  const cogsSales = sum(sales, i=>i.cogs||0);
  const cogsRet = sum(salesR, i=>i.cogs||0);
  const cogs = Math.max(0, cogsSales - cogsRet);

  const gross = rev - cogs;

  // Cash in/out from vouchers
  const cashIn = sum(vouchers.filter(v=>v.type==="receipt"), v=>v.amount);
  const cashOut = sum(vouchers.filter(v=>v.type==="payment"), v=>v.amount);

  $("k_rev").textContent = fmt(rev);
  $("k_cogs").textContent = fmt(cogs);
  $("k_gross").textContent = fmt(gross);
  $("k_cash_in").textContent = fmt(cashIn);
  $("k_cash_out").textContent = fmt(cashOut);
  $("k_cash_net").textContent = fmt(cashIn - cashOut);

  // Monthly chart (last 6 months)
  const byM = new Map();
  function addM(key, field, val){
    if(!byM.has(key)) byM.set(key,{rev:0,buys:0,gross:0});
    byM.get(key)[field]+=val;
  }
  sales.forEach(i=> addM(monthKey(i.date), "rev", Number(i.net||0)));
  salesR.forEach(i=> addM(monthKey(i.date), "rev", -Number(i.net||0)));
  purch.forEach(i=> addM(monthKey(i.date), "buys", Number(i.net||0)));
  purchR.forEach(i=> addM(monthKey(i.date), "buys", -Number(i.net||0)));
  // gross approx: rev - cogs per month
  sales.forEach(i=> addM(monthKey(i.date), "gross", Number(i.net||0) - Number(i.cogs||0)));
  salesR.forEach(i=> addM(monthKey(i.date), "gross", -(Number(i.net||0) - Number(i.cogs||0))));

  const keys=[...byM.keys()].filter(k=>k).sort().slice(-6);
  const rows=keys.map(k=>({k,...byM.get(k)}));
  const max=Math.max(1,...rows.map(r=>Math.max(r.rev,r.buys,Math.abs(r.gross))));
  $("chart").innerHTML = rows.map(r=>{
    return `<div class="chart-card">
      <div class="chart-title">${r.k}</div>
      ${bar("","الإيراد",Math.max(0,r.rev),max)}
      ${bar("","المشتريات",Math.max(0,r.buys),max)}
      ${bar("","مجمل الربح",r.gross,max)}
    </div>`;
  }).join("") || `<div class="notice">لا توجد بيانات كافية للعرض.</div>`;
})();
