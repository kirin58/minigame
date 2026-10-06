"use client";

import { useEffect, useState } from "react";

// ต้องตรงกับ public/sw.js
const CACHE_NAME = "minigames-v2";
const READY_MARK = "/__offline-ready";

type Status = "checking" | "preparing" | "ready" | "unsupported";

/** ป้ายสถานะออฟไลน์: เช็คจาก Cache API จริง ไม่ได้เดา */
export default function OfflineStatus() {
  const [s, setS] = useState<Status>("checking");

  useEffect(() => {
    let stop = false;
    let timer: number | undefined;

    async function poke() {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const worker = reg?.active ?? reg?.waiting ?? null;
        // ยังไม่มี SW เลย: ลองกระตุ้นให้ติดตั้ง
        if (!worker) {
          try {
            await navigator.serviceWorker.register("/sw.js");
          } catch {
            /* ลงไม่ได้ */
          }
          if (!stop) {
            setS("preparing");
            timer = window.setTimeout(poke, 3000);
          }
          return;
        }
        // มี SW แล้ว: สั่งโหลดซ้ำ (ข้ามไฟล์ที่มีแล้ว) แล้วเช็คหมุด
        worker.postMessage("PRECACHE");
        const cache = await caches.open(CACHE_NAME);
        const ready = await cache.match(READY_MARK);
        if (!stop) {
          if (ready) {
            setS("ready");
          } else {
            setS("preparing");
            timer = window.setTimeout(poke, 3000);
          }
        }
      } catch {
        if (!stop) setS("unsupported");
      }
    }

    if (!("serviceWorker" in navigator) || !("caches" in window)) {
      setS("unsupported");
      return;
    }
    const onChange = () => poke();
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    poke();
    return () => {
      stop = true;
      if (timer) window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
    };
  }, []);

  if (s === "unsupported") return null;

  if (s === "ready") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[13px] text-sky-800">
        <span className="h-2 w-2 rounded-full bg-sky-600" />
        <span>พร้อมเล่นออฟไลน์ ไม่ต้องใช้เน็ต</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] text-amber-800">
      <span className="anim-pulse-soft h-2 w-2 rounded-full bg-amber-500" />
      <span className="tabular">
        {s === "checking" ? "กำลังตรวจสอบ…" : "กำลังเตรียมออฟไลน์… อย่าเพิ่งตัดเน็ต"}
      </span>
    </div>
  );
}
