
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let orders=[], deliveries=[], items=[], customers=[];
let cache=[];
function fillCustomers(){
  $("customer").innerHTML = [{id:"",name:"كل العملاء"}].concat(customers).map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}
function build(){
  const need=new Map(); // cid||item -> qty
  for(const o of orders.filter(o=>o.type==="order-sales")){
    const cid=o.partyId||"";
    for(const l of (o.lines||[])){
      const k=cid+"||"+l.itemId;
      need.set(k,(need.get(k)||0)+Number(l.qty||0));
    }
  }
  const done=new Map(); // cid||item -> qty delivered
  for(const d of deliveries){
    const cid=d.customerId||"";
    for(const l of (d.lines||[])){
      const k=cid+"||"+l.itemId;
      done.set(k,(done.get(k)||0)+Number(l.qty||0));
    }
  }
  cache=[...need.entries()].map(([k,nq])=>{
    const dq=done.get(k)||0;
    const [cid,itemId]=k.split("||");
    const it=items.find(x=>x.id===itemId);
    return {cid,itemId,name:it?`${it.code} - ${it.name}`:itemId,uom:it?.uom||"",need:nq,done:dq,rem:Math.max(0,nq-dq)};
  }).filter(r=>r.need>0);
}
function render(){
  const cid=$("customer").value||"";
  const q=($("q").value||"").trim();
  const rows=cache.filter(r=>(!cid || r.cid===cid) && r.rem>0 && (!q || r.name.includes(q))).sort((a,b)=>b.rem-a.rem);
  $("rows").innerHTML = rows.map(r=>`<tr><td><b>${r.name}</b></td><td>${r.uom||"—"}</td><td>${fmt(r.need)}</td><td>${fmt(r.done)}</td><td><b>${fmt(r.rem)}</b></td></tr>`).join("") || `<tr><td colspan="5" class="notice">لا يوجد متبقي</td></tr>`;
}
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  customers=acc.filter(a=>a.type==="customer").map(a=>({id:a.id,name:`${a.code||""} - ${a.name||""}`})).sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  orders=await listDocs("orders").catch(()=>[]);
  deliveries=await listDocs("deliveries").catch(()=>[]);
  items=await listDocs("items").catch(()=>[]);
  fillCustomers(); build(); render();
})();
$("customer").addEventListener("change",render);
$("q").addEventListener("input",render);
$("printBtn").onclick=()=>window.print();
