"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BEST_KEY = "mg-whack-best";
const DURATION = 30;
const BOMB_CHANCE = 0.22;

type Cell = { kind: "mole" | "bomb" | null; key: number };

function emptyCells(): Cell[] {
  return Array.from({ length: 9 }, () => ({ kind: null, key: 0 }));
}

export default function Whack() {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [playing, setPlaying] = useState(false);
  const [cells, setCells] = useState<Cell[]>(emptyCells);
  const [shake, setShake] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const keyRef = useRef(1);
  const shakeTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (!Number.isNaN(v) && v > 0) setBest(v);
    } catch {
      /* ignore */
    }
  }, []);

  const finish = useCallback(
    (finalScore: number) => {
      setPlaying(false);
      setCells(emptyCells());
      setOver(true);
      if (finalScore > best) {
        setBest(finalScore);
        try {
          localStorage.setItem(BEST_KEY, String(finalScore));
        } catch {
          /* ignore */
        }
      }
    },
    [best]
  );

  // ตัวนับเวลาถอยหลัง
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  // หมดเวลา -> จบเกม
  useEffect(() => {
    if (playing && timeLeft <= 0) {
      finish(score);
    }
  }, [timeLeft, playing, score, finish]);

  // ตัวสุ่มตุ่นโผล่
  useEffect(() => {
    if (!playing) return;
    const spawn = () => {
      setCells(() => {
        const next = emptyCells();
        const count = Math.random() < 0.3 ? 2 : 1;
        const picks = new Set<number>();
        while (picks.size < count) {
          picks.add(Math.floor(Math.random() * 9));
        }
        picks.forEach((idx) => {
          next[idx] = {
            kind: Math.random() < BOMB_CHANCE ? "bomb" : "mole",
            key: keyRef.current++,
          };
        });
        return next;
      });
    };
    spawn();
    const id = window.setInterval(spawn, 750);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    return () => {
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    };
  }, []);

  const start = () => {
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    setShake(null);
    setScore(0);
    setTimeLeft(DURATION);
    setOver(false);
    setCells(emptyCells());
    setPlaying(true);
  };

  const hit = (i: number) => {
    if (!playing) return;
    const c = cells[i];
    if (!c.kind) return;
    if (c.kind === "mole") {
      setScore((s) => s + 1);
      setCells((prev) => {
        const next = [...prev];
        next[i] = { kind: null, key: 0 };
        return next;
      });
    } else {
      // ระเบิด: -2 แต้ม + สั่น
      setScore((s) => s - 2);
      setShake(i);
      setCells((prev) => {
        const next = [...prev];
        next[i] = { kind: null, key: 0 };
        return next;
      });
      if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
      shakeTimer.current = window.setTimeout(() => setShake(null), 350);
    }
  };

  const pct = Math.max(0, (timeLeft / DURATION) * 100);

  return (
    <div className="p-4 text-stone-900">
      <style>{`@keyframes mg-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } } .mg-shake { animation: mg-shake 0.3s ease; }`}</style>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">ตีตุ่น</h2>
        <div className="flex gap-2 text-sm">
          <div className="rounded-md border border-stone-200 px-3 py-1">
            คะแนน <span className="tabular font-bold">{score}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ดีที่สุด <span className="tabular font-bold">{best}</span>
          </div>
        </div>
      </div>

      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-stone-600">
          เวลา <span className="tabular font-bold text-stone-900">{timeLeft}</span> วินาที
        </span>
        <span className="text-xs text-stone-500">ตุ่น +1 / ระเบิด −2</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
        <div
          className="h-full bg-stone-900 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {!playing && !over && (
        <p className="mb-3 text-center text-sm text-stone-600">
          กดเริ่ม แล้วแตะตุ่นให้ทัน ห้ามแตะระเบิด
        </p>
      )}
      {over && (
        <div className="mb-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-center text-sm">
          หมดเวลา! ได้ <span className="tabular font-bold">{score}</span> แต้ม
          {score >= best && score > 0 ? " (สถิติใหม่!)" : ""}
        </div>
      )}

      <div className="mx-auto grid max-w-[300px] grid-cols-3 gap-2">
        {cells.map((c, i) => (
          <button
            key={i}
            onPointerDown={(e) => {
              e.preventDefault();
              hit(i);
            }}
            disabled={!playing || !c.kind}
            aria-label={c.kind === "mole" ? "ตุ่น" : c.kind === "bomb" ? "ระเบิด" : "หลุม"}
            className={`flex aspect-square touch-none select-none items-center justify-center rounded-md border text-sm font-medium transition-colors ${
              shake === i
                ? "mg-shake border-red-500 bg-red-50 text-red-700"
                : c.kind === "mole"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : c.kind === "bomb"
                    ? "border-stone-300 bg-white text-stone-900"
                    : "border-stone-200 bg-stone-100 text-stone-300"
            }`}
          >
            {c.kind === "mole" ? (
              <span className="flex flex-col items-center leading-tight">
                <span className="text-lg font-bold">ตุ่น</span>
                <span className="text-[11px] font-normal">แตะเลย</span>
              </span>
            ) : c.kind === "bomb" ? (
              <span className="flex flex-col items-center leading-tight">
                <span className="text-lg font-bold">บึ้ม</span>
                <span className="text-[11px] font-normal">ห้ามแตะ</span>
              </span>
            ) : (
              <span className="text-xs">หลุม {i + 1}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={start}
          className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          {over ? "เล่นอีกครั้ง" : playing ? "เริ่มใหม่" : "เริ่มเกม"}
        </button>
      </div>
    </div>
  );
}
