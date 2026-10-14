// Tăng số phiên bản CACHE (và APP_VERSION trong index.html) mỗi lần cập nhật app.
const CACHE = 'nhac-gia-han-v7';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

// Clone before returning: the page consumes the body, so a later clone() would throw.
function cacheCopy(key, response) {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(key, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => cacheCopy('./index.html', response))
      .catch(() => caches.match('./index.html')));
    return;
  }

  if (requestUrl.pathname.endsWith('/config.js')) {
    event.respondWith(fetch(request).then((response) => cacheCopy(request, response))
      .catch(() => caches.match(request)));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => cacheCopy(request, response))));
});
