import { db } from "./firebase.js";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, limit, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
export async function listDocs(colName, ord="createdAt", max=400){
  const q=query(collection(db,colName), orderBy(ord,"desc"), limit(max));
  const s=await getDocs(q);
  return s.docs.map(d=>({id:d.id, ...d.data()}));
}

export async function putDoc(colName, id, data){
  await setDoc(doc(db,colName,id), {...data, updatedAt:serverTimestamp(), createdAt:data.createdAt||serverTimestamp()});
  return id;
}

export async function upsert(colName, id, data){
  if(id){ await updateDoc(doc(db,colName,id), {...data, updatedAt:serverTimestamp()}); return id; }
  const ref=await addDoc(collection(db,colName), {...data, createdAt:serverTimestamp(), updatedAt:serverTimestamp()});
  return ref.id;
}
export async function setById(colName, id, data){
  await setDoc(doc(db,colName,id), {...data, updatedAt:serverTimestamp()}, {merge:true});
  return id;
}
export async function removeDoc(colName, id){ await deleteDoc(doc(db,colName,id)); }
export async function getOne(colName, id){
  const s=await getDoc(doc(db,colName,id));
  return s.exists()? ({id:s.id, ...s.data()}): null;
}
export async function findByField(colName, field, value, max=50){
  const q=query(collection(db,colName), where(field,"==",value), limit(max));
  const s=await getDocs(q);
  return s.docs.map(d=>({id:d.id, ...d.data()}));
}
