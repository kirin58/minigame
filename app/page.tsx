"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { CAT_STYLE, GAMES, type Category } from "@/lib/games";
import OfflineStatus from "@/components/OfflineStatus";

const FILTERS: ("ทั้งหมด" | Category)[] = [
  "ทั้งหมด",
  "อาร์เคด",
  "ปริศนา",
  "ความจำ",
  "คลาสสิก",
];

const FILTER_DOT: Record<(typeof FILTERS)[number], string> = {
  ทั้งหมด: "bg-stone-900",
  อาร์เคด: CAT_STYLE["อาร์เคด"].dot,
  ปริศนา: CAT_STYLE["ปริศนา"].dot,
  ความจำ: CAT_STYLE["ความจำ"].dot,
  คลาสสิก: CAT_STYLE["คลาสสิก"].dot,
};

/** delay สำหรับ stagger animation */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function LevelDot({ level }: { level: string }) {
  const n = level === "ง่าย" ? 1 : level === "ปานกลาง" ? 2 : 3;
  return (
    <span className="flex items-center gap-1" title={level}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i <= n ? "bg-stone-900" : "bg-stone-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function Home() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof FILTERS)[number]>("ทั้งหมด");

  const list = useMemo(() => {
    return GAMES.filter((g) => {
      const okCat = cat === "ทั้งหมด" || g.category === cat;
      const okQ =
        q.trim() === "" ||
        (g.title + g.thai + g.desc).toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [q, cat]);

  return (
    <main>
      {/* hero — minimal, no gradient */}
      <section className="border-b border-stone-200">
        <div className="paper-grid">
          <div className="mx-auto max-w-5xl px-5 pb-10 pt-12">
            <p className="anim-rise text-[12px] font-medium uppercase tracking-[0.18em] text-stone-500">
              Archive — 12 browser games
            </p>
            <h1
              style={d(60)}
              className="anim-rise mt-3 max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
            >
              มินิเกมเล่นได้เลย ไม่ต้องติดตั้ง
            </h1>
            <p
              style={d(120)}
              className="anim-rise mt-4 max-w-lg text-[15px] leading-relaxed text-stone-600"
            >
              รวมเกมสั้นๆ 12 เกม ทั้งอาร์เคด ปริศนา และเกมความจำ
              เลือกเกมแล้วเล่นในหน้านี้ได้ทันที บันทึกคะแนนไว้ในเครื่องของคุณ
            </p>
            <div
              style={d(180)}
              className="anim-rise mt-6 flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[13px] text-stone-600">
                <span className="anim-pulse-soft h-2 w-2 rounded-full bg-emerald-600" />
                <span className="tabular">12 เกมพร้อมเล่น</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-[13px] text-stone-600">
                <span className="tabular">คีย์บอร์ด + เมาส์ + ทัช</span>
              </div>
              <OfflineStatus />
            </div>

            {/* search + filter */}
            <div
              style={d(240)}
              className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาเกม… เช่น snake, จำคู่, ระเบิด"
                className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none placeholder:text-stone-400 focus:border-stone-900 sm:max-w-xs"
              />
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setCat(f)}
                    className={`btn-press flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] ${
                      cat === f
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${FILTER_DOT[f]}`}
                    />
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* grid */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-stone-500">
            เกมทั้งหมด <span className="tabular">({list.length})</span>
          </h2>
          <p className="hidden text-[13px] text-stone-400 sm:block">
            กดที่การ์ดเพื่อเข้าเล่น
          </p>
        </div>

        {list.length === 0 && (
          <div className="rounded-md border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
            ไม่พบเกมที่ค้นหา ลองคำอื่นดู
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g, i) => {
            const style = CAT_STYLE[g.category];
            return (
              <a
                key={g.slug}
                href={`/games/${g.slug}`}
                style={d(Math.min(i, 8) * 45)}
                className={`card-lift anim-rise group flex flex-col rounded-md border border-stone-200 bg-white p-5 hover:border-stone-900 ${style.hover}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[12px] tabular text-stone-400">
                    {g.no}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] ${style.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {g.category}
                  </span>
                </div>
              <h3 className="mt-6 text-[17px] font-semibold tracking-tight">
                {g.thai}
                <span className="ml-2 font-normal text-stone-400">
                  {g.title}
                </span>
              </h3>
              <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-stone-600">
                {g.desc}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-[12px] text-stone-500">
                <span className="tabular">
                  {g.players} · {g.time}
                </span>
                <LevelDot level={g.level} />
              </div>
              <div className="mt-3 text-[13px] font-medium text-stone-900">
                <span className="inline-block border-b border-stone-900 pb-px group-hover:bg-stone-900 group-hover:text-white group-hover:px-1 group-hover:transition-all">
                  เล่น →
                </span>
              </div>
              </a>
            );
          })}
        </div>

        {/* how to */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["01 — เลือก", "กดที่การ์ดเกม เกมจะเปิดทันทีไม่ต้องโหลดเพิ่ม"],
            ["02 — เล่น", "รองรับคีย์บอร์ด เมาส์ และทัชบนมือถือ"],
            [
              "03 — ออฟไลน์",
              "เปิดครั้งเดียว เกมจะอยู่ในเครื่อง เล่นต่อได้โดยไม่ต้องใช้เน็ต",
            ],
          ].map(([h, p]) => (
            <div
              key={h}
              className="rounded-md border border-stone-200 bg-stone-100/60 p-4"
            >
              <p className="text-[13px] font-semibold">{h}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">
                {p}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
