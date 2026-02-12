
import { requireSession } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(s.role!=="admin") location.href="dashboard.html";
const $=id=>document.getElementById(id);
const stars=n=>"★★★★★☆☆☆☆☆".slice(5-n,10-n);
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const customers=acc.filter(a=>a.type==="customer");
  const inv=await listDocs("invoices").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  const m=new Map(customers.map(c=>[c.id,{name:`${c.code||""} - ${c.name||""}`,sales:0,ret:0,paid:0,disc:0}]));
  inv.forEach(i=>{
    if(i.type==="sales" && m.has(i.customerId)){ const c=m.get(i.customerId); c.sales+=Number(i.net||0); c.disc+=Number(i.discount||0); }
    if(((i.type==="sales-return" || i.type==="sales_return") || i.type==="sales_return") && m.has(i.customerId)){ m.get(i.customerId).ret+=Number(i.net||0); }
  });
  vou.forEach(v=>{ if(v.type==="receipt"){ (v.lines||[]).forEach(l=>{ if(m.has(l.accountId)) m.get(l.accountId).paid+=Number(l.credit||0); }); } });
  const rows=[...m.values()].map(c=>{
    const net=Math.max(0,c.sales-c.ret);
    const payRate = net>0 ? Math.min(1,c.paid/net) : 1;
    const discRate = net>0 ? Math.min(1,c.disc/net) : 0;
    const points = Math.round(payRate*70 + (1-discRate)*20 + (net>0?10:0));
    const rating = points>=90?5:points>=80?4:points>=65?3:points>=50?2:1;
    return {...c,points,rating};
  }).sort((a,b)=>b.points-a.points);
  $("rows").innerHTML=rows.map(r=>`<tr><td><b>${r.name}</b></td><td>${fmt(r.sales)}</td><td>${fmt(r.ret)}</td><td>${fmt(r.paid)}</td><td>${fmt(r.disc)}</td><td><b>${r.points}</b></td><td><span class="chip">${stars(r.rating)}</span></td></tr>`).join("")||`<tr><td colspan="7" class="notice">لا بيانات</td></tr>`;
})();
