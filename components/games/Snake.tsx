"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type Status = "idle" | "playing" | "paused" | "over";
type SpeedKey = "slow" | "normal" | "fast";

const GRID = 20;
const BEST_KEY = "mg-snake-best";
const SPEEDS: Record<SpeedKey, { label: string; ms: number }> = {
  slow: { label: "ช้า", ms: 200 },
  normal: { label: "ปกติ", ms: 120 },
  fast: { label: "เร็ว", ms: 70 },
};
const SPEED_ORDER: SpeedKey[] = ["slow", "normal", "fast"];

function randomFood(snake: Point[]): Point {
  const taken = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

function initialSnake(): Point[] {
  const y = Math.floor(GRID / 2);
  return [
    { x: 10, y },
    { x: 9, y },
    { x: 8, y },
  ];
}

const OPPOSITE: Record<string, string> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DIR_VEC: Record<string, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>(initialSnake);
  const [food, setFood] = useState<Point>({ x: 14, y: 10 });
  const [score, setScore] = useState<number>(0);
  const [best, setBest] = useState<number>(0);
  const [status, setStatus] = useState<Status>("idle");
  const [speedKey, setSpeedKey] = useState<SpeedKey>("normal");

  const dirRef = useRef<string>("right");
  const pendingRef = useRef<string>("right");
  const statusRef = useRef<Status>("idle");
  const snakeRef = useRef<Point[]>(initialSnake());
  const foodRef = useRef<Point>({ x: 14, y: 10 });
  const scoreRef = useRef<number>(0);

  statusRef.current = status;
  snakeRef.current = snake;
  foodRef.current = food;
  scoreRef.current = score;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 0) setBest(n);
      }
    } catch {
      // localStorage ไม่พร้อมใช้งาน
    }
  }, []);

  const saveBest = useCallback((value: number) => {
    setBest((prev) => {
      if (value > prev) {
        try {
          window.localStorage.setItem(BEST_KEY, String(value));
        } catch {
          // เงียบไว้
        }
        return value;
      }
      return prev;
    });
  }, []);

  const start = useCallback(() => {
    const s = initialSnake();
    const f = randomFood(s);
    dirRef.current = "right";
    pendingRef.current = "right";
    snakeRef.current = s;
    foodRef.current = f;
    scoreRef.current = 0;
    setSnake(s);
    setFood(f);
    setScore(0);
    setStatus("playing");
  }, []);

  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === "playing") return "paused";
      if (prev === "paused") return "playing";
      return prev;
    });
  }, []);

  const setDirection = useCallback((d: string) => {
    if (OPPOSITE[d] !== dirRef.current) {
      pendingRef.current = d;
    }
  }, []);

  // เกมลูป
  useEffect(() => {
    if (status !== "playing") return;
    const ms = SPEEDS[speedKey].ms;
    const id = window.setInterval(() => {
      dirRef.current = pendingRef.current;
      const vec = DIR_VEC[dirRef.current];
      const head = snakeRef.current[0];
      const next: Point = { x: head.x + vec.x, y: head.y + vec.y };

      // ชนขอบ
      if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
        saveBest(scoreRef.current);
        setStatus("over");
        return;
      }
      // ชนตัวเอง (ยกเว้นหางที่จะหลุด)
      const body = snakeRef.current;
      const eats = next.x === foodRef.current.x && next.y === foodRef.current.y;
      const checkBody = eats ? body : body.slice(0, body.length - 1);
      const hitSelf = checkBody.some((p) => p.x === next.x && p.y === next.y);
      if (hitSelf) {
        saveBest(scoreRef.current);
        setStatus("over");
        return;
      }

      let grown: Point[];
      if (eats) {
        grown = [next, ...body];
        const nf = randomFood(grown);
        foodRef.current = nf;
        setFood(nf);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      } else {
        grown = [next, ...body.slice(0, body.length - 1)];
      }
      snakeRef.current = grown;
      setSnake(grown);
    }, ms);
    return () => window.clearInterval(id);
  }, [status, speedKey, saveBest]);

  // คีย์บอร์ด
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") {
        e.preventDefault();
        if (statusRef.current === "playing") setDirection("up");
      } else if (k === "arrowdown" || k === "s") {
        e.preventDefault();
        if (statusRef.current === "playing") setDirection("down");
      } else if (k === "arrowleft" || k === "a") {
        e.preventDefault();
        if (statusRef.current === "playing") setDirection("left");
      } else if (k === "arrowright" || k === "d") {
        e.preventDefault();
        if (statusRef.current === "playing") setDirection("right");
      } else if (k === " ") {
        e.preventDefault();
        togglePause();
      } else if (k === "enter") {
        if (statusRef.current === "idle" || statusRef.current === "over") start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDirection, start, togglePause]);

  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const headKey = snake.length > 0 ? `${snake[0].x},${snake[0].y}` : "";

  const statusLabel =
    status === "idle"
      ? "พร้อมเล่น"
      : status === "playing"
        ? "กำลังเล่น"
        : status === "paused"
          ? "หยุดชั่วคราว"
          : "จบเกม";

  return (
    <div className="bg-white p-4 text-stone-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">งู</h2>
          <p className="text-sm text-stone-500">
            กินอาหารเพื่อทำแต้ม หลบขอบและลำตัว สถานะ: {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div>
            คะแนน: <span className="tabular font-semibold">{score}</span>
          </div>
          <div>
            ดีที่สุด: <span className="tabular font-semibold">{best}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative mx-auto w-full max-w-[440px]">
          <div
            className="grid w-full border border-stone-200"
            style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
            role="grid"
            aria-label="กระดานงู"
          >
            {Array.from({ length: GRID * GRID }, (_, i) => {
              const x = i % GRID;
              const y = Math.floor(i / GRID);
              const key = `${x},${y}`;
              const isHead = key === headKey;
              const isBody = occupied.has(key);
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={key}
                  className={`aspect-square ${
                    isHead
                      ? "bg-stone-900"
                      : isBody
                        ? "bg-stone-500"
                        : isFood
                          ? "bg-stone-900"
                          : "bg-white"
                  } flex items-center justify-center`}
                >
                  {isFood ? (
                    <span className="block h-1/2 w-1/2 rounded-full bg-white ring-2 ring-stone-900" />
                  ) : null}
                </div>
              );
            })}
          </div>

          {status === "over" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-stone-200 bg-white/95 p-6 text-center">
              <p className="text-lg font-semibold">จบเกม</p>
              <p className="text-sm text-stone-500">
                ได้ <span className="tabular font-semibold text-stone-900">{score}</span>{" "}
                แต้ม ดีที่สุด <span className="tabular font-semibold text-stone-900">{Math.max(best, score)}</span>
              </p>
              <button
                type="button"
                onClick={start}
                className="mt-2 rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                เล่นใหม่
              </button>
            </div>
          ) : null}

          {status === "idle" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-stone-200 bg-white/95 p-6 text-center">
              <p className="text-lg font-semibold">พร้อมเริ่ม</p>
              <p className="text-sm text-stone-500">กดเริ่มแล้วใช้ลูกศรหรือ WASD บังคับงู</p>
              <button
                type="button"
                onClick={start}
                className="mt-2 rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              >
                เริ่มเกม
              </button>
            </div>
          ) : null}

          {status === "paused" ? (
            <div className="absolute inset-0 flex items-center justify-center border border-stone-200 bg-white/80">
              <p className="text-sm font-medium text-stone-700">หยุดชั่วคราว กดเล่นต่อเพื่อดำเนินการ</p>
            </div>
          ) : null}
        </div>

        <div className="w-full max-w-[440px] flex-1 space-y-4 lg:mx-0">
          <div className="rounded-md border border-stone-200 p-3">
            <p className="mb-2 text-sm font-medium">ควบคุม</p>
            <div className="flex flex-wrap gap-2">
              {status === "playing" ? (
                <button
                  type="button"
                  onClick={togglePause}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
                >
                  หยุด
                </button>
              ) : status === "paused" ? (
                <button
                  type="button"
                  onClick={togglePause}
                  className="rounded-md border border-stone-900 bg-stone-900 px-3 py-1.5 text-sm text-white"
                >
                  เล่นต่อ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={start}
                  className="rounded-md border border-stone-900 bg-stone-900 px-3 py-1.5 text-sm text-white"
                >
                  เริ่ม
                </button>
              )}
              <button
                type="button"
                onClick={start}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              >
                รีสตาร์ท
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              ใช้ลูกศรหรือ W A S D บนคีย์บอร์ด ปุ่ม Space หยุด/เล่นต่อ Enter เริ่มใหม่
            </p>
          </div>

          <div className="rounded-md border border-stone-200 p-3">
            <p className="mb-2 text-sm font-medium">ความเร็ว</p>
            <div className="flex gap-2">
              {SPEED_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSpeedKey(k)}
                  aria-pressed={speedKey === k}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    speedKey === k
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 text-stone-700"
                  }`}
                >
                  {SPEEDS[k].label}
                  <span className="tabular ml-1 text-xs opacity-70">{SPEEDS[k].ms}ms</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-stone-200 p-3">
            <p className="mb-2 text-sm font-medium">ปุ่มทิศทาง (มือถือ)</p>
            <div className="mx-auto grid w-36 grid-cols-3 gap-1">
              <span />
              <button
                type="button"
                aria-label="ขึ้น"
                onClick={() => setDirection("up")}
                className="rounded-md border border-stone-300 px-2 py-2 text-sm font-semibold"
              >
                ↑
              </button>
              <span />
              <button
                type="button"
                aria-label="ซ้าย"
                onClick={() => setDirection("left")}
                className="rounded-md border border-stone-300 px-2 py-2 text-sm font-semibold"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="ลง"
                onClick={() => setDirection("down")}
                className="rounded-md border border-stone-300 px-2 py-2 text-sm font-semibold"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="ขวา"
                onClick={() => setDirection("right")}
                className="rounded-md border border-stone-300 px-2 py-2 text-sm font-semibold"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
