
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
const TYPE="order-sales";
const PARTYTYPE="customer";
let orders=[], items=[], parties=[], cache=[];
function fillParties(){
  $("party").innerHTML = [{id:"",name:"كل الأطراف"}].concat(parties).map(p=>`<option value="${p.id}">${p.name}</option>`).join("");
}
function build(){
  const m=new Map();
  for(const o of orders.filter(o=>o.type===TYPE)){
    const pid=o.partyId||"";
    for(const l of (o.lines||[])){
      const k=pid+"||"+l.itemId;
      m.set(k,(m.get(k)||0)+Number(l.qty||0));
    }
  }
  cache=[...m.entries()].map(([k,qty])=>{
    const [pid,itemId]=k.split("||");
    const it=items.find(x=>x.id===itemId);
    const p=parties.find(x=>x.id===pid);
    return {pid,itemId,qty,name:it?`${it.code} - ${it.name}`:itemId,uom:it?.uom||"",party:p?.name||pid};
  });
}
function render(){
  const pid=$("party").value||"";
  const q=($("q").value||"").trim();
  const rows=cache.filter(r=>(!pid || r.pid===pid) && (!q || r.name.includes(q))).sort((a,b)=>b.qty-a.qty);
  $("rows").innerHTML = rows.map(r=>`<tr><td><b>${r.name}</b><div class="muted">${r.party}</div></td><td>${r.uom||"—"}</td><td><b>${fmt(r.qty)}</b></td></tr>`).join("") || `<tr><td colspan="3" class="notice">لا بيانات</td></tr>`;
}
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  parties=acc.filter(a=>a.type===PARTYTYPE).map(a=>({id:a.id,name:`${a.code||""} - ${a.name||""}`})).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  orders=await listDocs("orders").catch(()=>[]);
  items=await listDocs("items").catch(()=>[]);
  fillParties(); build(); render();
})();
$("party").addEventListener("change",render);
$("q").addEventListener("input",render);
$("printBtn").onclick=()=>window.print();
