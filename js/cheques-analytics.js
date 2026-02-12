
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);

function stLabel(st){
  const map={pending:"متبقي",endorsed:"مُظهر",deposited:"مودع",cleared:"محصل/مسدد",bounced:"مرتجع",cancelled:"ملغي"};
  return map[st]||st||"—";
}
function parseISO(d){ return d? new Date(d+"T00:00:00"): null; }
function tableMap(map){
  const rows=[...map.entries()].sort((a,b)=>b[1]-a[1]);
  return `<table class="table"><thead><tr><th>البند</th><th>القيمة</th></tr></thead><tbody>`+
    rows.map(([k,v])=>`<tr><td><b>${k}</b></td><td>${fmt(v)}</td></tr>`).join("")+
    `</tbody></table>`;
}
let all=[], pending=[];
function render(){
  const q=($("q").value||"").trim();
  const rows=pending.filter(c=>{
    return !q || String(c.number||"").includes(q) || String(c.party||"").includes(q) || String(c.bank||"").includes(q) || String(c.endorsedToName||"").includes(q);
  }).sort((a,b)=>String(a.dueDate||"").localeCompare(String(b.dueDate||"")));
  $("rows").innerHTML = rows.map(c=>`<tr>
    <td><b>${c.number||""}</b></td>
    <td>${c.type||""}</td>
    <td>${c.party||""}${c.endorsedToName? `<div class="muted">إلى: ${c.endorsedToName}</div>`:""}</td>
    <td>${c.bank||""}</td>
    <td>${c.dueDate||""}</td>
    <td><b>${fmt(c.amount||0)}</b></td>
    <td><span class="chip">${stLabel(c.status||"pending")}</span></td>
  </tr>`).join("") || `<tr><td colspan="7" class="notice">لا يوجد شيكات متبقية</td></tr>`;
}

(async()=>{
  all = await listDocs("cheques").catch(()=>[]);
  pending = all.filter(c=> (c.status||"pending")!=="cleared" && (c.status||"pending")!=="cancelled");
  const now=new Date(); now.setHours(0,0,0,0);
  const till=new Date(now); till.setDate(till.getDate()+7);
  const dueSoon = pending.filter(c=>{ const dd=parseISO(c.dueDate); return dd && dd>=now && dd<=till; });
  const sumAll = all.reduce((a,c)=>a+Number(c.amount||0),0);
  const sumPend = pending.reduce((a,c)=>a+Number(c.amount||0),0);

  $("kpis").innerHTML = `
    <div class="row">
      <div class="card"><div class="card-body"><div class="section-title">إجمالي الشيكات</div><div class="h2">${all.length}</div><div class="muted">${fmt(sumAll)}</div></div></div>
      <div class="card"><div class="card-body"><div class="section-title">المتبقي</div><div class="h2">${pending.length}</div><div class="muted">${fmt(sumPend)}</div></div></div>
      <div class="card"><div class="card-body"><div class="section-title">مستحق خلال 7 أيام</div><div class="h2">${dueSoon.length}</div><div class="muted">${fmt(dueSoon.reduce((a,c)=>a+Number(c.amount||0),0))}</div></div></div>
    </div>`;

  const byFrom=new Map();
  const byTo=new Map();
  pending.forEach(c=>{
    const from=c.party||"غير محدد";
    byFrom.set(from,(byFrom.get(from)||0)+Number(c.amount||0));
    if(c.endorsedToName){
      const to=c.endorsedToName;
      byTo.set(to,(byTo.get(to)||0)+Number(c.amount||0));
    }
  });
  $("from").innerHTML = tableMap(byFrom);
  $("to").innerHTML = byTo.size? tableMap(byTo) : `<div class="notice">لا يوجد تظهير بعد</div>`;
  render();
})();
$("q").addEventListener("input",render);
$("printBtn").onclick=()=>window.print();
