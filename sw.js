// Caché de imágenes de Ceiba moda: carga instantánea desde el dispositivo y
// revalida en segundo plano (ETag), así una foto cambiada se actualiza sola.
const CACHE = 'lc-img-v1', MAX = 300;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.destination !== 'image') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(r.url);
    const fresh = () => fetch(r.url, { mode: 'cors', cache: 'no-cache' }).then(async res => {
      if (res.ok) {
        await c.put(r.url, res.clone());
        const ks = await c.keys();
        if (ks.length > MAX) await Promise.all(ks.slice(0, ks.length - MAX).map(k => c.delete(k)));
      }
      return res;
    });
    if (hit) { e.waitUntil(fresh().catch(() => {})); return hit; }
    try { return await fresh(); } catch (_) { return fetch(r); }
  })());
});
