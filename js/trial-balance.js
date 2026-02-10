import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const rows=document.getElementById("rows");
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  const map=new Map();
  acc.forEach(a=>map.set(a.id,{code:a.code||"",name:a.name||"",debit:0,credit:0}));
  vou.forEach(v=>{
    if(v.type==="receipt"){
      if(map.has(v.cashAccountId)) map.get(v.cashAccountId).debit += Number(v.amount||0);
      (v.lines||[]).forEach(l=>{ if(map.has(l.accountId)) map.get(l.accountId).credit += Number(l.credit||0); });
    }
    if(v.type==="journal"){
      if(v.direction==="receipt"){
        if(map.has(v.cashAccountId)) map.get(v.cashAccountId).debit += Number(v.amount||0);
        if(map.has(v.accountId)) map.get(v.accountId).credit += Number(v.amount||0);
      }else{
        if(map.has(v.cashAccountId)) map.get(v.cashAccountId).credit += Number(v.amount||0);
        if(map.has(v.accountId)) map.get(v.accountId).debit += Number(v.amount||0);
      }
    }
  });
  rows.innerHTML=[...map.values()].map(r=>{const bal=r.debit-r.credit;return `<tr><td>${r.code}</td><td>${r.name}</td><td>${fmt(r.debit)}</td><td>${fmt(r.credit)}</td><td>${fmt(Math.abs(bal))}</td><td><span class="chip">${bal>=0?"مدين":"دائن"}</span></td></tr>`;}).join("") || `<tr><td colspan="6" class="notice">لا توجد بيانات</td></tr>`;
})();
