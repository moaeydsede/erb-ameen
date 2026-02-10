
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, putDoc, removeDoc } from "./data.js";
import { fmt, downloadXlsx, parseXlsxFile } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"accounts")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let editingId=null, cache=[], vouchers=[], invoices=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function clear(){editingId=null;$("code").value="";$("name").value="";$("openingBalance").value="0";$("type").value="general";$("currency").value="";$("saveBtn").textContent="حفظ";}
function codeLevel(code){ return (code||"").length; }
function parentCode(code){
  const c=(code||"").trim();
  if(c.length<=1) return null;
  // parent is code minus last char, but prefer valid existing parent with shorter length
  for(let i=c.length-1;i>=1;i--){
    const p=c.slice(0,i);
    if(cache.some(a=>a.code===p)) return p;
  }
  return null;
}
function typeLabel(t){
  return ({general:"عام",cash:"نقدي/بنك",customer:"عميل",supplier:"مورد",expense:"مصروف",revenue:"إيراد"})[t]||t||"";
}
function usedBy(id){
  const inVou=vouchers.some(v=>{
    if(v.type==="receipt") return v.cashAccountId===id || (v.lines||[]).some(l=>l.accountId===id);
    if(v.type==="payment") return v.cashAccountId===id || (v.lines||[]).some(l=>l.accountId===id);
    if(v.type==="journal") return v.cashAccountId===id || v.accountId===id;
    if(v.type==="journal2") return (v.lines||[]).some(l=>l.accountId===id);
    if(v.type==="fx") return v.fromAcc===id || v.toAcc===id;
    return false;
  });
  const inInv=invoices.some(inv=>{
    return inv.customerId===id || inv.supplierId===id || (inv.lines||[]).some(l=>l.accountId===id);
  });
  return inVou||inInv;
}
function childrenOf(code){ return cache.filter(a=>a.code && a.code.startsWith(code) && a.code!==code); }
async function del(id){
  const a=cache.find(x=>x.id===id); if(!a) return;
  if(childrenOf(a.code||"").length) return show("لا يمكن حذف حساب له حسابات فرعية.",false);
  if(usedBy(id)) return show("لا يمكن حذف حساب عليه حركة/مستندات.",false);
  if(!confirm("تأكيد حذف الحساب؟")) return;
  await removeDoc("accounts",id);
  show("تم الحذف ✅",true);
  await load();
}
function setForm(a){
  editingId=a.id;
  $("code").value=a.code||"";
  $("name").value=a.name||"";
  $("openingBalance").value=Number(a.openingBalance||0);
  $("type").value=a.type||"general";
  $("currency").value=a.currency||"";
  $("saveBtn").textContent="تحديث";
}
function filtered(){
  const q=($("q").value||"").trim();
  if(!q) return cache;
  return cache.filter(a=> (a.code||"").includes(q) || (a.name||"").includes(q) || typeLabel(a.type).includes(q));
}
function render(){
  const rows=filtered().sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""), "ar"));
  $("rows").innerHTML = rows.map(a=>{
    const lvl=Math.max(0,codeLevel(a.code)-1);
    const pad=Math.min(28,lvl*10);
    return `<tr>
      <td><span class="chip">${a.code||""}</span></td>
      <td style="padding-right:${pad}px"><b>${a.name||""}</b></td>
      <td>${typeLabel(a.type)}</td>
      <td>${fmt(a.openingBalance||0)}</td>
      <td>${a.currency||"—"}</td>
      <td style="white-space:nowrap">
        <button class="btn sm" data-act="edit" data-id="${a.id}">تعديل</button>
        <button class="btn sm" data-act="child" data-id="${a.id}">+ فرعي</button>
        <button class="btn sm danger" data-act="del" data-id="${a.id}">حذف</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="notice">لا توجد حسابات</td></tr>`;
}
async function save(){
  const code=($("code").value||"").trim();
  const name=($("name").value||"").trim();
  const openingBalance=Number($("openingBalance").value||0);
  const type=$("type").value;
  const currency=($("currency").value||"").trim().toUpperCase();
  if(!code || !/^[0-9]+$/.test(code)) return show("اكتب كود رقمي صحيح (مثال 111)",false);
  if(!name) return show("اكتب اسم الحساب",false);
  // unique code
  const dup=cache.find(a=>a.code===code && a.id!==editingId);
  if(dup) return show("الكود موجود مسبقًا.",false);
  // parent validation (except top)
  const parent=parentCode(code);
  if(code.length>1 && !parent) return show("الكود الفرعي يحتاج حساب أب موجود (مثال: 111 تحت 11).",false);

  if(editingId){
    await upsert("accounts",editingId,{code,name,openingBalance,type,currency,parentCode:parent});
    show("تم التحديث ✅",true);
  }else{
    await upsert("accounts",null,{code,name,openingBalance,type,currency,parentCode:parent});
    show("تم الحفظ ✅",true);
  }
  clear();
  await load();
}
async function seedDefault(){
  if(!confirm("سيتم إضافة دليل حسابات افتراضي (يمكنك تعديله لاحقًا). متابعة؟")) return;
  const chart=[
    ["1","الأصول","general"],["11","أصول ثابتة","general"],["111","مكاتب","general"],["112","أراضي","general"],["113","سيارات","general"],
    ["12","أصول متداولة","general"],["121","الصندوق","cash"],["122","البنك","cash"],["123","العملاء","customer"],
    ["2","الخصوم","general"],["21","موردون","supplier"],["22","قروض","general"],
    ["3","حقوق الملكية","general"],["31","رأس المال","general"],["32","الأرباح المحتجزة","general"],
    ["4","الإيرادات","revenue"],["41","مبيعات","revenue"],["42","إيرادات أخرى","revenue"],
    ["5","المصروفات","expense"],["51","مصاريف تشغيلية","expense"],["52","رواتب","expense"],["53","إيجارات","expense"],
    ["6","تكلفة المبيعات","expense"],["61","تكلفة البضاعة المباعة","expense"],
  ];
  for(const [code,name,type] of chart){
    const exists=cache.some(a=>a.code===code);
    if(!exists) await upsert("accounts",null,{code,name,type,openingBalance:0,currency:"",parentCode:parentCode(code)});
  }
  show("تمت إضافة الدليل الافتراضي ✅",true);
  await load();
}
async function exportXlsx(){
  const rows=cache.sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""), "ar"))
    .map(a=>({code:a.code||"",name:a.name||"",type:a.type||"general",openingBalance:Number(a.openingBalance||0),currency:a.currency||""}));
  downloadXlsx("دليل-الحسابات.xlsx", [{name:"accounts", rows}]);
}
async function importXlsx(file){
  const data=await parseXlsxFile(file);
  const sheet=data.accounts || data.Sheet1 || Object.values(data)[0];
  if(!sheet?.length) return show("ملف إكسل فارغ",false);
  for(const r of sheet){
    const code=String(r.code||r.Code||"").trim();
    const name=String(r.name||r.Name||"").trim();
    if(!code||!name) continue;
    if(!/^[0-9]+$/.test(code)) continue;
    const type=String(r.type||r.Type||"general").trim()||"general";
    const openingBalance=Number(r.openingBalance||r.OpeningBalance||0);
    const currency=String(r.currency||r.Currency||"").trim().toUpperCase();
    const existing=cache.find(a=>a.code===code);
    if(existing){
      await upsert("accounts",existing.id,{code,name,type,openingBalance,currency,parentCode:parentCode(code)});
    }else{
      await upsert("accounts",null,{code,name,type,openingBalance,currency,parentCode:parentCode(code)});
    }
  }
  show("تم الاستيراد ✅",true);
  await load();
}

async function load(){
  cache=await listDocs("accounts").catch(()=>[]);
  vouchers=await listDocs("vouchers").catch(()=>[]);
  invoices=await listDocs("invoices").catch(()=>[]);
  render();
}

document.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]"); if(!b) return;
  const id=b.dataset.id;
  if(b.dataset.act==="edit"){ const a=cache.find(x=>x.id===id); if(a) setForm(a); }
  if(b.dataset.act==="del") del(id);
  if(b.dataset.act==="child"){
    const a=cache.find(x=>x.id===id); if(!a) return;
    const next=(a.code||"")+"1";
    $("code").value=next; $("name").value=""; $("type").value="general"; $("openingBalance").value="0"; $("currency").value="";
    editingId=null; $("saveBtn").textContent="حفظ";
    show("أضف حساب فرعي تحت "+a.code,true);
  }
  if(b.dataset.act==="seed") seedDefault();
  if(b.dataset.act==="export") exportXlsx();
  if(b.dataset.act==="pickImport") $("importFile").click();
});
$("importFile").addEventListener("change",(e)=>{ const f=e.target.files?.[0]; if(f) importXlsx(f); e.target.value=""; });
$("saveBtn").onclick=save;
$("resetBtn").onclick=clear;
$("q").addEventListener("input",render);

load(); clear();
