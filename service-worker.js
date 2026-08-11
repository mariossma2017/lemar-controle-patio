/* LEMAR Controle de Pátio — Service Worker (offline-first) */

const CACHE_VERSION = 'lemar-patio-v1';

const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/utils.js',
  './js/app.js',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((nome) => nome !== CACHE_VERSION)
            .map((nome) => caches.delete(nome))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      if (respostaCache) return respostaCache;

      return fetch(event.request)
        .then((respostaRede) => {
          if (respostaRede && respostaRede.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = respostaRede.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return respostaRede;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return undefined;
        });
    })
  );
});
