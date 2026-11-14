/* 苏大学士 service worker — 独立站点。嵌入 iframe 不注册。 */
'use strict';
var CACHE = 'sudx-shell-v1';
var SHELL = [
  './',
  './index.html',
  './english.html',
  './shengping.html',
  './mingjia.html',
  './zuopin.html',
  './renwu.html',
  './shenghuo.html',
  './shuhua.html',
  './minjian.html',
  './jinju.html',
  './gaokao.html',
  './rensheng.html',
  './search.html',
  './offline.html',
  './assets/css/style.css',
  './assets/js/main.js',
  './assets/js/search.js',
  './assets/js/search-index.js',
  './assets/img/su-shi.webp',
  './assets/img/su-shi.jpg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./offline.html');
      });
    })
  );
});
