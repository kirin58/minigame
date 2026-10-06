/* minigames service worker — เปิดเว็บครั้งเดียว (มีเน็ต) แล้วเล่นออฟไลน์ได้ทุกเกม
   install: ดาวน์โหลดทุกหน้า + ไฟล์ js/css ของหน้านั้นเก็บใน cache
   หน้าเว็บ: network-first, พังแล้ว fallback ไป cache (/offline)
   ไฟล์ static: stale-while-revalidate ทั้งหมด same-origin ล้วน */
const CACHE = "minigames-v2";

// ต้องตรงกับ slug ใน lib/games.ts
const PAGES = [
  "/",
  "/offline",
  "/games/snake",
  "/games/tictactoe",
  "/games/memory",
  "/games/2048",
  "/games/minesweeper",
  "/games/breakout",
  "/games/simon",
  "/games/whack",
  "/games/rps",
  "/games/hangman",
  "/games/guess",
  "/games/reaction",
];

const STATIC_FILES = ["/manifest.webmanifest", "/icon.svg"];

async function putIfOk(cache, url) {
  try {
    if (await cache.match(url)) return;
    const res = await fetch(url);
    if (res.ok) await cache.put(url, res);
  } catch {
    /* ออฟไลน์/ไฟล์ไม่มี: ข้าม */
  }
}

async function precacheAll() {
  const cache = await caches.open(CACHE);
  for (const u of STATIC_FILES) await putIfOk(cache, u);

  for (const page of PAGES) {
    try {
      const res = await fetch(page);
      if (!res.ok) continue;
      // อ่าน html หาไฟล์ js/css ของหน้านั้น (/_next/...) แล้วโหลดเก็บด้วย
      const html = await res.clone().text();
      await cache.put(page, res);
      const urls = new Set();
      const re = /(?:src|href)="(\/[^"]+\.(?:js|css))"/g;
      let m;
      while ((m = re.exec(html)) !== null) urls.add(m[1]);
      await Promise.all([...urls].map((u) => putIfOk(cache, u)));
    } catch {
      /* หน้านี้โหลดไม่ได้: ข้าม */
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
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
          caches.match(request).then((m) => m || caches.match("/offline"))
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
