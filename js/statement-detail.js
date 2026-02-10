
import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt, downloadXlsx } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"reports")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let accounts=[], vouchers=[], invoices=[];
function inRange(d,from,to){ if(from && d<from) return false; if(to && d>to) return false; return true; }

function build(){
  const accId=$("account").value;
  const from=$("from").value, to=$("to").value;
  const blocks=[];
  let rowsFlat=[];
  // Vouchers
  vouchers.forEach(v=>{
    if(!inRange(v.date||"",from,to)) return;
    if(v.type==="receipt"){
      if(v.cashAccountId===accId) rowsFlat.push({date:v.date,day:v.day,desc:"سند قبض (نقدي)",debit:Number(v.amount||0),credit:0,details:[]});
      (v.lines||[]).forEach(l=>{ if(l.accountId===accId) rowsFlat.push({date:v.date,day:v.day,desc:"سند قبض",debit:0,credit:Number(l.credit||0),details:[]}); });
    }else if(v.type==="payment"){
      if(v.cashAccountId===accId) rowsFlat.push({date:v.date,day:v.day,desc:"سند دفع (نقدي)",debit:0,credit:Number(v.amount||0),details:[]});
      (v.lines||[]).forEach(l=>{ if(l.accountId===accId) rowsFlat.push({date:v.date,day:v.day,desc:"سند دفع",debit:Number(l.debit||0),credit:0,details:[]}); });
    }else if(v.type==="journal2"){
      if(v.cashAccountId===accId){
        if(Number(v.sumRec||0)>0) rowsFlat.push({date:v.date,day:v.day,desc:"سند يومية (مقبوضات)",debit:Number(v.sumRec||0),credit:0,details:[]});
        if(Number(v.sumPaid||0)>0) rowsFlat.push({date:v.date,day:v.day,desc:"سند يومية (مدفوعات)",debit:0,credit:Number(v.sumPaid||0),details:[]});
      }
      (v.lines||[]).forEach(l=>{ if(l.accountId===accId) rowsFlat.push({date:v.date,day:v.day,desc:"سند يومية",debit:Number(l.debit||0),credit:Number(l.credit||0),details:[l.note||""]}); });
    }else if(v.type==="fx"){
      if(v.fromAcc===accId) rowsFlat.push({date:v.date,day:v.day,desc:"تحويل عملات (من)",debit:0,credit:Number(v.fromAmt||0),details:[`إلى: ${v.toAcc}`, `سعر: ${v.rate}`, `مكافئ: ${v.toAmt}`]});
      if(v.toAcc===accId) rowsFlat.push({date:v.date,day:v.day,desc:"تحويل عملات (إلى)",debit:Number(v.toAmt||0),credit:0,details:[`من: ${v.fromAcc}`, `سعر: ${v.rate}`, `مكافئ: ${v.toAmt}`]});
    }
  });

  // Invoices with details (lines)
  invoices.forEach(inv=>{
    if(!inRange(inv.date||"",from,to)) return;
    if(inv.type==="sales" && inv.customerId===accId){
      rowsFlat.push({
        date:inv.date, day:inv.day, desc:"فاتورة مبيعات",
        debit:Number(inv.net||0), credit:0,
        details:(inv.lines||[]).map(l=>`${l.sku||""} ${l.name||""} × ${l.qty||0} = ${fmt(l.lineTotal||0)}`)
      });
    }
    if(inv.type==="sales-return" && inv.customerId===accId){
      rowsFlat.push({
        date:inv.date, day:inv.day, desc:"مرتجع مبيعات",
        debit:0, credit:Number(inv.net||0),
        details:(inv.lines||[]).map(l=>`${l.sku||""} ${l.name||""} × ${l.qty||0} = ${fmt(l.lineTotal||0)}`)
      });
    }
    if(inv.type==="purchases" && inv.supplierId===accId){
      rowsFlat.push({
        date:inv.date, day:inv.day, desc:"فاتورة مشتريات",
        debit:0, credit:Number(inv.net||0),
        details:(inv.lines||[]).map(l=>`${l.sku||""} ${l.name||""} × ${l.qty||0} = ${fmt(l.lineTotal||0)}`)
      });
    }
    if(inv.type==="purchase-return" && inv.supplierId===accId){
      rowsFlat.push({
        date:inv.date, day:inv.day, desc:"مرتجع مشتريات",
        debit:Number(inv.net||0), credit:0,
        details:(inv.lines||[]).map(l=>`${l.sku||""} ${l.name||""} × ${l.qty||0} = ${fmt(l.lineTotal||0)}`)
      });
    }
  });

  rowsFlat.sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  let bal=0;
  rowsFlat=rowsFlat.map(r=>{ bal += Number(r.debit||0)-Number(r.credit||0); return {...r,balance:bal}; });

  $("totD").textContent=fmt(rowsFlat.reduce((a,x)=>a+Number(x.debit||0),0));
  $("totC").textContent=fmt(rowsFlat.reduce((a,x)=>a+Number(x.credit||0),0));
  $("bal").textContent=fmt(Math.abs(bal));
  $("balType").textContent=bal>=0?"مدين":"دائن";

  const html = rowsFlat.map(r=>{
    const det = (r.details||[]).length ? `<div class="notice" style="margin-top:6px">${(r.details||[]).map(x=>`• ${x}`).join("<br>")}</div>` : "";
    return `<div class="card" style="margin-bottom:10px">
      <div class="card-body">
        <div class="row" style="justify-content:space-between; gap:10px">
          <div><span class="chip">${r.date||""}</span> <span class="chip">${r.day||""}</span> <b>${r.desc||""}</b></div>
          <div class="row" style="gap:8px">
            <span class="chip">مدين: <b>${fmt(r.debit||0)}</b></span>
            <span class="chip">دائن: <b>${fmt(r.credit||0)}</b></span>
            <span class="chip">الرصيد: <b>${fmt(Math.abs(r.balance||0))}</b> ${r.balance>=0?"مدين":"دائن"}</span>
          </div>
        </div>
        ${det}
      </div>
    </div>`;
  }).join("") || `<div class="notice">لا توجد حركة</div>`;
  $("out").innerHTML = html;

  // store for excel
  window.__rowsFlat = rowsFlat;
}
function exportExcel(){
  const rows = (window.__rowsFlat||[]).map(r=>({
    date:r.date, day:r.day, desc:r.desc, debit:r.debit, credit:r.credit, balance:r.balance,
    details:(r.details||[]).join(" | ")
  }));
  downloadXlsx("كشف-حساب-تفصيلي.xlsx", [{name:"statement", rows}]);
}

(async()=>{
  accounts=await listDocs("accounts").catch(()=>[]);
  vouchers=await listDocs("vouchers").catch(()=>[]);
  invoices=await listDocs("invoices").catch(()=>[]);
  $("account").innerHTML = accounts.map(a=>`<option value="${a.id}">${(a.code||"")+" - "+(a.name||"")}</option>`).join("");
  build();
})();
["account","from","to"].forEach(id=>$(id).addEventListener("change",build));
$("exportBtn").onclick=exportExcel;
