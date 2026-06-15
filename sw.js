/* Service Worker NUR für die Anfragen-App (admin).
   Alle anderen Seiten (Startseite, /vergleich/ usw.) werden NICHT abgefangen
   und laden ganz normal direkt aus dem Netz. */
const CACHE = "abp-anfragen-v4";
const ASSETS = [
  "admin.html",
  "admin.js?v=3",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "manifest-admin.webmanifest",
  "assets/logo%20alpha%20blueprint.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const p = url.pathname;
  // Nur Dateien der Anfragen-App offline bereitstellen
  const isApp =
    /\/admin\.html$/.test(p) ||
    /\/admin\.js$/.test(p) ||
    /\/(icon-192|icon-512|apple-touch-icon)\.png$/.test(p) ||
    /manifest-admin\.webmanifest$/.test(p);
  if (!isApp) return; // alles andere: Service Worker mischt sich NICHT ein
  e.respondWith(
    fetch(req)
      .then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })
      .catch(() => caches.match(req))
  );
});
