
import { requireSession, hasPerm } from "./session.js";
import { listDocs, upsert } from "./data.js";
import { todayISO, dayNameFromISO, fmt } from "./ui.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const s = requireSession();
if(!hasPerm(s,"vouchers")) location.href="dashboard.html";

const $ = (id)=>document.getElementById(id);

let accounts=[], cheques=[];

function notice(msg, ok=false){
  const el=$("msg");
  if(!el) return;
  el.textContent = msg||"";
  el.className = "notice "+(ok?"ok":"err");
  el.style.display = msg? "block":"none";
}

function statusLabel(st){
  const map={
    pending:"متبقي",
    endorsed:"مُظهَّر",
    deposited:"مُودَع",
    cleared:"محصَّل/مُسدَّد",
    bounced:"مرتجع/مرفوض",
    cancelled:"ملغي"
  };
  return map[st]||st||"—";
}

function chip(st){
  const cls = (st==="cleared")?"ok":(st==="bounced"?"err":"");
  return `<span class="chip ${cls}">${statusLabel(st)}</span>`;
}

function partyNameById(id){
  const a=accounts.find(x=>x.id===id);
  return a? `${a.code||""} - ${a.name||""}` : "";
}

async function getCompany(){
  try{
    const snap=await getDoc(doc(db,"company","main"));
    return snap.exists()? snap.data(): {};
  }catch(e){ return {}; }
}

function pickDefaultAccountId(company, kind){
  const mapKey = {
    cash:"cashAccountId",
    bank:"bankAccountId",
    notesReceivable:"notesReceivableId",
    notesPayable:"notesPayableId"
  }[kind];
  if(company && company[mapKey]) return company[mapKey];

  const kw = {
    cash:["صندوق","نقد","Cash"],
    bank:["بنك","Bank"],
    notesReceivable:["أوراق قبض","شيكات قبض","كمبيالات قبض"],
    notesPayable:["أوراق دفع","شيكات دفع","كمبيالات دفع"]
  }[kind] || [];
  for(const a of accounts){
    const n=String(a.name||"");
    if(kw.some(k=>n.includes(k))) return a.id;
  }
  if(kind==="cash"||kind==="bank"){
    const a=accounts.find(a=>a.type==="asset"); if(a) return a.id;
  }
  if(kind==="notesPayable"){
    const a=accounts.find(a=>a.type==="liability"); if(a) return a.id;
  }
  return "";
}

function buildRow(c){
  const type = c.type || "قبض";
  const who = c.party || partyNameById(c.partyId) || "";
  const to = c.endorsedToName ? `<div class="muted">إلى: ${c.endorsedToName}</div>` : "";
  const st = c.status || "pending";
  return `<tr>
    <td><b>${c.number||""}</b><div class="muted">${c.bank||""}</div></td>
    <td>${type}</td>
    <td>${who}${to}</td>
    <td>${c.receiveDate||""}<div class="muted">${c.dueDate||""}</div></td>
    <td><b>${fmt(c.amount||0)}</b></td>
    <td>${chip(st)}</td>
    <td class="no-print">
      <button class="btn sm" data-act="endorse" data-id="${c.id}">تظهير</button>
      <button class="btn sm" data-act="deposit" data-id="${c.id}">إيداع</button>
      <button class="btn sm" data-act="clear" data-id="${c.id}">تحصيل/سداد</button>
      <button class="btn sm danger" data-act="bounce" data-id="${c.id}">مرتجع</button>
      <button class="btn sm danger" data-act="cancel" data-id="${c.id}">إلغاء</button>
    </td>
  </tr>`;
}

function render(){
  const q = (($("q")?.value)||"").trim();
  const st = ($("st")?.value)||"all";
  const type = ($("type")?.value)||"all";
  const rows = cheques
    .filter(c => st==="all" || (c.status||"pending")===st)
    .filter(c => type==="all" || (c.type||"")===type)
    .filter(c => !q || String(c.number||"").includes(q) || String(c.bank||"").includes(q) || String(c.party||"").includes(q) || String(c.endorsedToName||"").includes(q))
    .sort((a,b)=>String(b.dueDate||"").localeCompare(String(a.dueDate||"")));

  const pending = cheques.filter(c=>(c.status||"pending")==="pending");
  const dueSoon = (()=>{ 
    const now=new Date(); now.setHours(0,0,0,0);
    const till=new Date(now); till.setDate(till.getDate()+7);
    return cheques.filter(c=>{
      const st=(c.status||"pending");
      if(st==="cleared"||st==="cancelled") return false;
      if(!c.dueDate) return false;
      const dd=new Date(c.dueDate+"T00:00:00");
      return dd>=now && dd<=till;
    });
  })();

  if($("kpi")) $("kpi").innerHTML = `<div class="row">
    <div class="card"><div class="card-body"><div class="section-title">متبقي</div><div class="h2">${pending.length}</div><div class="muted">${fmt(pending.reduce((a,c)=>a+Number(c.amount||0),0))}</div></div></div>
    <div class="card"><div class="card-body"><div class="section-title">مستحق خلال 7 أيام</div><div class="h2">${dueSoon.length}</div><div class="muted">${fmt(dueSoon.reduce((a,c)=>a+Number(c.amount||0),0))}</div></div></div>
    <div class="card"><div class="card-body"><div class="section-title">الإجمالي</div><div class="h2">${cheques.length}</div></div></div>
  </div>`;

  $("rows").innerHTML = rows.map(buildRow).join("") || `<tr><td colspan="7" class="notice">لا يوجد بيانات</td></tr>`;
}

function formData(){
  return {
    type: $("f_type").value,
    number: ($("f_number").value||"").trim(),
    amount: Number($("f_amount").value||0),
    bank: ($("f_bank").value||"").trim(),
    partyId: $("f_party").value||"",
    party: partyNameById($("f_party").value)||"",
    receiveDate: $("f_receive").value||todayISO(),
    dueDate: $("f_due").value||todayISO(),
    status: "pending",
    note: ($("f_note").value||"").trim(),
    day: dayNameFromISO($("f_receive").value||todayISO())
  };
}

async function save(){
  const d=formData();
  if(!d.number) return notice("أدخل رقم الشيك", false);
  if(d.amount<=0) return notice("أدخل قيمة الشيك", false);
  if(!d.partyId) return notice("اختر العميل/المورد", false);
  await upsert("cheques", null, d);
  notice("تم الحفظ ✅", true);
  await load();
}

async function createVoucherFromCheque(c){
  const company = await getCompany();
  const amount = Number(c.amount||0);
  if(amount<=0) return;

  const bankId = pickDefaultAccountId(company,"bank");
  const cashId = pickDefaultAccountId(company,"cash");
  const settleId = bankId || cashId;
  if(!settleId) return;

  const partyId = c.partyId || "";
  if(!partyId) return;

  const date = todayISO();
  const day = dayNameFromISO(date);

  let type="journal";
  let lines=[];
  let note="";
  if((c.type||"قبض")==="قبض"){
    type = "receipt";
    lines = [
      { accountId: settleId, debit: amount, credit: 0, memo: "تحصيل/إيداع شيك" },
      { accountId: partyId, debit: 0, credit: amount, memo: "تحصيل شيك - العميل" }
    ];
    note = `تحصيل شيك رقم ${c.number||""}`;
  }else{
    type = "payment";
    lines = [
      { accountId: partyId, debit: amount, credit: 0, memo: "سداد شيك - المورد" },
      { accountId: settleId, debit: 0, credit: amount, memo: "سداد شيك" }
    ];
    note = `سداد شيك رقم ${c.number||""}`;
  }
  await upsert("vouchers", null, { type, date, day, total: amount, note, lines, source:"cheques", chequeId: c.id });
}

async function endorse(id){
  const to = prompt("اكتب اسم الجهة التي سيتم تظهير الشيك لها:");
  if(!to) return;
  await upsert("cheques", id, { status:"endorsed", endorsedToName: to, endorsedAt: todayISO() });
  await load();
}
async function deposit(id){
  const c = cheques.find(x=>x.id===id); if(!c) return;
  await upsert("cheques", id, { status:"deposited", depositedAt: todayISO() });
  try{ await createVoucherFromCheque(c); }catch(e){}
  await load();
}
async function clearIt(id){
  const c = cheques.find(x=>x.id===id); if(!c) return;
  await upsert("cheques", id, { status:"cleared", clearedAt: todayISO() });
  try{ await createVoucherFromCheque(c); }catch(e){}
  await load();
}
async function bounceIt(id){
  const why = prompt("سبب الارتجاع/الرفض (اختياري):") || "";
  await upsert("cheques", id, { status:"bounced", bouncedAt: todayISO(), bounceReason: why });
  await load();
}
async function cancelIt(id){
  const why = prompt("سبب الإلغاء (اختياري):") || "";
  await upsert("cheques", id, { status:"cancelled", cancelledAt: todayISO(), cancelReason: why });
  await load();
}

async function load(){
  accounts = await listDocs("accounts").catch(()=>[]);
  cheques = await listDocs("cheques").catch(()=>[]);
  const partyOpts = accounts.filter(a=>a.type==="customer"||a.type==="supplier").sort((a,b)=>String(a.code||"").localeCompare(String(b.code||""),"ar"))
    .map(a=>`<option value="${a.id}">${a.code} - ${a.name}</option>`).join("");
  $("f_party").innerHTML = partyOpts;
  render();
}

document.addEventListener("click",(e)=>{
  const b=e.target.closest("button[data-act]");
  if(!b) return;
  const id=b.dataset.id;
  const act=b.dataset.act;
  if(act==="endorse") endorse(id);
  if(act==="deposit") deposit(id);
  if(act==="clear") clearIt(id);
  if(act==="bounce") bounceIt(id);
  if(act==="cancel") cancelIt(id);
});

$("saveBtn").onclick = save;
$("printBtn").onclick = ()=>window.print();
["q","st","type"].forEach(id=> $(id)?.addEventListener("input", render));

(async()=>{
  if($("f_receive")) $("f_receive").value = todayISO();
  if($("f_due")) $("f_due").value = todayISO();
  await load();
})();
