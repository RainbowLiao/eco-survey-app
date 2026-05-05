const CACHE_NAME = 'eco-survey-v2';
const MAP_CACHE = 'eco-map-tiles'; // 專門用來放地圖圖資的百寶箱

const urlsToCache = [
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.0/proj4.js',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // 【核心升級】如果是去跟 Google 或是 OSM 請求地圖圖片
  if (url.includes('google.com/vt') || url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        // 如果手機記憶體裡已經有這張圖（例如在山下有先滑過），就直接拿出來用，免網路！
        if (cachedResponse) {
          return cachedResponse;
        }
        // 如果記憶體沒有，就去網路上抓
        return fetch(event.request).then(networkResponse => {
          // 抓到之後，順手把它存進百寶箱裡，下次斷網就能用了
          return caches.open(MAP_CACHE).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // 其他一般檔案的預設邏輯
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
