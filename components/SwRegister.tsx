"use client";

import { useEffect } from "react";

/** ลงทะเบียน service worker เฉพาะ production build (dev ไม่ลง กัน cache กวน HMR) */
export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const register = () =>
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
