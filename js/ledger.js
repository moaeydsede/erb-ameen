import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const out=document.getElementById("out");
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  const lines=[];
  vou.forEach(v=>{
    if(v.type==="receipt"){
      lines.push({date:v.date,desc:"سند قبض",accountId:v.cashAccountId,debit:Number(v.amount||0),credit:0});
      (v.lines||[]).forEach(l=>lines.push({date:v.date,desc:"سند قبض",accountId:l.accountId,debit:0,credit:Number(l.credit||0)}));
    }else if(v.type==="payment"){
      lines.push({date:v.date,desc:"سند دفع",accountId:v.cashAccountId,debit:0,credit:Number(v.amount||0)});
      (v.lines||[]).forEach(l=>lines.push({date:v.date,desc:"سند دفع",accountId:l.accountId,debit:Number(l.debit||0),credit:0}));
    }else if(v.type==="journal2"){
      // cash side
      if(Number(v.sumRec||0)>0) lines.push({date:v.date,desc:"سند يومية (مقبوضات)",accountId:v.cashAccountId,debit:Number(v.sumRec||0),credit:0});
      if(Number(v.sumPaid||0)>0) lines.push({date:v.date,desc:"سند يومية (مدفوعات)",accountId:v.cashAccountId,debit:0,credit:Number(v.sumPaid||0)});
      (v.lines||[]).forEach(l=>lines.push({date:v.date,desc:"سند يومية",accountId:l.accountId,debit:Number(l.debit||0),credit:Number(l.credit||0)}));
    }else if(v.type==="journal"){
      if(v.direction==="receipt"){
        lines.push({date:v.date,desc:"سند يومية",accountId:v.cashAccountId,debit:Number(v.amount||0),credit:0});
        lines.push({date:v.date,desc:"سند يومية",accountId:v.accountId,debit:0,credit:Number(v.amount||0)});
      }else{
        lines.push({date:v.date,desc:"سند يومية",accountId:v.cashAccountId,debit:0,credit:Number(v.amount||0)});
        lines.push({date:v.date,desc:"سند يومية",accountId:v.accountId,debit:Number(v.amount||0),credit:0});
      }
    }
  });
  const by=new Map();
  lines.forEach(l=>{ if(!by.has(l.accountId)) by.set(l.accountId,[]); by.get(l.accountId).push(l);});
  let html="";
  acc.forEach(a=>{
    const ls=(by.get(a.id)||[]).sort((x,y)=>(x.date||"").localeCompare(y.date||""));
    if(!ls.length) return;
    const td=ls.reduce((s,x)=>s+Number(x.debit||0),0), tc=ls.reduce((s,x)=>s+Number(x.credit||0),0);
    const bal=td-tc;
    html += `<div class="card" style="margin-bottom:14px"><div class="card-header"><h2 class="card-title">${(a.code||"")+" - "+(a.name||"")}</h2><span class="chip">الرصيد: <b>${fmt(Math.abs(bal))}</b> ${bal>=0?"مدين":"دائن"}</span></div><div class="card-body">`;
    html += `<table class="table"><thead><tr><th>تاريخ</th><th>بيان</th><th>مدين</th><th>دائن</th></tr></thead><tbody>`;
    html += ls.map(l=>`<tr><td>${l.date||""}</td><td>${l.desc||""}</td><td>${fmt(l.debit)}</td><td>${fmt(l.credit)}</td></tr>`).join("");
    html += `</tbody></table><div class="row"><div class="chip">إجمالي مدين: <b>${fmt(td)}</b></div><div class="chip">إجمالي دائن: <b>${fmt(tc)}</b></div></div></div></div>`;
  });
  out.innerHTML = html || `<div class="notice">لا توجد قيود حتى الآن.</div>`;
})();
