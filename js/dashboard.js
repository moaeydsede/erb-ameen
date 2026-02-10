import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { requireSession, clearSession, hasPerm } from "./session.js";
import { icon } from "./ui.js";

const session = requireSession();
const $ = (id)=>document.getElementById(id);

function setText(id, v){ const el=$(id); if(el) el.textContent = v; }

function showSectionByPerm(sectionId, permKey){
  const el = document.querySelector(`[data-section="${sectionId}"]`);
  if(!el) return;
  el.style.display = hasPerm(session, permKey) ? "block" : "none";
}

function buildTopPills(){
  const pills = [
    {key:"company", label:"بيانات الشركة", perm:"company", href:"company.html", ic:"settings"},
    {key:"accounts", label:"الحسابات", perm:"accounts", href:"accounts.html", ic:"doc"},
    {key:"invoices", label:"الفواتير", perm:"invoices", href:"invoices.html", ic:"doc"},
    {key:"inventory", label:"المواد", perm:"inventory", href:"inventory.html", ic:"doc"},
    {key:"manufacturing", label:"التصنيع", perm:"manufacturing", href:"manufacturing.html", ic:"doc"},
    {key:"vouchers", label:"السندات", perm:"vouchers", href:"vouchers.html", ic:"money"},
    {key:"reports", label:"التقارير", perm:"reports", href:"reports.html", ic:"chart"},
    {key:"cfo", label:"CFO", perm:"cfo", href:"cfo.html", ic:"chart"},
  ];
  const nav = $("nav");
  nav.innerHTML = "";
  for(const p of pills){
    if(!hasPerm(session, p.perm)) continue;
    const a = document.createElement("a");
    a.className = "pill";
    a.href = p.href;
    a.innerHTML = `${icon(p.ic)} <span>${p.label}</span>`;
    nav.appendChild(a);
  }
}

function tile(title, desc, href){
  const d = document.createElement("div");
  d.className="tile";
  d.tabIndex=0;
  d.onclick=()=>location.href=href;
  d.onkeydown=(e)=>{ if(e.key==="Enter") location.href=href; };
  d.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
  return d;
}

async function loadCompany(){
  const ref = doc(db, "company", "main");
  const snap = await getDoc(ref);
  if(!snap.exists()) return null;
  return snap.data();
}

async function init(){
  setText("user", session.username);
  buildTopPills();

  // Sections visibility (groups)
  showSectionByPerm("company", "company");
  showSectionByPerm("accounts", "accounts");
  showSectionByPerm("invoices", "invoices");
  showSectionByPerm("inventory", "inventory");
  showSectionByPerm("manufacturing", "manufacturing");
  showSectionByPerm("vouchers", "vouchers");
  showSectionByPerm("reports", "reports");
  showSectionByPerm("cfo", "cfo");

  // Company card
  try{
    const company = await loadCompany();
    if(company){
      setText("companyName", company.name || "ERP PRO");
      setText("baseCurrency", company.baseCurrency || "—");
      setText("multiCurrency", company.multiCurrency ? "مفعل" : "غير مفعل");
      setText("pricingPolicy", company.pricingPolicy || "—");
      setText("lang", company.language || "ar");
    }
  }catch(e){
    console.error(e);
  }

  // Quick tiles
  const groups = {
    company: {perm:"company", holder:"tilesCompany", tiles:[
      ["بيانات الشركة", "إدارة اسم الشركة والعملة واللغة والشعار", "company.html"],
      ["المستخدمين والصلاحيات", "إضافة مستخدمين وتحديد الصلاحيات", "users.html"],
    ]},
    accounts:{perm:"accounts", holder:"tilesAccounts", tiles:[
      ["دليل الحسابات", "الحسابات + الإضافة + الهيكلة", "accounts.html"],
      ["دفتر الأستاذ", "حركة الحسابات بالتفصيل", "ledger.html"],
      ["ميزان المراجعة", "مدين / دائن / رصيد", "trial-balance.html"],
      ["تقرير الأرصدة", "أرصدة العملاء والموردين", "balances.html"],
    ]},
    invoices:{perm:"invoices", holder:"tilesInvoices", tiles:[
      ["فواتير المبيعات", "بيع + خصم ممنوح + قيد تلقائي", "sales.html"],
      ["مرتجع مبيعات", "إرجاع مبيعات + قيود", "sales-return.html"],
      ["فواتير المشتريات", "شراء + خصم مكتسب", "purchase.html"],
      ["مرتجع مشتريات", "إرجاع مشتريات", "purchase-return.html"],
    ]},
    vouchers:{perm:"vouchers", holder:"tilesVouchers", tiles:[
      ["سند قبض", "قبض من عميل أو أكثر", "receipt.html"],
      ["سند دفع", "دفع لمورد أو أكثر", "payment.html"],
      ["سند يومية", "قيد يومية (مدفوعات/مقبوضات)", "journal.html"],
      ["تحويل عملات", "سعر صرف + مكافئ", "fx.html"],
    ]},
    inventory:{perm:"inventory", holder:"tilesInventory", tiles:[
      ["المواد", "تعريف المواد وسياسة التسعير", "inventory.html"],
      ["حركة مادة", "كل حركات الدخول/الخروج", "item-movement.html"],
      ["جرد مواد", "تسوية مخزون + قيود", "stock-count.html"],
      ["COGS", "تكلفة البضاعة المباعة", "cogs.html"],
    ]},
    manufacturing:{perm:"manufacturing", holder:"tilesMfg", tiles:[
      ["بطاقة تكاليف", "مواد أولية + مصاريف + جاهز", "cost-card.html"],
      ["أوامر إنتاج", "إنتاج + تكلفة الوحدة", "production.html"],
      ["مراكز تكلفة", "توزيع مصاريف التصنيع", "cost-centers.html"],
    ]},
    reports:{perm:"reports", holder:"tilesReports", tiles:[
      ["التقارير", "طباعة PDF + تصدير", "reports.html"],
    ]},
    cfo:{perm:"cfo", holder:"tilesCfo", tiles:[
      ["تقارير CFO", "لوحة المدير المالي (Admin فقط)", "cfo.html"],
    ]},
  };

  for(const k of Object.keys(groups)){
    const g = groups[k];
    const holder = document.getElementById(g.holder);
    if(!holder) continue;
    holder.innerHTML="";
    if(!hasPerm(session, g.perm)) continue;
    for(const t of g.tiles){
      holder.appendChild(tile(t[0], t[1], t[2]));
    }
  }
}

window.erpLogout = async function(){
  try{ await signOut(auth); }catch(e){ console.error(e); }
  clearSession();
  location.href="index.html";
};

init();
