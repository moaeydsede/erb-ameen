
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let items=[], whs=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function row(){return `<tr>
  <td><select class="input" data-k="item"></select></td>
  <td><span class="chip" data-k="uom">—</span></td>
  <td><input class="input" data-k="qty" type="number" step="0.01" value="1"></td>
  <td><input class="input" data-k="note" placeholder="بيان"></td>
  <td><button class="btn sm danger" data-act="rm">حذف</button></td>
</tr>`;}
function fill(){
  const opt=items.filter(i=>i.kind==="item").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar")).map(i=>`<option value="${i.id}">${i.code} - ${i.name}</option>`).join("");
  document.querySelectorAll('select[data-k="item"]').forEach(s=>s.innerHTML=opt);
  const wopt=whs.filter(w=>w.active!==false).map(w=>`<option value="${w.id}">${w.name}</option>`).join("");
  $("fromWh").innerHTML=wopt; $("toWh").innerHTML=wopt;
}
function setUom(tr){ const id=tr.querySelector('[data-k="item"]').value; const it=items.find(x=>x.id===id); tr.querySelector('[data-k="uom"]').textContent=it?.uom||"—"; }
function add(){ document.querySelector("#lines").insertAdjacentHTML("beforeend", row()); fill(); setUom(document.querySelector("#lines tr:last-child")); }
function lines(){ return [...document.querySelectorAll("#lines tr")].map(tr=>({itemId:tr.querySelector('[data-k="item"]').value, qty:Number(tr.querySelector('[data-k="qty"]').value||0), note:(tr.querySelector('[data-k="note"]').value||"").trim()})).filter(x=>x.itemId && x.qty>0); }
async function save(){
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const fromWh=$("fromWh").value, toWh=$("toWh").value;
  if(!fromWh||!toWh) return show("اختر المستودعات",false);
  if(fromWh===toWh) return show("يجب اختلاف المستودعين",false);
  const ls=lines(); if(!ls.length) return show("أضف بنود",false);
  const memoId=await upsert("stockMemos",null,{type:"transfer",date,day,fromWh,toWh,lines:ls});
  for(const l of ls){
    await upsert("moves",null,{itemId:l.itemId,dir:"out",qty:l.qty,date,day,note:l.note||"مناقلة",warehouseId:fromWh,source:"transfer",refId:memoId});
    await upsert("moves",null,{itemId:l.itemId,dir:"in",qty:l.qty,date,day,note:l.note||"مناقلة",warehouseId:toWh,source:"transfer",refId:memoId});
  }
  show("تم الحفظ ✅",true);
  document.querySelector("#lines").innerHTML=""; add();
}
document.addEventListener("click",(e)=>{ const rm=e.target.closest('button[data-act="rm"]'); if(rm){ rm.closest("tr").remove(); if(!document.querySelector("#lines tr")) add(); } });
document.addEventListener("change",(e)=>{ if(e.target.matches('select[data-k="item"]')) setUom(e.target.closest("tr")); });
$("addBtn").onclick=add; $("saveBtn").onclick=save;
$("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value);
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
(async()=>{
  items=await listDocs("items").catch(()=>[]);
  whs=await listDocs("warehouses").catch(()=>[]);
  if(!whs.length){ await upsert("warehouses",null,{name:"المستودع الرئيسي",active:true,isDefault:true}); whs=await listDocs("warehouses").catch(()=>[]); }
  add();
})();
