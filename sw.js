// Cobros: guarda la app para que abra sin internet y recibe los avisos de pago
const V="cobros-v4";
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
// Avisos (notificaciones push)
self.addEventListener("push",e=>{
  let j={};try{j=e.data.json()}catch(x){}
  const d=j.data||{},n=j.notification||{};
  const titulo=d.title||n.title||"Cobros",cuerpo=d.body||n.body||"";
  e.waitUntil(self.registration.showNotification(titulo,{body:cuerpo,icon:"icon-192.png",badge:"icon-192.png",data:{url:d.url||self.registration.scope}}));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||self.registration.scope;
  e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{
    for(const w of ws){if(w.url.startsWith(self.registration.scope)&&"focus" in w){if("navigate" in w)w.navigate(url);return w.focus()}}
    return self.clients.openWindow(url);
  }));
});
