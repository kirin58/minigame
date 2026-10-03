"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Card = { id: number; symbol: string; matched: boolean };

const SYMBOLS = ["●", "▲", "■", "✕", "◆", "◉", "⬟", "≋"];
const BEST_KEY = "mg-memory-best";
const PAIRS = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function buildDeck(): Card[] {
  const doubled = shuffle([...SYMBOLS, ...SYMBOLS]);
  return doubled.map((symbol, idx) => ({ id: idx, symbol, matched: false }));
}

export default function Memory() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [best, setBest] = useState<number | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const [lock, setLock] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setDeck(buildDeck());
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n > 0) setBest(n);
      }
    } catch {
      // localStorage ไม่พร้อมใช้งาน
    }
  }, []);

  const started = moves > 0 || open.length > 0;

  // ตัวจับเวลา: เดินขณะยังไม่จบ และเริ่มเล่นแล้ว
  useEffect(() => {
    if (done || !started) return;
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [done, started]);

  const restart = useCallback(() => {
    setDeck(buildDeck());
    setOpen([]);
    setMoves(0);
    setSeconds(0);
    setDone(false);
    setLock(false);
  }, []);

  const matchedCount = deck.filter((c) => c.matched).length / 2;

  const finish = useCallback(
    (finalMoves: number) => {
      setDone(true);
      setBest((prev) => {
        if (prev === null || finalMoves < prev) {
          try {
            window.localStorage.setItem(BEST_KEY, String(finalMoves));
          } catch {
            // เงียบไว้
          }
          return finalMoves;
        }
        return prev;
      });
    },
    []
  );

  const flip = useCallback(
    (id: number) => {
      if (done || lock) return;
      const card = deck.find((c) => c.id === id);
      if (!card || card.matched || open.includes(id)) return;
      if (open.length >= 2) return;

      const nextOpen = [...open, id];
      setOpen(nextOpen);

      if (nextOpen.length === 2) {
        const [a, b] = nextOpen;
        const ca = deck.find((c) => c.id === a);
        const cb = deck.find((c) => c.id === b);
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        if (ca && cb && ca.symbol === cb.symbol) {
          const nextDeck = deck.map((c) =>
            c.id === a || c.id === b ? { ...c, matched: true } : c
          );
          setDeck(nextDeck);
          setOpen([]);
          const pairsDone = nextDeck.filter((c) => c.matched).length / 2;
          if (pairsDone >= PAIRS) finish(nextMoves);
        } else {
          setLock(true);
          window.setTimeout(() => {
            setOpen([]);
            setLock(false);
          }, 650);
        }
      }
    },
    [deck, done, lock, moves, open, finish]
  );

  return (
    <div className="bg-white p-4 text-stone-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">จับคู่ไพ่</h2>
          <p className="text-sm text-stone-500">
            พลิกทีละ 2 ใบ จับคู่ให้ครบ {PAIRS} คู่ คู่ที่เจอแล้ว:{" "}
            <span className="tabular font-semibold text-stone-900">{matchedCount}</span>/
            <span className="tabular">{PAIRS}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            จำนวนครั้ง: <span className="tabular font-semibold">{moves}</span>
          </span>
          <span>
            เวลา: <span className="tabular font-semibold">{seconds}</span> วินาที
          </span>
          <span>
            ดีที่สุด:{" "}
            <span className="tabular font-semibold">{best === null ? "—" : `${best} ครั้ง`}</span>
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="mx-auto grid w-full max-w-[440px] grid-cols-4 gap-2" role="grid" aria-label="ไพ่จับคู่">
          {deck.map((card) => {
            const isOpen = open.includes(card.id) || card.matched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flip(card.id)}
                aria-label={isOpen ? `ไพ่ ${card.symbol}` : "ไพ่คว่ำ"}
                disabled={card.matched}
                className={`flex aspect-square items-center justify-center rounded-md border text-2xl font-semibold ${
                  card.matched
                    ? "border-stone-900 bg-stone-900 text-white"
                    : isOpen
                      ? "border-stone-900 bg-white text-stone-900"
                      : "border-stone-200 bg-white text-stone-300"
                }`}
              >
                {isOpen ? card.symbol : "?"}
              </button>
            );
          })}
        </div>

        {done ? (
          <div className="mx-auto mt-4 w-full max-w-[440px] rounded-md border border-stone-200 p-4 text-center">
            <p className="text-lg font-semibold">จบเกม ครบ {PAIRS} คู่</p>
            <p className="mt-1 text-sm text-stone-500">
              ใช้ <span className="tabular font-semibold text-stone-900">{moves}</span> ครั้ง เวลา{" "}
              <span className="tabular font-semibold text-stone-900">{seconds}</span> วินาที
              {best !== null ? (
                <>
                  {" "}ดีที่สุด <span className="tabular font-semibold text-stone-900">{best}</span> ครั้ง
                </>
              ) : null}
            </p>
            <button
              type="button"
              onClick={restart}
              className="mt-3 rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              เริ่มใหม่
            </button>
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[440px] items-center justify-between gap-2">
        <p className="text-xs text-stone-500">ไพ่สับใหม่ทุกครั้งที่กดเริ่มใหม่ สถิติดีที่สุดนับจากจำนวนครั้งน้อยสุด</p>
        <button
          type="button"
          onClick={restart}
          className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm"
        >
          เริ่มใหม่
        </button>
      </div>
    </div>
  );
}
