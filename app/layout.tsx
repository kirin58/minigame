import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "minigames — รวมมินิเกม 12 เกม เล่นฟรีในเบราว์เซอร์",
  description:
    "รวมมินิเกม 12 เกม ทั้ง Snake, 2048, Minesweeper, Tetris, Breakout, จำคู่, Simon, ตีตุ่น, XO, เป่ายิ้งฉุบ, Hangman, ทายตัวเลข เล่นฟรี ไม่ต้องติดตั้ง เล่นออฟไลน์ได้",
  manifest: "/manifest.webmanifest",
  icons: { icon: ["/icon.svg", "/icon-192.png"], apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    title: "minigames",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen font-sans">
        <header className="border-b border-stone-200 bg-[#fafaf9]">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
            <a href="/" className="flex items-center gap-2.5">
              <span className="grid grid-cols-2 gap-px" aria-hidden>
                <span className="block h-2 w-2 bg-orange-500" />
                <span className="block h-2 w-2 bg-sky-600" />
                <span className="block h-2 w-2 bg-emerald-600" />
                <span className="block h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                minigames
              </span>
              <span className="rounded-full border border-stone-300 px-2 py-0.5 text-[11px] tabular text-stone-500">
                12 เกม
              </span>
            </a>
            <nav className="flex items-center gap-5 text-[13px] text-stone-600">
              <a href="/" className="hover:text-stone-950">
                เกมทั้งหมด
              </a>
              <a href="/#about" className="hidden hover:text-stone-950 sm:block">
                เกี่ยวกับ
              </a>
              <span className="hidden tabular text-stone-400 sm:block">
                v1.1
              </span>
            </nav>
          </div>
        </header>
        {children}
        <footer id="about" className="border-t border-stone-200">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-[13px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              minigames — เล่นฟรีในเบราว์เซอร์ ไม่ต้องล็อกอิน ไม่เก็บข้อมูล
              เล่นออฟไลน์ได้หลังเปิดครั้งแรก
            </p>
            <p className="tabular">Next.js + Tailwind CSS · 100% local</p>
          </div>
        </footer>
        <SwRegister />
      </body>
    </html>
  );
}
