
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert, removeDoc } from "./data.js";
import { fmt, todayISO, dayNameFromISO, downloadXlsx, parseXlsxFile } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], moves=[], invoices=[], warehouses=[], editing=null;
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
const canSeePurchase = hasPerm(s,"viewPurchasePrices") || s.role==="admin";

const onHand=id=>moves.filter(m=>m.itemId===id).reduce((a,m)=>a+(m.dir==="in"?Number(m.qty||0):-Number(m.qty||0)),0);
function purchaseStats(){
  const s=new Map();
  invoices.filter(i=>i.type==="purchases").forEach(inv=>{
    (inv.lines||[]).forEach(l=>{
      const id=l.itemId; if(!id) return;
      const p=Number(l.unitCost||l.cost||0);
      const d=String(inv.date||"");
      if(!s.has(id)) s.set(id,{last:0,lastDate:"",max:0,sum:0,n:0});
      const st=s.get(id);
      if(d && d>=st.lastDate){ st.lastDate=d; st.last=p; }
      st.max=Math.max(st.max,p);
      st.sum+=p; st.n+=1;
    });
  });
  return s;
}
function clear(){
  editing=null;
  $("code").value=""; $("name").value=""; $("kind").value="item"; $("category").value="raw"; $("uom").value=""; $("salePrice1").value="0"; $("salePrice2").value="0";
  $("saveBtn").textContent="حفظ";
}
function parentCode(code){
  const c=(code||"").trim();
  if(c.length<=2) return null;
  for(let i=c.length-1;i>=2;i--){
    const p=c.slice(0,i);
    if(items.some(it=>it.code===p && it.kind!=="item")) return p;
  }
  return null;
}
function render(){
  const q=($("q").value||"").trim();
  const rows=items
    .filter(it=>!q || (it.code||"").includes(q) || (it.name||"").includes(q))
    .sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""), "ar"));
  $("rows").innerHTML = rows.map(it=>{
    const lvl=Math.max(0,(it.code||"").length-2);
    const pad=Math.min(28,lvl*8);
    const stats=purchaseStats();
    const st=stats.get(it.id);
    const hint = st?`آخر شراء: ${fmt(st.last)} | أعلى: ${fmt(st.max)} | متوسط: ${fmt(st.n? (st.sum/st.n):0)}`:"";
    const stock = it.kind==="item" ? fmt(onHand(it.id)) : "—";
    return `<tr>
      <td><span class="chip" title="${hint}">${it.code||""}</span></td>
      <td style="padding-right:${pad}px"><b>${it.name||""}</b> ${it.kind!=="item"?`<span class="chip">${it.kind==="group"?"رئيسية":"فرعية"}</span>`:""}</td>
      <td>${({raw:"مواد أولية",fg:"جاهزة",other:"أخرى"})[it.category]||"—"}</td>
      <td>${it.uom||"—"}</td>
      <td>${stock}</td>
      <td style="white-space:nowrap">
        <button class="btn sm" data-act="edit" data-id="${it.id}">تعديل</button>
        <button class="btn sm danger" data-act="del" data-id="${it.id}">حذف</button>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="notice">لا توجد مواد</td></tr>`;
  renderMoves();
}
function renderMoves(){
  const rows=moves.sort((a,b)=>(a.date||"").localeCompare(b.date||""));
  $("moves").innerHTML = rows.map(m=>{
    const it=items.find(x=>x.id===m.itemId);
    return `<tr><td>${m.date||""}</td><td>${m.day||""}</td><td>${it?it.name:"—"}</td><td>${m.dir==="in"?"وارد":"صادر"}</td><td>${fmt(m.qty||0)}</td><td>${m.note||""}</td></tr>`;
  }).join("") || `<tr><td colspan="6" class="notice">لا توجد حركة</td></tr>`;
}

async function saveItem(){
  const code=($("code").value||"").trim();
  const name=($("name").value||"").trim();
  const kind=$("kind").value;
  const category=$("category").value;
  const uom=($("uom").value||"").trim();
  const salePrice1=Number($("salePrice1").value||0);
  const salePrice2=Number($("salePrice2").value||0);
  if(!code || !/^[0-9]+$/.test(code)) return show("اكتب كود رقمي مثل 0110001",false);
  if(!name) return show("اكتب الاسم",false);
  const dup=items.find(x=>x.code===code && x.id!==editing);
  if(dup) return show("الكود موجود مسبقًا",false);
  const p=parentCode(code);
  if(kind!=="group" && !p && code.length>2) return show("المادة/الفرعية يجب أن تكون تحت بطاقة رئيسية/فرعية موجودة",false);
  const data={code,name,kind,category,uom,salePrice1,salePrice2,parentCode:p};
  if(editing){ await upsert("items",editing,data); show("تم التحديث ✅",true); }
  else { await upsert("items",null,data); show("تم الحفظ ✅",true); }
  clear(); await load();
}
async function delItem(id){
  const it=items.find(x=>x.id===id); if(!it) return;
  if(items.some(x=>x.parentCode===it.code)) return show("لا يمكن حذف بطاقة لها عناصر تحتها.",false);
  if(moves.some(m=>m.itemId===id)) return show("لا يمكن حذف مادة عليها حركة.",false);
  if(!confirm("تأكيد حذف؟")) return;
  await removeDoc("items",id);
  show("تم الحذف ✅",true);
  await load();
}
function setForm(it){
  editing=it.id;
  $("code").value=it.code||"";
  $("name").value=it.name||"";
  $("kind").value=it.kind||"item";
  $("category").value=it.category||"raw";
  $("uom").value=it.uom||"";
  $("salePrice1").value=Number(it.salePrice1||0);
  $("salePrice2").value=Number(it.salePrice2||0);
  $("saveBtn").textContent="تحديث";
}
async function addMove(dir){
  const itemId=$("moveItem").value;
  const qty=Number($("moveQty").value||0);
  const date=$("moveDate").value||todayISO();
  const day=dayNameFromISO(date);
  const note=($("moveNote").value||"").trim();
  if(!itemId) return show("اختر مادة",false);
  const it=items.find(x=>x.id===itemId);
  if(it?.kind!=="item") return show("اختر مادة فعلية (ليس بطاقة)",false);
  if(qty<=0) return show("اكتب كمية صحيحة",false);
  await upsert("moves",null,{itemId,dir,qty,date,day,note});
  $("moveQty").value=""; $("moveNote").value="";
  show("تمت إضافة الحركة ✅",true);
  await load();
}
async function exportExcel(){
  const rows=items.sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""), "ar"))
    .map(it=>({code:it.code||"",name:it.name||"",kind:it.kind||"item",category:it.category||"raw",uom:it.uom||"",salePrice1:Number(it.salePrice1||0),salePrice2:Number(it.salePrice2||0)}));
  downloadXlsx("دليل-المواد.xlsx", [{name:"items", rows}]);
}
async function importExcel(file){
  const data=await parseXlsxFile(file);
  const sheet=data.items || data.Sheet1 || Object.values(data)[0];
  if(!sheet?.length) return show("ملف إكسل فارغ",false);
  for(const r of sheet){
    const code=String(r.code||r.Code||"").trim();
    const name=String(r.name||r.Name||"").trim();
    if(!code||!name||!/^[0-9]+$/.test(code)) continue;
    const kind=String(r.kind||r.Kind||"item").trim()||"item";
    const category=String(r.category||r.Category||"raw").trim()||"raw";
    const uom=String(r.uom||r.UOM||"").trim();
    const salePrice1=Number(r.salePrice1||r.SalePrice1||0);
    const salePrice2=Number(r.salePrice2||r.SalePrice2||0);
    const existing=items.find(x=>x.code===code);
    const dataRow={code,name,kind,category,uom,salePrice1,salePrice2,parentCode:parentCode(code)};
    if(existing) await upsert("items",existing.id,dataRow);
    else await upsert("items",null,dataRow);
  }
  show("تم الاستيراد ✅",true);
  await load();
}

async function load(){
  items=await listDocs("items").catch(()=>[]);
  moves=await listDocs("moves").catch(()=>[]);
  invoices=await listDocs("invoices").catch(()=>[]);
  warehouses=await listDocs("warehouses").catch(()=>[]);
  const wf=document.getElementById("whFilter");
  if(wf){ wf.innerHTML=[{id:"",name:"كل المستودعات"}, ...warehouses.filter(w=>w.active!==false)].map(w=>`<option value="${w.id}">${w.name}</option>`).join(""); }
  // build move item select (items only)
  const opt=items.filter(i=>i.kind==="item").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""), "ar"))
    .map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  $("moveItem").innerHTML=opt;
  render();
}

document.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]"); if(!b) return;
  const id=b.dataset.id;
  if(b.dataset.act==="edit"){ const it=items.find(x=>x.id===id); if(it) setForm(it); }
  if(b.dataset.act==="del") delItem(id);
});
$("saveBtn").onclick=saveItem;
$("resetBtn").onclick=clear;
$("q").addEventListener("input",render);
const wf=document.getElementById("whFilter"); if(wf) wf.addEventListener("change",render);
$("inBtn").onclick=()=>addMove("in");
$("outBtn").onclick=()=>addMove("out");
$("exportBtn").onclick=exportExcel;
$("importBtn").onclick=()=>$("importFile").click();
$("importFile").addEventListener("change",(e)=>{ const f=e.target.files?.[0]; if(f) importExcel(f); e.target.value=""; });

$("moveDate").value=todayISO();
clear(); load();


// بحث سريع + زر إضافة
const __q=document.getElementById("itemSearch");
if(__q){ __q.addEventListener("input", ()=>{ try{ render(); }catch(e){} }); }
const __add=document.getElementById("addNewBtn");
if(__add){ __add.addEventListener("click", ()=>{ try{ openForm(); }catch(e){} }); }
