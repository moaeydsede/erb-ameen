
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO, fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[];
function row(){return `<tr>
  <td><select class="input" data-k="acc"></select></td>
  <td><input class="input" data-k="d" type="number" step="0.01" value="0"></td>
  <td><input class="input" data-k="c" type="number" step="0.01" value="0"></td>
  <td><input class="input" data-k="note"></td>
  <td><button class="btn sm danger" data-act="rm">حذف</button></td>
</tr>`;}
function fill(){ const opt=accounts.sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(a=>`<option value="${a.id}">${a.code} - ${a.name}</option>`).join(""); document.querySelectorAll('select[data-k="acc"]').forEach(s=>s.innerHTML=opt); }
function add(){ document.querySelector("#lines").insertAdjacentHTML("beforeend", row()); fill(); calc(); }
function lines(){ return [...document.querySelectorAll("#lines tr")].map(tr=>({accountId:tr.querySelector('[data-k="acc"]').value, debit:Number(tr.querySelector('[data-k="d"]').value||0), credit:Number(tr.querySelector('[data-k="c"]').value||0), note:(tr.querySelector('[data-k="note"]').value||"").trim()})).filter(x=>x.accountId && (x.debit>0 || x.credit>0)); }
function calc(){ const ls=lines(); const d=ls.reduce((a,x)=>a+Number(x.debit||0),0); const c=ls.reduce((a,x)=>a+Number(x.credit||0),0); $("sumD").textContent=fmt(d); $("sumC").textContent=fmt(c); }
async function save(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const desc=($("desc").value||"").trim();
  const ls=lines(); if(!ls.length) return alert("أضف بنود");
  const d=ls.reduce((a,x)=>a+Number(x.debit||0),0); const c=ls.reduce((a,x)=>a+Number(x.credit||0),0);
  if(Math.abs(d-c)>0.0001) return alert("السند غير متزن");
  await upsert("vouchers",null,{type:"general",date,day,desc,lines:ls,total:d});
  document.querySelector("#lines").innerHTML=""; add(); alert("تم الحفظ ✅");
}
document.addEventListener("input",(e)=>{ if(e.target.closest("#lines")) calc(); });
document.addEventListener("click",(e)=>{ const rm=e.target.closest('button[data-act="rm"]'); if(rm){ rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); calc(); } });
$("addBtn").onclick=add; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value);
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
(async()=>{ accounts=await listDocs("accounts").catch(()=>[]); add(); })();
