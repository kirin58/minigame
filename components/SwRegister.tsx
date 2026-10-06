"use client";

import { useEffect } from "react";

/** ลงทะเบียน service worker ทันที (ไม่รอ load) เฉพาะ production build */
export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
