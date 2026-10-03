"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Board = number[][];
type Dir = "up" | "down" | "left" | "right";

const SIZE = 4;
const BEST_KEY = "mg-2048-best";

function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

function spawnRandom(b: Board): Board {
  const next = cloneBoard(b);
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (next[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return next;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const nums = row.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const v = nums[i] * 2;
      out.push(v);
      gained += v;
      i += 2;
    } else {
      out.push(nums[i]);
      i += 1;
    }
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gained };
}

function moveBoard(b: Board, dir: Dir): { board: Board; gained: number; moved: boolean } {
  let gained = 0;
  let next: Board;
  if (dir === "left") {
    next = b.map((row) => {
      const r = slideRow(row);
      gained += r.gained;
      return r.row;
    });
  } else if (dir === "right") {
    next = b.map((row) => {
      const rev = [...row].reverse();
      const r = slideRow(rev);
      gained += r.gained;
      return r.row.reverse();
    });
  } else {
    // transpose, slide, transpose back
    const t: Board = Array.from({ length: SIZE }, (_, c) =>
      Array.from({ length: SIZE }, (_, r) => b[r][c])
    );
    const moved2 = t.map((row) => {
      const r = dir === "up" ? slideRow(row) : slideRow([...row].reverse());
      gained += r.gained;
      return dir === "up" ? r.row : r.row.reverse();
    });
    next = Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => moved2[c][r])
    );
  }
  return { board: next, gained, moved: !boardsEqual(b, next) };
}

function hasWon(b: Board): boolean {
  return b.some((row) => row.some((v) => v >= 2048));
}

function canMove(b: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (b[r][c] === 0) return true;
      if (c + 1 < SIZE && b[r][c] === b[r][c + 1]) return true;
      if (r + 1 < SIZE && b[r][c] === b[r + 1][c]) return true;
    }
  return false;
}

function tileColor(v: number): string {
  switch (v) {
    case 0:
      return "bg-stone-100 text-stone-300";
    case 2:
      return "bg-stone-100 text-stone-700";
    case 4:
      return "bg-stone-200 text-stone-800";
    case 8:
      return "bg-stone-300 text-stone-900";
    case 16:
      return "bg-stone-400 text-white";
    case 32:
      return "bg-stone-500 text-white";
    case 64:
      return "bg-stone-600 text-white";
    case 128:
      return "bg-stone-700 text-white";
    case 256:
      return "bg-stone-800 text-white";
    case 512:
      return "bg-stone-900 text-white";
    default:
      return "bg-black text-white";
  }
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => {
    let b = emptyBoard();
    b = spawnRandom(b);
    b = spawnRandom(b);
    return b;
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [over, setOver] = useState(false);
  const [prev, setPrev] = useState<{ board: Board; score: number } | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (!Number.isNaN(v)) setBest(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (score > best) {
      setBest(score);
      try {
        localStorage.setItem(BEST_KEY, String(score));
      } catch {
        /* ignore */
      }
    }
  }, [score, best]);

  const doMove = useCallback(
    (dir: Dir) => {
      if (over || (won && !keepGoing)) return;
      setBoard((b) => {
        const { board: nb, gained, moved } = moveBoard(b, dir);
        if (!moved) return b;
        setPrev({ board: cloneBoard(b), score });
        const gainedScore = score + gained;
        setScore(gainedScore);
        const spawned = spawnRandom(nb);
        if (hasWon(spawned)) setWon(true);
        if (!canMove(spawned)) setOver(true);
        return spawned;
      });
    },
    [over, won, keepGoing, score]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        doMove("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        doMove("down");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        doMove("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        doMove("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  const newGame = () => {
    let b = emptyBoard();
    b = spawnRandom(b);
    b = spawnRandom(b);
    setBoard(b);
    setScore(0);
    setWon(false);
    setKeepGoing(false);
    setOver(false);
    setPrev(null);
  };

  const undo = () => {
    if (!prev) return;
    setBoard(prev.board);
    setScore(prev.score);
    setPrev(null);
    setOver(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };

  const dirBtn =
    "flex h-11 w-11 items-center justify-center rounded-md border border-stone-200 bg-white text-lg text-stone-900 active:bg-stone-100";

  return (
    <div className="p-4 text-stone-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">2048</h2>
        <div className="flex gap-2 text-sm">
          <div className="rounded-md border border-stone-200 px-3 py-1">
            คะแนน <span className="tabular-nums font-bold">{score}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ดีที่สุด <span className="tabular-nums font-bold">{best}</span>
          </div>
        </div>
      </div>

      {(won || over) && (
        <div className="mb-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-center text-sm">
          {over ? (
            <span>จบเกม ไม่มีทางเดินแล้ว</span>
          ) : won && !keepGoing ? (
            <span>
              คุณชนะแล้ว ได้ 2048!{" "}
              <button
                onClick={() => setKeepGoing(true)}
                className="ml-1 underline underline-offset-2"
              >
                เล่นต่อ
              </button>
            </span>
          ) : null}
        </div>
      )}

      <div
        className="mx-auto grid max-w-[320px] grid-cols-4 gap-2 rounded-md border border-stone-200 bg-white p-2 touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {board.flat().map((v, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-md text-xl font-bold tabular-nums ${tileColor(v)} ${v >= 1024 ? "text-base" : ""}`}
          >
            {v !== 0 ? v : ""}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={newGame}
          className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          เริ่มใหม่
        </button>
        <button
          onClick={undo}
          disabled={!prev}
          className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 disabled:opacity-40"
        >
          ย้อนกลับ 1 ก้าว
        </button>
      </div>

      <div className="mt-4 flex flex-col items-center gap-1">
        <button onClick={() => doMove("up")} className={dirBtn} aria-label="ขึ้น">
          ▲
        </button>
        <div className="flex gap-2">
          <button onClick={() => doMove("left")} className={dirBtn} aria-label="ซ้าย">
            ◀
          </button>
          <button onClick={() => doMove("down")} className={dirBtn} aria-label="ลง">
            ▼
          </button>
          <button onClick={() => doMove("right")} className={dirBtn} aria-label="ขวา">
            ▶
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          เล่นด้วยปุ่มลูกศร ปุ่มด้านบน หรือปัดนิ้วบนกระดาน
        </p>
      </div>
    </div>
  );
}
