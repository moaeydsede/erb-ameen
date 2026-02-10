export function setSession(s){localStorage.setItem("erp_session",JSON.stringify(s));}
export function getSession(){try{return JSON.parse(localStorage.getItem("erp_session")||"null");}catch{return null}}
export function clearSession(){localStorage.removeItem("erp_session");}
export function requireSession(){const s=getSession(); if(!s){location.href="index.html"; return null;} return s;}
export function hasPerm(s,key){ if(!s) return false; if(s.role==="admin") return true; return !!(s.permissions&&s.permissions[key]); }
