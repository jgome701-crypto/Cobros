// Cobros: guarda la app para que abra aunque no haya internet
const V="cobros-v3";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==V)await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url),mismo=u.origin===self.location.origin;
  if(!mismo&&u.hostname!=="www.gstatic.com")return; // Firestore y el login no se tocan
  e.respondWith((async()=>{
    const c=await caches.open(V);
    try{const n=await fetch(r);if(n&&n.ok)c.put(r,n.clone());return n}
    catch(x){const m=await c.match(r,{ignoreSearch:mismo});if(m)return m;throw x}
  })());
});
