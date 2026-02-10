import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { fmt, todayISO, dayNameFromISO, downloadXlsx } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"invoices")) location.href="dashboard.html";
const $=id=>document.getElementById(id);

const canPrint = hasPerm(s,"printInvoices") || s.role==="admin";
const canExport = hasPerm(s,"exportExcel") || s.role==="admin";
let suppliers=[], items=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr><td><select class="input" data-k="item"></select></td><td><span class="chip" data-k="uom">—</span></td><td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td><td><input class="input" data-k="cost" type="number" step="0.01" value="0"></td><td class="chip" data-k="total">0.00</td><td><button class="btn sm danger" data-act="rm">حذف</button></td></tr>`;}
function fillSelects(){const opt=items.map(i=>`<option value="${i.id}">${(i.sku||"")+" - "+(i.name||"")}</option>`).join(""); document.querySelectorAll('#lines select[data-k="item"]').forEach(s=>s.innerHTML=opt);}

function setUomAndPrice(tr){
  const itemId = tr.querySelector('[data-k="item"]').value;
  const it = items.find(i=>i.id===itemId);
  const u = it?.uom || "—";
  const uEl = tr.querySelector('[data-k="uom"]');
  if(uEl) uEl.textContent = u;
}

function addLine(){document.querySelector("#lines").insertAdjacentHTML("beforeend",row()); fillSelects(); calc();}
function calc(){
  const rs=[...document.querySelectorAll("#lines tr")]; let total=0;
  rs.forEach(r=>{const q=Number(r.querySelector('[data-k="qty"]').value||0); const c=Number(r.querySelector('[data-k="cost"]').value||0); const t=q*c; r.querySelector('[data-k="total"]').textContent=fmt(t); total+=t;});
  const discVal=Number($("discount").value||0);
  const discType=($("discountType")?.value||"value");
  const disc = discType==="percent" ? (total*(discVal/100)) : discVal;
  const net=Math.max(0,total-disc);
  $("total").textContent=fmt(total); $("net").textContent=fmt(net);
}
function lines(){
  return [...document.querySelectorAll("#lines tr")].map(r=>({itemId:r.querySelector('[data-k="item"]').value,qty:Number(r.querySelector('[data-k="qty"]').value||0),unitCost:Number(r.querySelector('[data-k="cost"]').value||0)})).filter(x=>x.itemId&&x.qty>0&&x.unitCost>0);
}
async function loadData(){
  const acc=await listDocs("accounts").catch(()=>[]);
  suppliers=acc.filter(a=>a.type==="supplier").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar"));
  items=await listDocs("items").catch(()=>[]);
  $("supplier").innerHTML=suppliers.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  fillSelects(); calc();
}
async function save(){
  const supplierId=$("supplier").value; const date=$("date").value||todayISO(); const day=dayNameFromISO(date); const discountValue=Number($("discount").value||0); const discountType=($("discountType")?.value||"value");
  const ls=lines(); if(!supplierId) return show("اختر مورد"); if(!ls.length) return show("أضف بنود مع التكلفة");
  const enriched=ls.map(l=>{const it=items.find(x=>x.id===l.itemId); return {...l,name:it?it.name:"",sku:it?it.sku:"",lineTotal:l.qty*l.unitCost};});
  const total=enriched.reduce((a,x)=>a+x.lineTotal,0);
  const discount = discountType==="percent" ? (total*(discountValue/100)) : discountValue;
  const net=Math.max(0,total-discount);
  await upsert("invoices",null,{type:"purchase_return",date,day,supplierId,discount,total,net,lines:enriched});
  // مرتجع مشتريات: خروج من المخزون (OUT)
  for(const l of enriched){
    await upsert("inventoryMoves",null,{date,day,type:"out",reason:"purchase_return",itemId:l.itemId,qty:l.qty,unitCost:l.unitCost,ref:""});
  }
  show("تم حفظ مرتجع المشتريات ✅",true);
}
document.addEventListener("input",(e)=>{if(e.target.closest("#lines")||e.target.id==="discount"||e.target.id==="discountType") calc();});
document.addEventListener("click",(e)=>{const rm=e.target.closest('button[data-act="rm"]'); if(rm){rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) addLine(); calc();}});
$("addLineBtn").onclick=addLine; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value); $("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
addLine(); loadData();



function getPrintLines(){
  const ls=lines();
  return ls.map(l=>{
    const it=items.find(i=>i.id===l.itemId);
    return {name:(it?.name||""), sku:(it?.code||""), qty:l.qty, price:l.price, total:(l.qty*l.price)};
  });
}
$("printBtn").onclick=()=>{
  if(!canPrint) return alert("لا تملك صلاحية الطباعة");
  const inv=window.__currentInvoiceDraft || null;
  // build from current form
  const partySel = $("customer")||$("supplier");
  const partyName = partySel?.selectedOptions?.[0]?.textContent||"";
  const date=$("date").value||todayISO();
  const day=dayNameFromISO(date);
  const rows=getPrintLines().map(l=>({name:(l.sku? (l.sku+" - "):"")+l.name,qty:l.qty,price:l.price,total:l.total}));
  const total=rows.reduce((a,x)=>a+Number(x.total||0),0);
  const discVal=Number($("discount").value||0);
  const discType=($("discountType")?.value||"value");
  const disc=discType==="percent" ? (total*(discVal/100)) : discVal;
  const net=Math.max(0,total-disc);
  const w=window.open("","_blank");
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${invTypeLabel}</title>
  <style>
  body{font-family:system-ui; padding:24px}
  .h{display:flex; justify-content:space-between; align-items:flex-start; gap:12px}
  .box{border:1px solid #ddd; border-radius:12px; padding:12px}
  table{width:100%; border-collapse:collapse; margin-top:12px}
  th,td{border:1px solid #ddd; padding:8px; font-size:13px}
  th{background:#f6f7fb}
  @media print{ .noPrint{display:none} body{padding:0} }
  </style></head><body>
  <div class="h">
    <div>
      <h2 style="margin:0">ERP PRO</h2>
      <div>${invTypeLabel}</div>
    </div>
    <div class="box">
      <div><b>التاريخ:</b> ${date} (${day})</div>
      <div><b>الطرف:</b> ${partyName}</div>
    </div>
  </div>
  <table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
  <tbody>
    ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.name}</td><td>${r.qty}</td><td>${fmt(r.price)}</td><td>${fmt(r.total)}</td></tr>`).join("")}
  </tbody></table>
  <div class="h" style="margin-top:12px">
    <div class="box"><b>الإجمالي:</b> ${fmt(total)}<br><b>الخصم:</b> ${fmt(disc)}<br><b>الصافي:</b> ${fmt(net)}</div>
    <button class="noPrint" onclick="window.print()" style="padding:10px 14px">طباعة</button>
  </div>
  </body></html>`);
  w.document.close();
};
$("exportBtn").onclick=()=>{
  if(!canExport) return alert("لا تملك صلاحية التصدير");
  const partySel = $("customer")||$("supplier");
  const partyName = partySel?.selectedOptions?.[0]?.textContent||"";
  const date=$("date").value||todayISO();
  const rows=getPrintLines().map(l=>({item:(l.sku? (l.sku+" - "):"")+l.name,qty:l.qty,price:l.price,total:l.total}));
  const total=rows.reduce((a,x)=>a+Number(x.total||0),0);
  const discVal=Number($("discount").value||0);
  const discType=($("discountType")?.value||"value");
  const disc=discType==="percent" ? (total*(discVal/100)) : discVal;
  const net=Math.max(0,total-disc);
  downloadXlsx(`${invTypeLabel}-${date}.xlsx`, [{name:"invoice", rows:[{date,party:partyName,total,discount:disc,net}, ...rows]}]);
};
