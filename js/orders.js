
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], accounts=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(i){return `<tr>
  <td>${i}</td>
  <td><select class="input" data-k="item"></select></td>
  <td><span class="chip" data-k="uom">—</span></td>
  <td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td>
  <td><input class="input" data-k="note" placeholder="ملاحظة"></td>
  <td><button class="btn sm danger" data-act="rm">حذف</button></td>
</tr>`;}
function fill(){
  const opt=items.filter(i=>i.kind==="item").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  document.querySelectorAll('select[data-k="item"]').forEach(s=>s.innerHTML=opt);
  const partyType = $("type").value==="order-sales" ? "customer" : "supplier";
  $("party").innerHTML = accounts.filter(a=>a.type===partyType).sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(a=>`<option value="${a.id}">${a.code} - ${a.name}</option>`).join("");
}
function setUom(tr){ const id=tr.querySelector('[data-k="item"]').value; const it=items.find(x=>x.id===id); tr.querySelector('[data-k="uom"]').textContent=it?.uom||"—"; }
function add(){ const i=document.querySelectorAll("#lines tr").length+1; document.querySelector("#lines").insertAdjacentHTML("beforeend", row(i)); fill(); setUom(document.querySelector("#lines tr:last-child")); }
function lines(){ return [...document.querySelectorAll("#lines tr")].map(tr=>({itemId:tr.querySelector('[data-k="item"]').value, qty:Number(tr.querySelector('[data-k="qty"]').value||0), note:(tr.querySelector('[data-k="note"]').value||"").trim()})).filter(x=>x.itemId && x.qty>0); }
async function save(){
  const type=$("type").value;
  const date=$("date").value||todayISO();
  const day=dayNameFromISO(date);
  const partyId=$("party").value;
  const ls=lines();
  if(!partyId) return show("اختر الطرف",false);
  if(!ls.length) return show("أضف بنود",false);
  await upsert("orders",null,{type,date,day,partyId,lines:ls,status:"open"});
  show("تم الحفظ ✅",true);
  document.querySelector("#lines").innerHTML=""; add();
}
document.addEventListener("click",(e)=>{ const rm=e.target.closest('button[data-act="rm"]'); if(rm){ rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); } });
document.addEventListener("change",(e)=>{ if(e.target.matches('select[data-k="item"]')) setUom(e.target.closest("tr")); });
$("addBtn").onclick=add; $("saveBtn").onclick=save;
$("type").addEventListener("change",fill);
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value);
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
(async()=>{ items=await listDocs("items").catch(()=>[]); accounts=await listDocs("accounts").catch(()=>[]); add(); fill(); })();
