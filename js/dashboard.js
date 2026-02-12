import { requireSession, hasPerm } from "./session.js";
import { listDocs } from "./data.js";
import { fmt } from "./ui.js";
const s=requireSession();
const tiles=document.getElementById("tiles");
const kpi=document.getElementById("kpi");
const can=k=>hasPerm(s,k);
function tile(t,d,href){const el=document.createElement("div");el.className="tile";el.onclick=()=>location.href=href;el.innerHTML=`<h3>${t}</h3><p>${d}</p>`;tiles.appendChild(el);}
if(can("company")) tile("بيانات الشركة","اللغة + العملة + التسعير","company.html");
if(s.role==="admin") tile("المستخدمين والصلاحيات","تحديد الصلاحيات داخل البرنامج","users.html");
if(can("accounts")){tile("دليل الحسابات","إضافة/تعديل/بحث","accounts.html");tile("العملاء","إدارة العملاء","customers.html");tile("الموردين","إدارة الموردين","suppliers.html");}
if(can("invoices")) tile("فواتير مبيعات","بنود + خصم + COGS","sales.html");
if(can("manufacturing")) tile("المواد والمخزون","حركة مادة + جرد","inventory.html");
if(can("vouchers")){tile("سند قبض","متعدد الحسابات","receipt.html");tile("سند اليومية","مدفوعات/مقبوضات","journal.html");}
if(can("reports")) tile("ميزان المراجعة","مدين/دائن/رصيد","trial-balance.html");
if(can("cfo")) tile("CFO","مؤشرات عليا","cfo.html");
(async()=>{
  const invoices=can("invoices")?await listDocs("invoices").catch(()=>[]):[];
  const vouchers=can("vouchers")?await listDocs("vouchers").catch(()=>[]):[];
  const sales=invoices.filter(x=>x.type==="sales");
  const net=sales.reduce((a,x)=>a+Number(x.net||0),0);
  const cogs=sales.reduce((a,x)=>a+Number(x.cogs||0),0);
  const gp=net-cogs;
  const rec=vouchers.filter(v=>v.type==="receipt").reduce((a,x)=>a+Number(x.amount||0),0);
  kpi.innerHTML=`<div class="box"><div class="t">صافي المبيعات</div><div class="v">${fmt(net)}</div></div>
  <div class="box"><div class="t">COGS</div><div class="v">${fmt(cogs)}</div></div>
  <div class="box"><div class="t">مجمل الربح</div><div class="v">${fmt(gp)}</div></div>
  <div class="box"><div class="t">مقبوضات</div><div class="v">${fmt(rec)}</div></div>`;
})();
