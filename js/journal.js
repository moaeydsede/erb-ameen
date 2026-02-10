import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
async function loadAcc(){accounts=await listDocs("accounts").catch(()=>[]); const opt=accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join(""); $("cashAccount").innerHTML=opt; $("account").innerHTML=opt;}
async function save(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const cashAccountId=$("cashAccount").value, accountId=$("account").value, note=$("note").value.trim();
  const paid=Number($("paid").value||0), received=Number($("received").value||0);
  if(!cashAccountId||!accountId) return show("اختر الحساب النقدي والحساب");
  if((paid<=0 && received<=0) || (paid>0 && received>0)) return show("اكتب مدفوعات أو مقبوضات (واحد فقط)");
  const amount=paid>0?paid:received; const direction=paid>0?"payment":"receipt";
  const id=await upsert("vouchers",null,{type:"journal",date,day,cashAccountId,accountId,direction,amount,note});
  show("تم حفظ سند اليومية ✅ رقم: "+id,true);
}
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
$("saveBtn").onclick=save; loadAcc();
