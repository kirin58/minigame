"use client";

import { useCallback, useEffect, useState } from "react";

type Level = { id: string; label: string; max: number; tries: number };

const LEVELS: Level[] = [
  { id: "50", label: "1–50", max: 50, tries: 5 },
  { id: "100", label: "1–100", max: 100, tries: 7 },
  { id: "500", label: "1–500", max: 500, tries: 10 },
];

const BEST_KEY = "mg-guess-best";

function randomTarget(max: number): number {
  return 1 + Math.floor(Math.random() * max);
}

function loadBest(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const k of Object.keys(p)) {
      if (typeof p[k] === "number") out[k] = p[k] as number;
    }
    return out;
  } catch {
    return {};
  }
}

export default function Guess() {
  const [levelId, setLevelId] = useState("100");
  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[1];

  const [target, setTarget] = useState<number>(() => randomTarget(100));
  const [guesses, setGuesses] = useState<number[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => {
    setBest(loadBest());
  }, []);

  const newGame = useCallback(
    (id?: string) => {
      const lv = LEVELS.find((l) => l.id === (id ?? levelId)) ?? LEVELS[1];
      setTarget(randomTarget(lv.max));
      setGuesses([]);
      setInput("");
      setError("");
      setStatus("playing");
      if (id) setLevelId(id);
    },
    [levelId]
  );

  const changeLevel = useCallback(
    (id: string) => {
      setLevelId(id);
      newGame(id);
    },
    [newGame]
  );

  const submitGuess = useCallback(() => {
    if (status !== "playing") return;
    const n = Number.parseInt(input.trim(), 10);
    if (!Number.isFinite(n)) {
      setError("กรุณากรอกตัวเลข");
      return;
    }
    if (n < 1 || n > level.max) {
      setError(`กรุณากรอกเลข 1–${level.max}`);
      return;
    }
    if (guesses.includes(n)) {
      setError(`เคยทาย ${n} แล้ว ลองเลขอื่น`);
      return;
    }
    setError("");
    const next = [...guesses, n];
    setGuesses(next);
    setInput("");

    if (n === target) {
      setStatus("won");
      const used = next.length;
      setBest((prev) => {
        const cur = prev[level.id];
        if (cur !== undefined && cur <= used) return prev;
        const nb = { ...prev, [level.id]: used };
        try {
          window.localStorage.setItem(BEST_KEY, JSON.stringify(nb));
        } catch {
          /* ignore */
        }
        return nb;
      });
    } else if (next.length >= level.tries) {
      setStatus("lost");
    }
  }, [input, status, level, guesses, target]);

  const left = level.tries - guesses.length;
  const last = guesses.length > 0 ? guesses[guesses.length - 1] : null;
  const lastDiff = last === null ? null : Math.abs(last - target);

  function hintFor(g: number): { dir: string; heat: string } {
    const dir = g < target ? "น้อยไป ↑" : "มากไป ↓";
    const diff = Math.abs(g - target);
    let heat = "ไกล";
    if (diff <= 5) heat = "ร้อนมาก";
    else if (diff <= 15) heat = "อุ่นๆ";
    return { dir, heat };
  }

  return (
    <div className="bg-white p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-stone-900">ทายตัวเลข</h2>
        <p className="text-[13px] text-stone-500">
          ทายเลขที่ซ่อนไว้ มีคำใบ้ มากไป / น้อยไป + ระดับความใกล้
        </p>
      </div>

      {/* เลือกระดับ */}
      <div className="mb-4 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => changeLevel(l.id)}
            className={`rounded-full border px-3 py-1.5 text-[13px] tabular ${
              l.id === levelId
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {l.label}{" "}
            <span className="text-[11px] opacity-70">({l.tries} ครั้ง)</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitGuess();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== "playing"}
              inputMode="numeric"
              placeholder={`พิมพ์เลข 1–${level.max} แล้ว Enter`}
              aria-label="ตัวเลขที่ทาย"
              className="h-10 w-full rounded border border-stone-300 bg-white px-3 text-[14px] tabular text-stone-900 placeholder:text-stone-400 disabled:bg-stone-50 disabled:text-stone-400"
            />
            <button
              type="submit"
              disabled={status !== "playing"}
              className="h-10 shrink-0 rounded bg-stone-900 px-4 text-[13px] font-medium text-white hover:bg-stone-700 disabled:opacity-40"
            >
              ทาย
            </button>
          </form>
          {error && <p className="mt-1.5 text-[13px] text-stone-600">{error}</p>}

          {/* คำใบ้ล่าสุด */}
          <div className="mt-3 rounded-md border border-stone-200 bg-white p-3 text-[13px]">
            {guesses.length === 0 ? (
              <p className="text-stone-500">
                ยังไม่เคยทาย — เริ่มทายได้เลย เหลือ{" "}
                <span className="tabular">{level.tries}</span> ครั้ง
              </p>
            ) : status === "won" ? (
              <p className="text-stone-800">
                ถูกต้อง! เลขคือ <span className="font-semibold tabular">{target}</span>{" "}
                ใช้ไป <span className="font-semibold tabular">{guesses.length}</span> ครั้ง
                {best[level.id] !== undefined && (
                  <span className="text-stone-500 tabular">
                    {" "}• ดีสุด {best[level.id]} ครั้ง
                  </span>
                )}
              </p>
            ) : status === "lost" ? (
              <p className="text-stone-800">
                หมดโอกาสแล้ว เฉลยคือ{" "}
                <span className="font-semibold tabular">{target}</span>
              </p>
            ) : (
              last !== null &&
              lastDiff !== null && (
                <p className="text-stone-800">
                  <span className="font-semibold tabular">{last}</span>{" "}
                  {last < target ? "น้อยไป ↑" : "มากไป ↓"}
                  <span className="text-stone-500"> • </span>
                  <span className="text-stone-700">
                    {lastDiff <= 5
                      ? "ร้อนมาก! ใกล้มากแล้ว"
                      : lastDiff <= 15
                        ? "อุ่นๆ ใกล้แล้ว"
                        : "ยังไกล ลองอีก"}
                  </span>
                  <span className="text-stone-500 tabular">
                    {" "}• เหลือ {left} ครั้ง
                  </span>
                </p>
              )
            )}
          </div>

          {/* ประวัติที่ทาย */}
          <div className="mt-3">
            <p className="mb-1.5 text-[12px] text-stone-500">
              ประวัติที่ทาย ({guesses.length}/{level.tries})
            </p>
            {guesses.length === 0 ? (
              <p className="text-[13px] text-stone-400">— ยังไม่มี —</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {guesses.map((g, i) => {
                  const h = hintFor(g);
                  const isLast = i === guesses.length - 1 && status === "playing";
                  return (
                    <span
                      key={`${g}-${i}`}
                      title={`${h.dir} • ${h.heat}`}
                      className={`rounded border px-2 py-1 text-[12px] tabular ${
                        g === target
                          ? "border-stone-900 bg-stone-900 text-white"
                          : isLast
                            ? "border-stone-400 bg-stone-50 text-stone-900"
                            : "border-stone-200 bg-white text-stone-600"
                      }`}
                    >
                      #{i + 1} {g} {g === target ? "✓" : g < target ? "↑" : "↓"}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* แผงข้าง */}
        <div className="h-fit rounded-md border border-stone-200 bg-white p-3 text-[13px]">
          <p className="font-medium text-stone-900">สถานะ</p>
          <p className="mt-1 text-stone-600 tabular">
            ทายแล้ว {guesses.length}/{level.tries} • เหลือ {left}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-stone-900"
              style={{ width: `${(guesses.length / level.tries) * 100}%` }}
            />
          </div>
          <p className="mt-3 font-medium text-stone-900">ดีสุดต่อระดับ</p>
          <ul className="mt-1 space-y-1 text-stone-600 tabular">
            {LEVELS.map((l) => (
              <li key={l.id} className="flex justify-between">
                <span>{l.label}</span>
                <span>{best[l.id] !== undefined ? `${best[l.id]} ครั้ง` : "—"}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => newGame()}
            className="mt-3 w-full rounded border border-stone-300 bg-white px-3 py-2 text-[13px] font-medium text-stone-800 hover:border-stone-500"
          >
            สุ่มเลขใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
