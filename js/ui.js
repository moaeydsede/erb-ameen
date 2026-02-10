export function fmt(n){const x=Number(n||0);return x.toLocaleString("ar-EG",{minimumFractionDigits:2,maximumFractionDigits:2});}
export function todayISO(){const d=new Date(),z=v=>String(v).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;}
export function dayNameFromISO(iso){try{const [y,m,dd]=iso.split("-").map(Number);return new Date(y,m-1,dd).toLocaleDateString("ar-EG",{weekday:"long"});}catch{return""}}
export function icon(name){
  const c='stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const m={
    chev:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M9 18l6-6-6-6"/></svg>`,
    building:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`,
    book:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M4 19a2 2 0 0 0 2 2h14"/><path d="M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2z"/></svg>`,
    file:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
    factory:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M3 21V10l6 4V10l6 4V7l6 4v10z"/><path d="M3 21h18"/></svg>`,
    receipt:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>`,
    chart:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M3 3v18h18"/><path d="M7 15v3"/><path d="M11 11v7"/><path d="M15 7v11"/><path d="M19 10v8"/></svg>`,
    users:`<svg width="18" height="18" viewBox="0 0 24 24" ${c}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="3"/><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a3 3 0 0 1 0 5.74"/></svg>`
  };
  return m[name]||"";
}
