import { requireSession, hasPerm, clearSession } from "./session.js";
import { icon } from "./ui.js";
const s=requireSession();
const userChip=document.getElementById("userChip");
const logoutBtn=document.getElementById("logoutBtn");
const groupsEl=document.getElementById("groups");
const overlay=document.getElementById("overlay");
const menu=document.getElementById("menu");
const menuTitle=document.getElementById("menuTitle");
const menuBody=document.getElementById("menuBody");
const menuClose=document.getElementById("menuClose");
const bottom=document.getElementById("bottomNav");
if(userChip) userChip.textContent=s.username;
if(logoutBtn) logoutBtn.onclick=()=>{clearSession();location.href="index.html"};
const GROUPS=[
 {label:"بيانات الشركة",ico:"building",perm:"company",items:[
  {href:"company.html",label:"بيانات الشركة",sub:"اللغة + العملة + التسعير",ico:"building",perm:"company"},
  {href:"users.html",label:"المستخدمين والصلاحيات",sub:"تحديد الصلاحيات من داخل البرنامج",ico:"users",perm:"users_manage"},
  {href:"firebase-setup.html",label:"إعداد Firebase",sub:"الكود + Rules",ico:"chart",perm:"users_manage"},
 ]},
 {label:"حسابات",ico:"book",perm:"accounts",items:[
  {href:"accounts.html",label:"دليل الحسابات",sub:"إضافة/تعديل/بحث",ico:"book",perm:"accounts"},
  {href:"customers.html",label:"العملاء",sub:"إدارة العملاء",ico:"users",perm:"accounts"},
  {href:"suppliers.html",label:"الموردين",sub:"إدارة الموردين",ico:"users",perm:"accounts"},
 ]},
 {label:"فواتير",ico:"file",perm:"invoices",items:[
  {href:"sales.html",label:"فواتير مبيعات",sub:"بنود + خصم + COGS",ico:"file",perm:"invoices"},
 ]},
 {label:"التصنيع",ico:"factory",perm:"manufacturing",items:[
  {href:"inventory.html",label:"المواد والمخزون",sub:"حركة مادة + جرد",ico:"factory",perm:"manufacturing"},
 ]},
 {label:"سندات",ico:"receipt",perm:"vouchers",items:[
  {href:"receipt.html",label:"سند قبض",sub:"متعدد الحسابات",ico:"receipt",perm:"vouchers"},
  {href:"journal.html",label:"سند اليومية",sub:"مدفوعات/مقبوضات",ico:"receipt",perm:"vouchers"},
 ]},
 {label:"تقارير",ico:"chart",perm:"reports",items:[
  {href:"trial-balance.html",label:"ميزان المراجعة",sub:"مدين/دائن/رصيد",ico:"chart",perm:"reports"},
  {href:"cfo.html",label:"تقارير CFO",sub:"للأدمن فقط",ico:"chart",perm:"cfo"},
 ]},
];
const can=p=>{
  if(!p) return true;
  if(p==="users_manage") return s.role==="admin";
  return hasPerm(s,p);
};
function openMenu(g){
  menuTitle.textContent=g.label; menuBody.innerHTML="";
  g.items.forEach(it=>{
    if(!can(it.perm)) return;
    const a=document.createElement("a"); a.className="item"; a.href=it.href;
    a.innerHTML=`<div class="left"><div class="chip" style="border-radius:14px;padding:8px">${icon(it.ico)}</div><div><div style="font-weight:800">${it.label}</div><div class="sub">${it.sub||""}</div></div></div><div style="opacity:.9">${icon("chev")}</div>`;
    menuBody.appendChild(a);
  });
  overlay.classList.add("show"); menu.classList.add("show");
}
function closeMenu(){overlay.classList.remove("show"); menu.classList.remove("show");}
if(menuClose) menuClose.onclick=closeMenu;
if(overlay) overlay.onclick=closeMenu;
function renderGroups(){
  if(!groupsEl) return;
  groupsEl.innerHTML="";
  GROUPS.forEach(g=>{
    if(!can(g.perm)) return;
    const b=document.createElement("div"); b.className="groupbtn";
    b.innerHTML=`${icon(g.ico)}<span>${g.label}</span>${icon("chev")}`;
    b.onclick=()=>openMenu(g);
    groupsEl.appendChild(b);
  });
}
function current(){return (location.pathname.split("/").pop()||"").toLowerCase();}
function renderBottom(){
  if(!bottom) return;
  const items=[
    {href:"dashboard.html",label:"الرئيسية"},
    {href:"accounts.html",label:"الحسابات",perm:"accounts"},
    {href:"sales.html",label:"الفواتير",perm:"invoices"},
    {href:"receipt.html",label:"السندات",perm:"vouchers"},
    {href:"trial-balance.html",label:"التقارير",perm:"reports"},
  ];
  bottom.innerHTML="";
  items.forEach(it=>{
    if(it.perm && !can(it.perm)) return;
    const a=document.createElement("a"); a.href=it.href; a.textContent=it.label;
    if(current()===it.href.toLowerCase()) a.classList.add("active");
    bottom.appendChild(a);
  });
}
renderGroups(); renderBottom();
