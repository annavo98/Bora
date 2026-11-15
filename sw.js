// Service Worker: alles aus precache.json vorab speichern, dann offline aus dem Cache.
// VERSION wird von tools/make_manifest.py hochgezählt, damit iOS neue Stände lädt.
const VERSION = '2b457a3bc4';
const CACHE = 'bora-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const list = await (await fetch('precache.json', { cache: 'no-store' })).json();
    const c = await caches.open(CACHE);
    // in kleinen Gruppen laden, damit ein Fehler nicht alles abbricht
    for (let i = 0; i < list.files.length; i += 20) {
      await Promise.all(list.files.slice(i, i + 20).map(f => c.add(new Request(f, { cache: 'reload' })).catch(err => console.warn('SW cache', f, err))));
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const url = new URL(req.url);
    url.search = '';
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await c.match('index.html'));
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') c.put(url.href, res.clone());
      return res;
    } catch (err) {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
