
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
function stLabel(st){
  const map={pending:"متبقي",endorsed:"مُظهر",deposited:"مودع",cleared:"محصل/مسدد",bounced:"مرتجع",cancelled:"ملغي"};
  return map[st]||st||"—";
}
function parseISO(d){ return d? new Date(d+"T00:00:00"): null; }

async function load(){
  const ch=await listDocs("cheques").catch(()=>[]);
  const pending=ch.filter(c=>(c.status||"pending")==="pending");
  const endorsed=ch.filter(c=>(c.status||"pending")==="endorsed");
  const now=new Date(); now.setHours(0,0,0,0);
  const till=new Date(now); till.setDate(till.getDate()+7);
  const dueSoon=ch.filter(c=>{
    const st=(c.status||"pending");
    if(st==="cleared"||st==="cancelled") return false;
    const dd=parseISO(c.dueDate); if(!dd) return false;
    return dd>=now && dd<=till;
  });

  $("totalCount").textContent="عدد المتبقي: "+pending.length;
  $("totalValue").textContent="القيمة المتبقية: "+fmt(pending.reduce((a,c)=>a+Number(c.amount||0),0));
  const extra = document.getElementById("extra");
  if(extra) extra.innerHTML = `
    <div class="row">
      <div class="card"><div class="card-body"><div class="section-title">مُظهّر</div><div class="h2">${endorsed.length}</div><div class="muted">${fmt(endorsed.reduce((a,c)=>a+Number(c.amount||0),0))}</div></div></div>
      <div class="card"><div class="card-body"><div class="section-title">مستحق خلال 7 أيام</div><div class="h2">${dueSoon.length}</div><div class="muted">${fmt(dueSoon.reduce((a,c)=>a+Number(c.amount||0),0))}</div></div></div>
    </div>`;

  const rows = ch.filter(c=>(c.status||"pending")!=="cleared" && (c.status||"pending")!=="cancelled")
    .sort((a,b)=>String(a.dueDate||"").localeCompare(String(b.dueDate||"")));
  $("rows").innerHTML = rows.map(c=>`
    <tr>
      <td><b>${c.number||""}</b><div class="muted">${c.bank||""}</div></td>
      <td>${c.type||""}</td>
      <td>${c.party||""}${c.endorsedToName? `<div class="muted">إلى: ${c.endorsedToName}</div>`:""}</td>
      <td>${c.dueDate||""}</td>
      <td><b>${fmt(c.amount||0)}</b></td>
      <td><span class="chip">${stLabel(c.status||"pending")}</span></td>
      <td>
        <button class="btn sm" data-act="endorse" data-id="${c.id}">تظهير</button>
        <button class="btn sm" data-act="clear" data-id="${c.id}">تحصيل/سداد</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="7" class="notice">لا يوجد شيكات</td></tr>`;

  document.querySelectorAll("button[data-act]").forEach(b=>{
    b.onclick=async()=>{
      const id=b.dataset.id;
      const act=b.dataset.act;
      if(act==="endorse"){
        const to = prompt("تظهير إلى (اسم الجهة):") || "";
        if(!to) return;
        await upsert("cheques", id, {status:"endorsed", endorsedToName:to, endorsedAt: todayISO()});
      }
      if(act==="clear"){
        await upsert("cheques", id, {status:"cleared", clearedAt: todayISO()});
      }
      load();
    };
  });
}
load();
