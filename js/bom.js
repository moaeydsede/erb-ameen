
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], boms=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr>
  <td><select class="input" data-k="rm"></select></td>
  <td><span class="chip" data-k="uom">—</span></td>
  <td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td>
  <td><button class="btn sm danger" data-act="rmLine">حذف</button></td>
</tr>`;}
function fill(){
  const opt=items.filter(i=>i.kind==="item").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  $("fg").innerHTML=opt;
  document.querySelectorAll('select[data-k="rm"]').forEach(s=>s.innerHTML=opt);
}
function setUom(tr){
  const id=tr.querySelector('[data-k="rm"]').value;
  const it=items.find(x=>x.id===id);
  tr.querySelector('[data-k="uom"]').textContent=it?.uom||"—";
}
function add(){ document.querySelector("#lines").insertAdjacentHTML("beforeend", row()); fill(); setUom(document.querySelector("#lines tr:last-child")); }
function lines(){
  return [...document.querySelectorAll("#lines tr")].map(tr=>({
    itemId:tr.querySelector('[data-k="rm"]').value,
    qty:Number(tr.querySelector('[data-k="qty"]').value||0)
  })).filter(x=>x.itemId && x.qty>0);
}
function render(){
  $("rows").innerHTML=boms.map(b=>{
    const fg=items.find(x=>x.id===b.fgId);
    return `<tr><td><b>${fg?`${fg.code} - ${fg.name}`:b.fgId}</b></td><td>${b.fgQty||1}</td><td>${(b.lines||[]).length}</td></tr>`;
  }).join("")||`<tr><td colspan="3" class="notice">لا يوجد BOM</td></tr>`;
}
async function load(){ boms=await listDocs("boms").catch(()=>[]); render(); }
async function save(){
  const fgId=$("fg").value;
  const fgQty=Number($("fgQty").value||1);
  const ls=lines();
  if(!fgId) return show("اختر المنتج",false);
  if(!ls.length) return show("أضف مواد خام",false);
  await upsert("boms",fgId,{fgId,fgQty,lines:ls});
  show("تم الحفظ ✅",true);
  document.querySelector("#lines").innerHTML=""; add();
  await load();
}
document.addEventListener("click",(e)=>{ const rm=e.target.closest('button[data-act="rmLine"]'); if(rm){ rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); } });
document.addEventListener("change",(e)=>{ if(e.target.matches('select[data-k="rm"]')) setUom(e.target.closest("tr")); });
$("addBtn").onclick=add;
$("saveBtn").onclick=save;
(async()=>{ items=await listDocs("items").catch(()=>[]); add(); await load(); })();
