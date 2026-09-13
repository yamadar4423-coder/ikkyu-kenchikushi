/* 一級建築士 学習ノート オフライン用 Service Worker
   公開のたびに VERSION を上げる（tools/publish.sh が自動で上げます） */
var VERSION = 'v3';
var CACHE = 'ikkyu-' + VERSION;

var ASSETS = [
  './',
  './index.html',
  './formulas.html',
  './past-exams.html',
  './structure/mechanics/S00.html',
  './assets/app.css',
  './assets/app.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 同一オリジンの GET だけ扱う。
   キャッシュを即返しつつ裏で更新する（stale-while-revalidate）。
   更新は次に開いたときに反映される。 */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') c.put(req, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    })
  );
});
