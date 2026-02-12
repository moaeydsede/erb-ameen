
import { listDocs } from "./data.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

async function getCostPolicy(){
  try{
    const snap = await getDoc(doc(db,"company","main"));
    if(snap.exists()){
      const d=snap.data();
      return (d.costPolicy || "AVG").toUpperCase();
    }
  }catch(e){}
  return "AVG";
}

// يبني محرك تكلفة حسب السياسة: AVG أو FIFO
export async function buildCostEngine(){
  const policy = await getCostPolicy();
  const invoices = await listDocs("invoices").catch(()=>[]);
  // نحتاج فقط خطوط مشتريات ومبيعات مرتبة بالتاريخ
  const docs = invoices.slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
  // state per (wh,item)
  const avgState=new Map(); // key -> {qty,avg}
  const fifoState=new Map(); // key -> [{qty,cost}]
  const key=(wh,item)=>`${wh||""}||${item}`;

  function avgGet(wh,item){ const k=key(wh,item); if(!avgState.has(k)) avgState.set(k,{qty:0,avg:0}); return avgState.get(k); }
  function fifoGet(wh,item){ const k=key(wh,item); if(!fifoState.has(k)) fifoState.set(k,[]); return fifoState.get(k); }

  function fifoIn(q,c,arr){
    if(q<=0) return;
    arr.push({qty:q,cost:c});
  }
  function fifoOut(q,arr){
    let need=q, cost=0;
    while(need>0 && arr.length){
      const lot=arr[0];
      const take=Math.min(need, lot.qty);
      cost += take * (lot.cost||0);
      lot.qty -= take;
      need -= take;
      if(lot.qty<=0.0000001) arr.shift();
    }
    // لو لا يوجد مخزون كافي: يعامل المتبقي تكلفة صفر (مبسّط)
    return cost;
  }

  // compute cost at invoice time by applying purchases/returns then costing sales
  const costAtInvoice=new Map(); // invId -> Map(itemId->costPerUnitUsed)
  for(const inv of docs){
    const wh = inv.warehouseId || "";
    if(inv.type==="purchases"){
      for(const l of (inv.lines||[])){
        const item=l.itemId;
        const q=Number(l.qty||0);
        const c=Number(l.unitCost||l.cost||0);
        // AVG
        const s=avgGet(wh,item);
        if(q>0){
          const newQty=s.qty+q;
          const newAvg=newQty>0 ? ((s.avg*s.qty)+(c*q))/newQty : 0;
          s.qty=newQty; s.avg=newAvg;
        }
        // FIFO
        fifoIn(q,c,fifoGet(wh,item));
      }
    }else if(inv.type==="purchase-return" || inv.type==="purchase_return"){
      for(const l of (inv.lines||[])){
        const item=l.itemId; const q=Number(l.qty||0);
        // AVG: only reduce qty
        const s=avgGet(wh,item); s.qty=Math.max(0,s.qty-q);
        // FIFO: remove from earliest lots (reverse is complex; simplified out)
        fifoOut(q,fifoGet(wh,item));
      }
    }else if(inv.type==="sales" || inv.type==="sales-return" || inv.type==="sales_return"){
      const map=new Map();
      for(const l of (inv.lines||[])){
        const item=l.itemId; const q=Number(l.qty||0);
        const s=avgGet(wh,item);
        const fifo=fifoGet(wh,item);
        if(inv.type==="sales"){
          // use current policy to compute cost per unit
          if(policy==="FIFO"){
            const totalCost = fifoOut(q,fifo);
            map.set(item, q>0 ? (totalCost/q) : 0);
          }else{
            map.set(item, s.avg||0);
          }
          // reduce avg qty
          s.qty=Math.max(0,s.qty-q);
        }else{
          // sales return: add back (at current cost basis)
          if(policy==="FIFO"){
            // add back as a new lot with last known unit cost (fallback avg)
            const unit = (map.get(item) || s.avg || 0);
            fifoIn(q, unit, fifo);
            map.set(item, unit);
          }else{
            map.set(item, s.avg||0);
          }
          s.qty=s.qty+q;
        }
      }
      costAtInvoice.set(inv.id,map);
    }
  }

  return {
    policy,
    getUnitCost:(warehouseId,itemId,invoiceId=null)=>{
      if(invoiceId && costAtInvoice.has(invoiceId)){
        return costAtInvoice.get(invoiceId).get(itemId) || 0;
      }
      // fallback
      if(policy==="FIFO"){
        const arr=fifoGet(warehouseId||"",itemId);
        return arr.length? (arr[0].cost||0):0;
      }
      return avgGet(warehouseId||"",itemId).avg || 0;
    }
  };
}
