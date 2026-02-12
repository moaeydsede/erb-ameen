
import { requireSession } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession(); if(s.role!=="admin") location.href="dashboard.html";
const $=id=>document.getElementById(id);

function sumAccount(ledger, accountId){
  const l=ledger.get(accountId); return l? l.debit-l.credit : 0;
}
(async()=>{
  const acc=await listDocs("accounts").catch(()=>[]);
  const vou=await listDocs("vouchers").catch(()=>[]);
  // build ledger from vouchers only (including system)
  const ledger=new Map(); // accountId -> {debit,credit}
  for(const v of vou){
    for(const l of (v.lines||[])){
      if(!l.accountId) continue;
      if(!ledger.has(l.accountId)) ledger.set(l.accountId,{debit:0,credit:0});
      const s=ledger.get(l.accountId);
      s.debit+=Number(l.debit||0);
      s.credit+=Number(l.credit||0);
    }
  }
  // categorize by account.type
  const byType=(t)=>acc.filter(a=>a.type===t).map(a=>({a,bal:sumAccount(ledger,a.id)}));
  const income=byType("income");
  const expense=byType("expense");
  const assets=byType("asset");
  const liab=byType("liability");
  const equity=byType("equity");

  const totalIncome = income.reduce((x,r)=>x+(-r.bal),0); // income normal credit
  const totalExpense = expense.reduce((x,r)=>x+(r.bal),0); // expense normal debit
  const net = totalIncome - totalExpense;

  $("income").innerHTML = `
    <table class="table"><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>
      ${income.map(r=>`<tr><td>${r.a.name}</td><td>${fmt(-r.bal)}</td></tr>`).join("")}
      <tr><td><b>إجمالي الإيرادات</b></td><td><b>${fmt(totalIncome)}</b></td></tr>
      ${expense.map(r=>`<tr><td>${r.a.name}</td><td>${fmt(r.bal)}</td></tr>`).join("")}
      <tr><td><b>إجمالي المصروفات</b></td><td><b>${fmt(totalExpense)}</b></td></tr>
      <tr><td><b>صافي الربح</b></td><td><b>${fmt(net)}</b></td></tr>
    </tbody></table>`;

  const totalAssets = assets.reduce((x,r)=>x+(r.bal),0);
  const totalLiab = liab.reduce((x,r)=>x+(-r.bal),0); // liabilities credit
  const totalEq = equity.reduce((x,r)=>x+(-r.bal),0);
  $("bs").innerHTML = `
    <div class="grid">
      <div class="card"><div class="card-body">
        <div class="section-title">الأصول</div>
        <table class="table"><tbody>${assets.map(r=>`<tr><td>${r.a.name}</td><td>${fmt(r.bal)}</td></tr>`).join("")}
        <tr><td><b>إجمالي الأصول</b></td><td><b>${fmt(totalAssets)}</b></td></tr></tbody></table>
      </div></div>
      <div class="card"><div class="card-body">
        <div class="section-title">الخصوم وحقوق الملكية</div>
        <table class="table"><tbody>
        ${liab.map(r=>`<tr><td>${r.a.name}</td><td>${fmt(-r.bal)}</td></tr>`).join("")}
        <tr><td><b>إجمالي الخصوم</b></td><td><b>${fmt(totalLiab)}</b></td></tr>
        ${equity.map(r=>`<tr><td>${r.a.name}</td><td>${fmt(-r.bal)}</td></tr>`).join("")}
        <tr><td><b>إجمالي حقوق الملكية</b></td><td><b>${fmt(totalEq)}</b></td></tr>
        <tr><td><b>خصوم + حقوق</b></td><td><b>${fmt(totalLiab+totalEq)}</b></td></tr>
        </tbody></table>
      </div></div>
    </div>`;

  // cashflow simplified: receipts - payments (from vouchers types receipt/payment/journal)
  const receipts = vou.filter(v=>v.type==="receipt").reduce((a,v)=>a+Number(v.total||0),0);
  const payments = vou.filter(v=>v.type==="payment").reduce((a,v)=>a+Number(v.total||0),0);
  $("cf").innerHTML = `<table class="table"><thead><tr><th>البند</th><th>المبلغ</th></tr></thead><tbody>
    <tr><td>إجمالي المقبوضات</td><td>${fmt(receipts)}</td></tr>
    <tr><td>إجمالي المدفوعات</td><td>${fmt(payments)}</td></tr>
    <tr><td><b>صافي النقد</b></td><td><b>${fmt(receipts-payments)}</b></td></tr>
  </tbody></table>`;
})();
