const CACHE='airbeat2027-v7';
const ASSETS=['./','./index.html','./style-v7.css?v=7','./app-v7.js?v=7','./manifest.json?v=7','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;

  if(e.request.url.includes('config.js')){
    e.respondWith(fetch(e.request,{cache:'no-store'}));
    return;
  }

  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r || caches.match('./index.html')))
  );
});
