const V="album-ledger-0.79.5",SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
  if(u.hostname==="musicbrainz.org"||u.hostname==="api.discogs.com")return; // always live
  if(u.origin===location.origin){ // the app: network first, cache when offline
    const key=e.request.mode==="navigate"?"index.html":e.request; // shared links open the app with a query: keep one cached copy
    e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{const cp=r.clone();if(r.ok)caches.open(V).then(c=>c.put(key,cp));return r;}).catch(()=>caches.match(key).then(r=>r||caches.match("index.html"))));return;}
  // covers and fonts: cache first
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r;})));});
