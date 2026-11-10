// Service worker di Politis-IT: rende il gioco installabile come app e giocabile anche offline.
// La pagina del gioco si scarica SEMPRE prima dalla rete (così chi ha l'app riceve subito ogni
// aggiornamento) e solo se la rete manca si usa la copia salvata. Le immagini e le icone si servono
// dalla cache e si aggiornano in background. I salvataggi della partita restano in localStorage,
// questo file non li tocca mai.
var CACHE = "politis-it-v1";
var CORE = ["./", "./index.html", "./logo.png", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (isPage) {
    e.respondWith(fetch(req, { cache: "no-store" }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put("./index.html", copy); }); }
      return res;
    }).catch(function () {
      return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (cached) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return cached; });
    return cached || net;
  }));
});
