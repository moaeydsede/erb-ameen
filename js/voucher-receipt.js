import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr><td><select class="input" data-k="acc"></select></td><td><input class="input" data-k="credit" type="number" step="0.01" value="0"></td><td><input class="input" data-k="note" placeholder="البيان"></td><td><button class="btn sm danger" data-act="rm">حذف</button></td></tr>`;}
async function fill(){
  accounts=await listDocs("accounts").catch(()=>[]);
  const opt=accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join("");
  document.querySelectorAll('#lines select[data-k="acc"]').forEach(s=>s.innerHTML=opt);
  $("cashAccount").innerHTML=opt;
}
function add(){document.querySelector("#lines").insertAdjacentHTML("beforeend",row()); fill(); calc();}
function lines(){return [...document.querySelectorAll("#lines tr")].map(r=>({accountId:r.querySelector('[data-k="acc"]').value,credit:Number(r.querySelector('[data-k="credit"]').value||0),note:r.querySelector('[data-k="note"]').value.trim()})).filter(x=>x.credit>0);}
function calc(){$("sumCredit").textContent=fmt(lines().reduce((a,x)=>a+Number(x.credit||0),0));}
async function save(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const cashId=$("cashAccount").value; const amount=Number($("amount").value||0); const ls=lines(); const sum=ls.reduce((a,x)=>a+Number(x.credit||0),0);
  if(!cashId||amount<=0) return show("اختر الحساب النقدي واكتب المبلغ");
  if(!ls.length) return show("أضف سطور الدائن");
  if(Math.abs(sum-amount)>0.01) return show("مجموع الدائن يجب أن يساوي المبلغ");
  const id=await upsert("vouchers",null,{type:"receipt",date,day,cashAccountId:cashId,amount,lines:ls});
  show("تم حفظ سند القبض ✅ رقم: "+id,true);
}
document.addEventListener("input",(e)=>{if(e.target.closest("#lines")||e.target.id==="amount") calc();});
document.addEventListener("click",(e)=>{const rm=e.target.closest('button[data-act="rm"]'); if(rm){rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); calc();}});
$("addLineBtn").onclick=add; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
add(); fill();
