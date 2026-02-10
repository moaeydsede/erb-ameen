export function setSession(userProfile){
  localStorage.setItem("erp_session", JSON.stringify(userProfile));
}
export function getSession(){
  try { return JSON.parse(localStorage.getItem("erp_session")||"null"); } catch { return null; }
}
export function clearSession(){
  localStorage.removeItem("erp_session");
}
export function requireSession(){
  const s = getSession();
  if(!s){ location.href="index.html"; return null; }
  return s;
}
export function hasPerm(session, key){
  if(!session) return false;
  if(session.role === "admin") return true;
  return !!(session.permissions && session.permissions[key]);
}
