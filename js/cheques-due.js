
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
async function load(){
  const days=Number($("days").value||7);
  const q=($("q").value||"").trim();
  const now=new Date(); now.setHours(0,0,0,0);
  const till=new Date(now); till.setDate(till.getDate()+days);
  const ch=await listDocs("cheques").catch(()=>[]);
  const rows=ch.filter(c=>{
    const st=(c.status||"pending");
    if(st==="cleared"||st==="cancelled") return false;
    const dd=parseISO(c.dueDate);
    if(!dd) return false;
    return dd>=now && dd<=till;
  }).filter(c=>{
    return !q || String(c.number||"").includes(q) || String(c.bank||"").includes(q) || String(c.party||"").includes(q) || String(c.endorsedToName||"").includes(q);
  }).sort((a,b)=>String(a.dueDate||"").localeCompare(String(b.dueDate||"")));
  $("rows").innerHTML = rows.map(c=>`<tr>
    <td><b>${c.number||""}</b></td>
    <td>${c.type||""}</td>
    <td>${c.party||""}${c.endorsedToName? `<div class="muted">إلى: ${c.endorsedToName}</div>`:""}</td>
    <td>${c.dueDate||""}</td>
    <td><b>${fmt(c.amount||0)}</b></td>
    <td><span class="chip">${stLabel(c.status||"pending")}</span></td>
  </tr>`).join("") || `<tr><td colspan="6" class="notice">لا يوجد شيكات مستحقة ضمن المدة</td></tr>`;
}
$("reloadBtn").onclick=load;
$("printBtn").onclick=()=>window.print();
$("q").addEventListener("input",load);
load();
