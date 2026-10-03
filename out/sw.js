/* minigames service worker — ทำให้เล่นออฟไลน์ได้หลังเปิดครั้งแรก
   กลยุทธ์: หน้าเว็บใช้ network-first (fallback ไป cache /offline),
   ไฟล์ static ใช้ stale-while-revalidate ทั้งหมดเป็น same-origin ล้วน */
const CACHE = "minigames-v1";
const CORE = ["/", "/offline", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // หน้าเว็บ: เน็ตก่อน พังแล้วค่อยใช้ cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((m) => m || caches.match("/offline"))
        )
    );
    return;
  }

  // ไฟล์ static/js/css: ตอบจาก cache ทันที แล้วแอบอัปเดตเบื้องหลัง
  event.respondWith(
    caches.match(request).then((hit) => {
      const net = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
