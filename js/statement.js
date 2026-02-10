import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[], vouchers=[], invoices=[];
function inRange(d,from,to){ if(from && d<from) return false; if(to && d>to) return false; return true; }
function showTable(rows){
  $("rows").innerHTML = rows.map(r=>`<tr><td>${r.date||""}</td><td>${r.day||""}</td><td>${r.desc||""}</td><td>${fmt(r.debit)}</td><td>${fmt(r.credit)}</td><td>${fmt(Math.abs(r.balance))}</td><td><span class="chip">${r.balance>=0?"مدين":"دائن"}</span></td></tr>`).join("") || `<tr><td colspan="7" class="notice">لا توجد حركة</td></tr>`;
  $("totD").textContent=fmt(rows.reduce((a,x)=>a+Number(x.debit||0),0));
  $("totC").textContent=fmt(rows.reduce((a,x)=>a+Number(x.credit||0),0));
  const bal=rows.length?rows[rows.length-1].balance:0;
  $("bal").textContent=fmt(Math.abs(bal));
  $("balType").textContent=bal>=0?"مدين":"دائن";
}
function build(){
  const accId=$("account").value;
  const from=$("from").value, to=$("to").value;
  let rows=[];
  vouchers.forEach(v=>{
    if(!inRange(v.date||"",from,to)) return;
    if(v.type==="receipt"){
      if(v.cashAccountId===accId) rows.push({date:v.date,day:v.day,desc:"سند قبض",debit:Number(v.amount||0),credit:0});
      (v.lines||[]).forEach(l=>{ if(l.accountId===accId) rows.push({date:v.date,day:v.day,desc:"سند قبض",debit:0,credit:Number(l.credit||0)}); });
    }else if(v.type==="payment"){
      if(v.cashAccountId===accId) rows.push({date:v.date,day:v.day,desc:"سند دفع",debit:0,credit:Number(v.amount||0)});
      (v.lines||[]).forEach(l=>{ if(l.accountId===accId) rows.push({date:v.date,day:v.day,desc:"سند دفع",debit:Number(l.debit||0),credit:0}); });
    }else if(v.type==="journal"){
      if(v.cashAccountId===accId){
        if(v.direction==="receipt") rows.push({date:v.date,day:v.day,desc:"سند يومية (نقدي)",debit:Number(v.amount||0),credit:0});
        else rows.push({date:v.date,day:v.day,desc:"سند يومية (نقدي)",debit:0,credit:Number(v.amount||0)});
      }
      if(v.accountId===accId){
        if(v.direction==="receipt") rows.push({date:v.date,day:v.day,desc:"سند يومية",debit:0,credit:Number(v.amount||0)});
        else rows.push({date:v.date,day:v.day,desc:"سند يومية",debit:Number(v.amount||0),credit:0});
      }
    }
  });
  invoices.forEach(inv=>{
    if(!inRange(inv.date||"",from,to)) return;
    if(inv.type==="sales" && inv.customerId===accId) rows.push({date:inv.date,day:inv.day,desc:"فاتورة مبيعات",debit:Number(inv.net||0),credit:0});
    if(inv.type==="purchases" && inv.supplierId===accId) rows.push({date:inv.date,day:inv.day,desc:"فاتورة مشتريات",debit:0,credit:Number(inv.net||0)});
  });
  rows.sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  let bal=0;
  rows=rows.map(r=>{bal += Number(r.debit||0)-Number(r.credit||0); return {...r,balance:bal};});
  showTable(rows);
}
window.printStatement=()=>window.print();
(async()=>{
  accounts=await listDocs("accounts").catch(()=>[]);
  vouchers=await listDocs("vouchers").catch(()=>[]);
  invoices=await listDocs("invoices").catch(()=>[]);
  $("account").innerHTML = accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join("");
  build();
})();
["account","from","to"].forEach(id=>$(id).addEventListener("change",build));
