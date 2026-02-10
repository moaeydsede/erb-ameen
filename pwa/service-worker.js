const CACHE="erp-pro-v2";
const CORE=[
  "./","./index.html","./dashboard.html",
  "./company.html","./users.html","./firebase-setup.html",
  "./accounts.html","./customers.html","./suppliers.html",
  "./inventory.html","./sales.html","./receipt.html","./journal.html",
  "./trial-balance.html","./cfo.html",
  "./css/style.css",
  "./js/config.js","./js/firebase.js","./js/session.js","./js/ui.js","./js/data.js",
  "./js/login.js","./js/nav.js","./js/dashboard.js",
  "./js/company.js","./js/users.js",
  "./js/accounts.js","./js/parties.js",
  "./js/inventory.js","./js/invoice-sales.js",
  "./js/voucher-receipt.js","./js/journal.js",
  "./js/trial-balance.js","./js/cfo.js"
];
self.addEventListener("install",(e)=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",(e)=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",(e)=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
