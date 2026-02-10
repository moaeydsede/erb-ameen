import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"vouchers")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
async function loadAcc(){
  accounts=await listDocs("accounts").catch(()=>[]);
  const opt=accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join("");
  $("fromAcc").innerHTML=opt; $("toAcc").innerHTML=opt;
}
function calc(){ $("toAmt").textContent=fmt(Number($("fromAmt").value||0)*Number($("rate").value||0)); }
async function save(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const fromAcc=$("fromAcc").value, toAcc=$("toAcc").value;
  const fromAmt=Number($("fromAmt").value||0), rate=Number($("rate").value||0);
  if(!fromAcc||!toAcc) return show("اختر الحسابين");
  if(fromAmt<=0||rate<=0) return show("اكتب المبلغ وسعر الصرف");
  const toAmt=fromAmt*rate;
  await upsert("vouchers",null,{type:"fx",date,day,fromAcc,toAcc,fromAmt,rate,toAmt,note:$("note").value.trim()});
  calc(); show("تم حفظ سند تحويل العملات ✅",true);
}
$("calcBtn").onclick=calc; $("saveBtn").onclick=save;
$("fromAmt").oninput=calc; $("rate").oninput=calc;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
loadAcc(); calc();
