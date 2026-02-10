import { requireSession, hasPerm } from "./session.js";
import { upsert, listDocs, removeDoc } from "./data.js";
import { fmt, todayISO, dayNameFromISO } from "./ui.js";
const s=requireSession(); if(!hasPerm(s,"manufacturing")) location.href="dashboard.html";
const $=id=>document.getElementById(id);
let editing=null, cache=[];
function show(m,ok=false){const el=$("msg");el.textContent=m||"";el.className="notice "+(ok?"ok":"err");el.style.display=m?"block":"none";}
function calc(){
  const sum=(id)=>[...document.querySelectorAll(`#${id} tr`)].reduce((a,r)=>a+Number(r.querySelector('[data-k="amt"]').value||0),0);
  const a=sum("rawLines"), b=sum("expLines"), c=sum("fgLines");
  $("tRaw").textContent=fmt(a); $("tExp").textContent=fmt(b); $("tFg").textContent=fmt(c); $("tAll").textContent=fmt(a+b+c);
}
function row(){return `<tr><td><input class="input" data-k="desc" placeholder="بيان"></td><td><input class="input" data-k="amt" type="number" step="0.01" value="0"></td><td><button class="btn sm danger" data-act="rm">حذف</button></td></tr>`;}
function ensureOne(id){ if(!document.querySelector(`#${id} tr`)) document.getElementById(id).insertAdjacentHTML("beforeend",row()); }
function clear(){
  editing=null; $("name").value=""; $("date").value=todayISO(); $("day").textContent=dayNameFromISO($("date").value);
  ["rawLines","expLines","fgLines"].forEach(id=>document.getElementById(id).innerHTML="");
  ["rawLines","expLines","fgLines"].forEach(id=>document.getElementById(id).insertAdjacentHTML("beforeend",row()));
  $("saveBtn").textContent="حفظ"; calc();
}
function collect(id){
  return [...document.querySelectorAll(`#${id} tr`)].map(r=>({desc:r.querySelector('[data-k="desc"]').value.trim(),amt:Number(r.querySelector('[data-k="amt"]').value||0)})).filter(x=>x.desc&&x.amt>0);
}
async function load(){
  cache=await listDocs("costCards").catch(()=>[]);
  $("rows").innerHTML = cache.map(c=>`<tr><td>${c.date||""}</td><td>${c.name||""}</td><td>${fmt(c.total||0)}</td><td style="white-space:nowrap"><button class="btn sm" data-act="edit" data-id="${c.id}">تعديل</button><button class="btn sm danger" data-act="del" data-id="${c.id}">حذف</button></td></tr>`).join("") || `<tr><td colspan="4" class="notice">لا توجد بطاقات</td></tr>`;
}
async function save(){
  const name=$("name").value.trim(); if(!name) return show("اكتب اسم بطاقة التكاليف");
  const date=$("date").value||todayISO(); const day=dayNameFromISO(date);
  const raw=collect("rawLines"), exp=collect("expLines"), fg=collect("fgLines");
  const tRaw=raw.reduce((a,x)=>a+x.amt,0), tExp=exp.reduce((a,x)=>a+x.amt,0), tFg=fg.reduce((a,x)=>a+x.amt,0);
  const total=tRaw+tExp+tFg;
  const id=await upsert("costCards",editing,{name,date,day,raw,exp,fg,tRaw,tExp,tFg,total});
  show("تم حفظ بطاقة التكاليف ✅ رقم: "+id,true); clear(); load();
}
async function del(id){ if(!confirm("تأكيد حذف؟")) return; await removeDoc("costCards",id); show("تم الحذف ✅",true); load(); }
document.addEventListener("input",(e)=>{ if(e.target.matches('[data-k="amt"]')) calc();});
document.addEventListener("click",(e)=>{
  const rm=e.target.closest('button[data-act="rm"]');
  if(rm){ rm.closest("tr").remove(); ["rawLines","expLines","fgLines"].forEach(ensureOne); calc(); }
  const ed=e.target.closest('button[data-act="edit"]');
  if(ed){
    const c=cache.find(x=>x.id===ed.dataset.id); if(!c) return;
    editing=c.id; $("name").value=c.name||""; $("date").value=c.date||todayISO(); $("day").textContent=c.day||dayNameFromISO($("date").value);
    ["rawLines","expLines","fgLines"].forEach(id=>document.getElementById(id).innerHTML="");
    const fill=(id,arr)=>{ (arr||[]).forEach(l=>{ document.getElementById(id).insertAdjacentHTML("beforeend",row()); const r=document.querySelector(`#${id} tr:last-child`); r.querySelector('[data-k="desc"]').value=l.desc||""; r.querySelector('[data-k="amt"]').value=l.amt||0; }); ensureOne(id); };
    fill("rawLines",c.raw); fill("expLines",c.exp); fill("fgLines",c.fg);
    $("saveBtn").textContent="تحديث"; calc();
  }
  const dl=e.target.closest('button[data-act="del"]'); if(dl) del(dl.dataset.id);
});
$("saveBtn").onclick=save; $("resetBtn").onclick=clear;
$("date").addEventListener("change",()=> $("day").textContent=dayNameFromISO($("date").value));
clear(); load();
