
import { requireSession, hasPerm } from "./session.js";
import { upsert, listDocs, removeDoc } from "./data.js";
import { fmt, todayISO, dayNameFromISO, downloadXlsx } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const canSeeCosts = hasPerm(s,"viewCosts") || s.role==="admin";
const $=id=>document.getElementById(id);
let editing=null, cache=[], items=[], purchases=[], company=null;

function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}

function rawRow(){
  return `<tr>
    <td><select class="input" data-k="item"></select></td>
    <td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td>
    <td><input class="input" data-k="price" type="number" step="0.01" value="0"></td>
    <td class="chip" data-k="total">0.00</td>
    <td><button class="btn sm danger" data-act="rm">حذف</button></td>
  </tr>`;
}
function expRow(){
  return `<tr>
    <td><input class="input" data-k="desc" placeholder="مثال: كهرباء"></td>
    <td><input class="input" data-k="amt" type="number" step="0.01" value="0"></td>
    <td><button class="btn sm danger" data-act="rm">حذف</button></td>
  </tr>`;
}
function fgRow(){
  return `<tr>
    <td><select class="input" data-k="item"></select></td>
    <td><input class="input" data-k="qty" type="number" step="1" value="1"></td>
    <td class="chip" data-k="unit">0.00</td>
    <td class="chip" data-k="total">0.00</td>
    <td><button class="btn sm danger" data-act="rm">حذف</button></td>
  </tr>`;
}

function purchaseStats(){
  const stats=new Map(); // itemId -> {last, max, sum, n}
  purchases.filter(p=>p.type==="purchases").forEach(inv=>{
    (inv.lines||[]).forEach(l=>{
      const id=l.itemId; if(!id) return;
      const price=Number(l.unitCost||l.cost||0);
      const d=String(inv.date||"");
      if(!stats.has(id)) stats.set(id,{last:0,lastDate:"",max:0,sum:0,n:0});
      const st=stats.get(id);
      if(d && d>=st.lastDate){ st.lastDate=d; st.last=price; }
      st.max=Math.max(st.max,price);
      st.sum+=price; st.n+=1;
    });
  });
  return stats;
}

function fillSelects(){
  const rawItems = items.filter(i=>i.kind==="item" && i.category==="raw").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar"));
  const fgItems  = items.filter(i=>i.kind==="item" && i.category==="fg").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar"));
  const rawOpt = rawItems.map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  const fgOpt  = fgItems.map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  document.querySelectorAll('#rawLines select[data-k="item"]').forEach(s=>s.innerHTML=rawOpt);
  document.querySelectorAll('#fgLines select[data-k="item"]').forEach(s=>s.innerHTML=fgOpt);
}

function ensureOne(){
  if(!document.querySelector("#rawLines tr")) addRaw();
  if(!document.querySelector("#expLines tr")) addExp();
  if(!document.querySelector("#fgLines tr")) addFg();
}

function addRaw(){ document.querySelector("#rawLines").insertAdjacentHTML("beforeend", rawRow()); fillSelects(); autoPrice(); calc(); }
function addExp(){ document.querySelector("#expLines").insertAdjacentHTML("beforeend", expRow()); calc(); }
function addFg(){ document.querySelector("#fgLines").insertAdjacentHTML("beforeend", fgRow()); fillSelects(); calc(); }

function method(){ return ($("priceMethod").value||"last"); }
function autoPrice(){
  const stats=purchaseStats();
  document.querySelectorAll("#rawLines tr").forEach(tr=>{
    const id=tr.querySelector('[data-k="item"]').value;
    const st=stats.get(id);
    let price=0;
    if(st){
      if(method()==="last") price=st.last||0;
      if(method()==="max") price=st.max||0;
      if(method()==="avg") price=st.n? (st.sum/st.n):0;
    }
    const inp=tr.querySelector('[data-k="price"]');
    if(Number(inp.value||0)===0) inp.value = (price?price.toFixed(2):"0");
  });
}

function calc(){
  const sumRaw=[...document.querySelectorAll("#rawLines tr")].reduce((a,tr)=>{
    const qty=Number(tr.querySelector('[data-k="qty"]').value||0);
    const price=Number(tr.querySelector('[data-k="price"]').value||0);
    const t=qty*price;
    tr.querySelector('[data-k="total"]').textContent=fmt(t);
    return a+t;
  },0);
  const sumExp=[...document.querySelectorAll("#expLines tr")].reduce((a,tr)=>{
    const amt=Number(tr.querySelector('[data-k="amt"]').value||0);
    return a+amt;
  },0);

  const fgRows=[...document.querySelectorAll("#fgLines tr")];
  const totalFgQty=fgRows.reduce((a,tr)=>a+Number(tr.querySelector('[data-k="qty"]').value||0),0);
  const totalToDistribute=sumRaw+sumExp;
  const unit = totalFgQty>0 ? (totalToDistribute/totalFgQty) : 0;

  let sumFg=0;
  fgRows.forEach(tr=>{
    const q=Number(tr.querySelector('[data-k="qty"]').value||0);
    const t=q*unit;
    tr.querySelector('[data-k="unit"]').textContent=fmt(unit);
    tr.querySelector('[data-k="total"]').textContent=fmt(t);
    sumFg+=t;
  });

  $("tRaw").textContent=fmt(sumRaw);
  $("tExp").textContent=fmt(sumExp);
  $("tFg").textContent=fmt(sumFg);
  $("tAll").textContent=fmt(sumRaw+sumExp);

  if(!canSeeCosts){
    ["tRaw","tExp","tFg","tAll"].forEach(id=>document.getElementById(id).textContent="—");
  }
}

function collect(){
  const raw=[...document.querySelectorAll("#rawLines tr")].map(tr=>({
    itemId:tr.querySelector('[data-k="item"]').value,
    qty:Number(tr.querySelector('[data-k="qty"]').value||0),
    price:Number(tr.querySelector('[data-k="price"]').value||0),
  })).filter(x=>x.itemId && x.qty>0);
  const exp=[...document.querySelectorAll("#expLines tr")].map(tr=>({
    desc:(tr.querySelector('[data-k="desc"]').value||"").trim(),
    amt:Number(tr.querySelector('[data-k="amt"]').value||0),
  })).filter(x=>x.desc && x.amt>0);
  const fg=[...document.querySelectorAll("#fgLines tr")].map(tr=>({
    itemId:tr.querySelector('[data-k="item"]').value,
    qty:Number(tr.querySelector('[data-k="qty"]').value||0),
  })).filter(x=>x.itemId && x.qty>0);
  return {raw, exp, fg};
}

async function save(){
  const name=($("name").value||"").trim();
  if(!name) return show("اكتب اسم البطاقة",false);
  const date=$("date").value||todayISO();
  const day=dayNameFromISO(date);
  const priceMethod=method();

  const {raw, exp, fg}=collect();
  if(!raw.length) return show("أضف مواد أولية",false);
  if(!fg.length) return show("أضف بضاعة جاهزة (عدد)",false);

  const tRaw=raw.reduce((a,x)=>a+(x.qty*x.price),0);
  const tExp=exp.reduce((a,x)=>a+x.amt,0);
  const total=tRaw+tExp;
  const totalQty=fg.reduce((a,x)=>a+x.qty,0);
  const unit = totalQty>0 ? (total/totalQty) : 0;

  const fgEnriched = fg.map(x=>{
    const it=items.find(i=>i.id===x.itemId);
    return {...x, code:it?.code||"", name:it?.name||"", unitCost:unit, total:x.qty*unit};
  });
  const rawEnriched = raw.map(x=>{
    const it=items.find(i=>i.id===x.itemId);
    return {...x, code:it?.code||"", name:it?.name||"", total:x.qty*x.price};
  });

  const id=await upsert("costCards",editing,{name,date,day,priceMethod,raw:rawEnriched,exp,fg:fgEnriched,tRaw,tExp,total,unitCost:unit});
  show("تم حفظ بطاقة التكاليف ✅ رقم: "+id,true);
  await load();
  reset();
}

function reset(){
  editing=null;
  $("name").value="";
  $("date").value=todayISO();
  $("day").textContent=dayNameFromISO($("date").value);
  document.getElementById("rawLines").innerHTML="";
  document.getElementById("expLines").innerHTML="";
  document.getElementById("fgLines").innerHTML="";
  addRaw(); addExp(); addFg();
  $("saveBtn").textContent="حفظ";
}

async function del(id){
  if(!confirm("تأكيد حذف؟")) return;
  await removeDoc("costCards",id);
  show("تم الحذف ✅",true);
  await load();
}
function edit(id){
  const c=cache.find(x=>x.id===id); if(!c) return;
  editing=c.id;
  $("name").value=c.name||"";
  $("date").value=c.date||todayISO();
  $("day").textContent=c.day||dayNameFromISO($("date").value);
  $("priceMethod").value=c.priceMethod||"last";
  document.getElementById("rawLines").innerHTML="";
  document.getElementById("expLines").innerHTML="";
  document.getElementById("fgLines").innerHTML="";
  (c.raw||[]).forEach(r=>{ addRaw(); const tr=document.querySelector("#rawLines tr:last-child"); tr.querySelector('[data-k="item"]').value=r.itemId; tr.querySelector('[data-k="qty"]').value=r.qty; tr.querySelector('[data-k="price"]').value=r.price; });
  (c.exp||[]).forEach(r=>{ addExp(); const tr=document.querySelector("#expLines tr:last-child"); tr.querySelector('[data-k="desc"]').value=r.desc; tr.querySelector('[data-k="amt"]').value=r.amt; });
  (c.fg||[]).forEach(r=>{ addFg(); const tr=document.querySelector("#fgLines tr:last-child"); tr.querySelector('[data-k="item"]').value=r.itemId; tr.querySelector('[data-k="qty"]').value=r.qty; });
  ensureOne(); calc();
  $("saveBtn").textContent="تحديث";
}

function renderList(){
  $("rows").innerHTML = cache
    .sort((a,b)=>(b.date||"").localeCompare(a.date||""))
    .map(c=>`<tr>
      <td>${c.date||""}</td>
      <td>${c.name||""}</td>
      <td>${canSeeCosts?fmt(c.total||0):"—"}</td>
      <td style="white-space:nowrap">
        <button class="btn sm" data-act="edit" data-id="${c.id}">تعديل</button>
        <button class="btn sm danger" data-act="del" data-id="${c.id}">حذف</button>
      </td>
    </tr>`).join("") || `<tr><td colspan="4" class="notice">لا توجد بطاقات</td></tr>`;
}

function exportExcel(){
  const rows = cache.map(c=>({
    date:c.date, name:c.name, priceMethod:c.priceMethod, total:c.total, unitCost:c.unitCost
  }));
  downloadXlsx("بطاقات-التكاليف.xlsx", [{name:"costCards", rows}]);
}

async function load(){
  // items + purchase invoices for pricing
  items=await listDocs("items").catch(()=>[]);
  purchases=await listDocs("invoices").catch(()=>[]);
  cache=await listDocs("costCards").catch(()=>[]);
  fillSelects();
  renderList();
  autoPrice();
  calc();
}

document.addEventListener("input",(e)=>{
  if(e.target.closest("#rawLines") || e.target.closest("#expLines") || e.target.closest("#fgLines") || e.target.id==="priceMethod"){
    if(e.target.id==="priceMethod") autoPrice();
    calc();
  }
});
document.addEventListener("change",(e)=>{
  if(e.target.closest("#rawLines") && e.target.matches('select[data-k="item"]')) { autoPrice(); calc(); }
});
document.addEventListener("click",(e)=>{
  const rm=e.target.closest('button[data-act="rm"]');
  if(rm){ rm.closest("tr").remove(); ensureOne(); calc(); }
  const b=e.target.closest('button[data-act="edit"]'); if(b) edit(b.dataset.id);
  const d=e.target.closest('button[data-act="del"]'); if(d) del(d.dataset.id);
});
$("addRawBtn").onclick=addRaw;
$("addExpBtn").onclick=addExp;
$("addFgBtn").onclick=addFg;
$("saveBtn").onclick=save;
$("resetBtn").onclick=reset;
$("exportBtn").onclick=exportExcel;

$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));

reset();
load();
