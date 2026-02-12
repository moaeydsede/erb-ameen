
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let orders=[], items=[];
function sum(type){
  const m=new Map();
  orders.filter(o=>o.type===type).forEach(o=>(o.lines||[]).forEach(l=>m.set(l.itemId,(m.get(l.itemId)||0)+Number(l.qty||0))));
  return m;
}
function build(){
  const sales=sum("order-sales"), pur=sum("order-purchase");
  const all=new Set([...sales.keys(),...pur.keys()]);
  const rows=[...all].map(id=>{
    const it=items.find(x=>x.id===id);
    const s=sales.get(id)||0, p=pur.get(id)||0, d=s-p;
    return {name:it?`${it.code} - ${it.name}`:id, uom:it?.uom||"", s,p,d};
  }).sort((a,b)=>b.d-a.d);
  const table=(arr)=>`<table class="table"><thead><tr><th>المادة</th><th>الوحدة</th><th>طلب بيع</th><th>طلب شراء</th><th>الفرق</th></tr></thead><tbody>${arr.map(r=>`<tr ${r.d>0?'style="background:#ffe9e9"':''}><td><b>${r.name}</b></td><td>${r.uom||"—"}</td><td>${fmt(r.s)}</td><td>${fmt(r.p)}</td><td><b>${fmt(r.d)}</b></td></tr>`).join("")}</tbody></table>`;
  window.__all=table(rows);
  const warn=rows.filter(r=>r.d>0);
  window.__warn=table(warn)+(warn.length?'<div class="notice err" style="margin-top:10px">تحذير: يوجد تجاوز ✅</div>':'<div class="notice ok" style="margin-top:10px">لا يوجد تجاوز ✅</div>');
}
(async()=>{ orders=await listDocs("orders").catch(()=>[]); items=await listDocs("items").catch(()=>[]); build(); $("out").innerHTML=window.__all; })();
$("allBtn").onclick=()=>{$("out").innerHTML=window.__all;};
$("warnBtn").onclick=()=>{$("out").innerHTML=window.__warn;};
