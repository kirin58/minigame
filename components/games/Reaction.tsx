"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "ready" | "result" | "foul" | "done";

const TOTAL_ROUNDS = 5;
const BEST_KEY = "mg-reaction-best";

function loadBest(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export default function Reaction() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    setBest(loadBest());
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    clearTimer();
    setLastMs(null);
    setPhase("waiting");
    const delay = 1000 + Math.random() * 3000; // 1–4 วิ
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, [clearTimer]);

  const startSet = useCallback(() => {
    clearTimer();
    setRounds([]);
    setLastMs(null);
    setPhase("waiting");
    const delay = 1000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
    }, delay);
  }, [clearTimer]);

  const handlePress = useCallback(() => {
    if (phase === "idle" || phase === "done") {
      startSet();
    } else if (phase === "waiting") {
      clearTimer();
      setPhase("foul");
    } else if (phase === "ready") {
      const ms = Math.round(performance.now() - startRef.current);
      setLastMs(ms);
      setRounds((prev) => {
        const next = [...prev, ms];
        if (next.length >= TOTAL_ROUNDS) {
          const avg = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
          setBest((cur) => {
            if (cur !== null && cur <= avg) return cur;
            try {
              window.localStorage.setItem(BEST_KEY, String(avg));
            } catch {
              /* ignore */
            }
            return avg;
          });
          setPhase("done");
        } else {
          setPhase("result");
        }
        return next;
      });
    } else if (phase === "foul") {
      startRound(); // ลองรอบเดิมใหม่
    } else if (phase === "result") {
      startRound(); // ไปรอบถัดไป
    }
  }, [phase, startSet, startRound, clearTimer]);

  // spacebar + คลิก
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handlePress();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePress]);

  const avg =
    rounds.length > 0
      ? Math.round(rounds.reduce((a, b) => a + b, 0) / rounds.length)
      : null;
  const fastest = rounds.length > 0 ? Math.min(...rounds) : null;
  const maxMs = rounds.length > 0 ? Math.max(...rounds, 1) : 1;

  let boxClass = "border-stone-200 bg-white";
  let boxText = "กดเพื่อเริ่ม";
  let boxSub = `เล่น ${TOTAL_ROUNDS} รอบ • กด spacebar หรือคลิกก็ได้`;

  if (phase === "waiting") {
    boxClass = "border-red-300 bg-red-500 text-white";
    boxText = "รอ…";
    boxSub = `รอบที่ ${rounds.length + 1}/${TOTAL_ROUNDS} — อย่าเพิ่งกด รอให้เป็นสีเขียว`;
  } else if (phase === "ready") {
    boxClass = "border-green-600 bg-green-500 text-white";
    boxText = "กด!";
    boxSub = "กดเลย! (คลิกหรือ spacebar)";
  } else if (phase === "foul") {
    boxClass = "border-stone-300 bg-stone-100";
    boxText = "ฟาวล์! กดเร็วไป";
    boxSub = "กดอีกครั้งเพื่อลองรอบเดิมใหม่";
  } else if (phase === "result") {
    boxClass = "border-stone-300 bg-white";
    boxText = lastMs !== null ? `${lastMs} ms` : "—";
    boxSub = `รอบที่ ${rounds.length}/${TOTAL_ROUNDS} เสร็จ — กดเพื่อไปรอบถัดไป`;
  } else if (phase === "done") {
    boxClass = "border-stone-300 bg-white";
    boxText = avg !== null ? `เฉลี่ย ${avg} ms` : "เสร็จแล้ว";
    boxSub = "กดปุ่มเริ่มชุดใหม่เพื่อเล่นอีก";
  } else if (rounds.length > 0) {
    boxSub = `เล่นไป ${rounds.length}/${TOTAL_ROUNDS} รอบ`;
  }

  return (
    <div className="bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-stone-900">วัดรีเฟล็กซ์</h2>
          <p className="text-[13px] text-stone-500">
            รอกล่องเปลี่ยนเป็นสีเขียวแล้วกดให้เร็วที่สุด เล่น {TOTAL_ROUNDS} รอบ
          </p>
        </div>
        <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[12px] tabular text-stone-600">
          รอบ {Math.min(rounds.length + (phase === "done" ? 0 : 0), TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
          {best !== null ? ` • ดีสุด ${best} ms` : " • ยังไม่มีสถิติ"}
        </span>
      </div>

      {/* กล่องใหญ่ */}
      <button
        type="button"
        onClick={handlePress}
        className={`flex min-h-44 w-full flex-col items-center justify-center rounded-md border px-4 py-10 text-center transition-colors ${boxClass}`}
        aria-live="polite"
      >
        <span className="text-2xl font-semibold tabular">{boxText}</span>
        <span
          className={`mt-1 text-[13px] ${phase === "waiting" || phase === "ready" ? "text-white/90" : "text-stone-500"}`}
        >
          {boxSub}
        </span>
        {phase === "idle" && (
          <span className="mt-2 text-[12px] text-stone-400">
            กล่องจะแดงก่อน แล้วสุ่ม 1–4 วินาทีเปลี่ยนเป็นเขียว
          </span>
        )}
      </button>

      {/* ผล 5 รอบ + กราฟแท่ง */}
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_220px]">
        <div className="rounded-md border border-stone-200 p-3">
          <p className="text-[13px] font-medium text-stone-900">
            ผลแต่ละรอบ <span className="font-normal text-stone-500">(แท่งสูง = ช้า)</span>
          </p>
          {rounds.length === 0 ? (
            <p className="mt-2 text-[13px] text-stone-400">— ยังไม่มีรอบที่สำเร็จ —</p>
          ) : (
            <>
              <div className="mt-2 flex h-32 items-end gap-2">
                {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
                  const v = rounds[i];
                  if (v === undefined) {
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex h-28 w-full items-end justify-center rounded bg-stone-50">
                          <span className="pb-2 text-[11px] text-stone-300">—</span>
                        </div>
                        <span className="text-[11px] tabular text-stone-400">R{i + 1}</span>
                      </div>
                    );
                  }
                  const h = Math.max(8, Math.round((v / maxMs) * 112));
                  const isFast = v === fastest;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 w-full items-end justify-center rounded bg-stone-50">
                        <div
                          className={`w-full rounded ${isFast ? "bg-stone-900" : "bg-stone-300"}`}
                          style={{ height: `${h}px` }}
                          title={`${v} ms`}
                        />
                      </div>
                      <span className="text-[11px] tabular text-stone-600">{v}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rounds.map((v, i) => (
                  <span
                    key={i}
                    className="rounded border border-stone-200 bg-white px-2 py-0.5 text-[12px] tabular text-stone-700"
                  >
                    รอบ {i + 1}: {v} ms
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-fit rounded-md border border-stone-200 p-3 text-[13px]">
          <p className="font-medium text-stone-900">สรุป</p>
          <p className="mt-1 text-stone-600 tabular">
            เฉลี่ย: {avg !== null ? `${avg} ms` : "—"}
          </p>
          <p className="text-stone-600 tabular">
            เร็วสุด: {fastest !== null ? `${fastest} ms` : "—"}
          </p>
          <p className="text-stone-600 tabular">
            ดีสุด (เฉลี่ย): {best !== null ? `${best} ms` : "—"}
          </p>
          <button
            type="button"
            onClick={startSet}
            className="mt-3 w-full rounded bg-stone-900 px-3 py-2 text-[13px] font-medium text-white hover:bg-stone-700"
          >
            {rounds.length === 0 && phase === "idle" ? "เริ่ม" : "เริ่มชุดใหม่"}
          </button>
          <p className="mt-2 text-[12px] text-stone-400">
            กด spacebar หรือคลิกกล่องก็ได้ ถ้ากดตอนแดง = ฟาวล์
          </p>
        </div>
      </div>
    </div>
  );
}
