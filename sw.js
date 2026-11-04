// Service worker: aplikacja działa offline po pierwszym otwarciu.
// Po zmianie plików podbij numer wersji, żeby telefon pobrał nową wersję.
const CACHE = 'silownia-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './sync.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Najpierw sieć (świeża wersja z GitHub Pages), a bez internetu wersja z pamięci.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // SDK Firebase ma wersję w adresie, więc wystarczy raz pobrać i trzymać w pamięci (działa offline)
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(event.request, copy));
      return res;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    // no-cache: zawsze pytamy GitHub o świeżą wersję (Pages każe trzymać pliki 10 min)
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
  );
});
