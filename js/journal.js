
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr>
  <td><select class="input" data-k="acc"></select></td>
  <td><input class="input" data-k="paid" type="number" step="0.01" value="0"></td>
  <td><input class="input" data-k="rec" type="number" step="0.01" value="0"></td>
  <td><input class="input" data-k="note" placeholder="البيان"></td>
  <td><button class="btn sm danger" data-act="rm">حذف</button></td>
</tr>`;}
async function loadAcc(){
  accounts=await listDocs("accounts").catch(()=>[]);
  const opt=accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join("");
  document.querySelectorAll('#lines select[data-k="acc"]').forEach(s=>s.innerHTML=opt);
  $("cashAccount").innerHTML=opt;
}
function add(){ document.querySelector("#lines").insertAdjacentHTML("beforeend", row()); loadAcc(); calc(); }
function lines(){
  return [...document.querySelectorAll("#lines tr")].map(tr=>({
    accountId:tr.querySelector('[data-k="acc"]').value,
    paid:Number(tr.querySelector('[data-k="paid"]').value||0),
    received:Number(tr.querySelector('[data-k="rec"]').value||0),
    note:(tr.querySelector('[data-k="note"]').value||"").trim()
  })).filter(x=>x.paid>0 || x.received>0);
}
function calc(){
  const ls=lines();
  const sumPaid=ls.reduce((a,x)=>a+Number(x.paid||0),0);
  const sumRec=ls.reduce((a,x)=>a+Number(x.received||0),0);
  $("sumPaid").textContent=fmt(sumPaid);
  $("sumRec").textContent=fmt(sumRec);
}
async function save(){
  const date=$("date").value||todayISO();
  const day=dayNameFromISO(date);
  const cashId=$("cashAccount").value;
  const ls=lines();
  if(!cashId) return show("اختر الحساب النقدي",false);
  if(!ls.length) return show("أضف بنود",false);
  for(const l of ls){
    if(l.paid>0 && l.received>0) return show("لا يمكن أن يكون السطر مدفوع ومقبوض معاً",false);
  }
  const sumPaid=ls.reduce((a,x)=>a+Number(x.paid||0),0);
  const sumRec=ls.reduce((a,x)=>a+Number(x.received||0),0);
  if(sumPaid<=0 && sumRec<=0) return show("لا توجد قيم",false);

  // Map to accounting lines
  const accLines=[];
  ls.forEach(l=>{
    if(l.paid>0) accLines.push({accountId:l.accountId,debit:l.paid,credit:0,note:l.note,dir:"paid"});
    if(l.received>0) accLines.push({accountId:l.accountId,debit:0,credit:l.received,note:l.note,dir:"received"});
  });
  await upsert("vouchers",null,{type:"journal2",date,day,cashAccountId:cashId,sumPaid,sumRec,lines:accLines});
  show("تم حفظ سند اليومية ✅",true);
  document.querySelector("#lines").innerHTML=""; add(); add(); calc();
}
document.addEventListener("input",(e)=>{ if(e.target.closest("#lines")) calc();});
document.addEventListener("click",(e)=>{
  const rm=e.target.closest('button[data-act="rm"]');
  if(rm){ rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); calc(); }
});
$("addLineBtn").onclick=add;
$("saveBtn").onclick=save;
$("date").value=todayISO();
$("day").textContent=dayNameFromISO($("date").value);
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
add(); add(); loadAcc(); calc();
