
import { upsert, listDocs } from "./data.js";

// Ensure basic system accounts exist (Inventory, COGS, Sales, Purchases, AR, AP, Cash)
export async function ensureSystemAccounts(){
  const acc = await listDocs("accounts").catch(()=>[]);
  const findByCode = (code)=>acc.find(a=>String(a.code)===String(code));
  const need=[
    {code:"1100",name:"المخزون",type:"asset"},
    {code:"4100",name:"المبيعات",type:"income"},
    {code:"5100",name:"تكلفة البضاعة المباعة",type:"expense"},
    {code:"2100",name:"الموردون (ذمم دائنة)",type:"liability"},
    {code:"1200",name:"العملاء (ذمم مدينة)",type:"asset"},
    {code:"1000",name:"الصندوق/البنك",type:"asset"},
    {code:"6100",name:"المشتريات",type:"expense"}
  ];
  for(const n of need){
    if(!findByCode(n.code)){
      await upsert("accounts",null,{code:n.code,name:n.name,type:n.type,system:true});
    }
  }
  return await listDocs("accounts").catch(()=>[]);
}

export function systemAccountByCode(accounts, code){
  return accounts.find(a=>String(a.code)===String(code));
}

// Create balanced voucher (system) linked to invoice
export async function postVoucher({date,day,desc,lines,refType,refId}){
  const totalD = lines.reduce((a,l)=>a+Number(l.debit||0),0);
  const totalC = lines.reduce((a,l)=>a+Number(l.credit||0),0);
  if(Math.abs(totalD-totalC) > 0.0001) throw new Error("Voucher not balanced");
  return await upsert("vouchers",null,{type:"system",date,day,desc,lines,total:totalD,refType,refId});
}
