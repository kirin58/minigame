"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Level = "easy" | "medium";
type Status = "ready" | "playing" | "won" | "lost";

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

const LEVELS: Record<Level, { rows: number; cols: number; mines: number; label: string }> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "ง่าย 9×9 / 10 ลูก" },
  medium: { rows: 12, cols: 12, mines: 20, label: "กลาง 12×12 / 20 ลูก" },
};

const NUM_COLORS: Record<number, string> = {
  1: "text-stone-700",
  2: "text-stone-900",
  3: "text-neutral-800",
  4: "text-neutral-700",
  5: "text-neutral-600",
  6: "text-neutral-500",
  7: "text-black",
  8: "text-black",
};

function makeEmpty(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  );
}

function neighbors(rows: number, cols: number, r: number, c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
    }
  return out;
}

export default function Minesweeper() {
  const [level, setLevel] = useState<Level>("easy");
  const cfg = LEVELS[level];
  const [board, setBoard] = useState<Cell[][]>(() => makeEmpty(9, 9));
  const [status, setStatus] = useState<Status>("ready");
  const [minesPlaced, setMinesPlaced] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [mode, setMode] = useState<"reveal" | "flag">("reveal");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const reset = useCallback(
    (lv: Level = level) => {
      const c = LEVELS[lv];
      setBoard(makeEmpty(c.rows, c.cols));
      setStatus("ready");
      setMinesPlaced(false);
      setSeconds(0);
    },
    [level]
  );

  const changeLevel = (lv: Level) => {
    setLevel(lv);
    const c = LEVELS[lv];
    setBoard(makeEmpty(c.rows, c.cols));
    setStatus("ready");
    setMinesPlaced(false);
    setSeconds(0);
  };

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const placeMines = (b: Cell[][], safeR: number, safeC: number): Cell[][] => {
    const { rows, cols, mines } = cfg;
    const next = b.map((row) => row.map((cell) => ({ ...cell })));
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if ((r === safeR && c === safeC) || next[r][c].mine) continue;
      next[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        next[r][c].adjacent = neighbors(rows, cols, r, c).filter(
          ([nr, nc]) => next[nr][nc].mine
        ).length;
    return next;
  };

  const floodReveal = (b: Cell[][], sr: number, sc: number) => {
    const { rows, cols } = cfg;
    const stack: [number, number][] = [[sr, sc]];
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const cell = b[r][c];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      if (!cell.mine && cell.adjacent === 0) {
        for (const [nr, nc] of neighbors(rows, cols, r, c)) {
          if (!b[nr][nc].revealed && !b[nr][nc].flagged) stack.push([nr, nc]);
        }
      }
    }
  };

  const checkWin = (b: Cell[][]): boolean => {
    for (let r = 0; r < cfg.rows; r++)
      for (let c = 0; c < cfg.cols; c++) {
        const cell = b[r][c];
        if (!cell.mine && !cell.revealed) return false;
      }
    return true;
  };

  const reveal = (r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    let b = board.map((row) => row.map((cell) => ({ ...cell })));
    if (!minesPlaced) {
      b = placeMines(b, r, c);
      setMinesPlaced(true);
      setStatus("playing");
    }
    const cell = b[r][c];
    if (cell.revealed || cell.flagged) {
      setBoard(b);
      return;
    }
    if (cell.mine) {
      // แพ้: เปิดระเบิดทั้งหมด
      b.forEach((row) => row.forEach((x) => x.mine && (x.revealed = true)));
      setBoard(b);
      setStatus("lost");
      return;
    }
    floodReveal(b, r, c);
    if (status === "ready") setStatus("playing");
    if (checkWin(b)) {
      setStatus("won");
    } else if (status === "ready") {
      setStatus("playing");
    }
    setBoard(b);
  };

  const toggleFlag = (r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    if (board[r][c].revealed) return;
    const b = board.map((row) => row.map((cell) => ({ ...cell })));
    b[r][c].flagged = !b[r][c].flagged;
    setBoard(b);
  };

  const handleTap = (r: number, c: number) => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (mode === "flag") toggleFlag(r, c);
    else reveal(r, c);
  };

  const onTouchStartCell = (r: number, c: number) => {
    longPressed.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      toggleFlag(r, c);
    }, 450);
  };

  const onTouchEndCell = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const flagCount = board.flat().filter((x) => x.flagged).length;
  const remaining = cfg.mines - flagCount;

  return (
    <div className="p-4 text-stone-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">กู้ระเบิด</h2>
        <div className="flex gap-2 text-sm">
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ธงเหลือ <span className="tabular-nums font-bold">{remaining}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            เวลา <span className="tabular-nums font-bold">{seconds}</span> วินาที
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 text-sm">
        {(Object.keys(LEVELS) as Level[]).map((lv) => (
          <button
            key={lv}
            onClick={() => changeLevel(lv)}
            className={`rounded-md border px-3 py-1.5 ${
              level === lv
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-900"
            }`}
          >
            {LEVELS[lv].label}
          </button>
        ))}
      </div>

      {(status === "won" || status === "lost") && (
        <div className="mb-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-center text-sm font-medium">
          {status === "won"
            ? `ชนะแล้ว ใช้เวลา ${seconds} วินาที`
            : "แพ้ ระเบิดทำงาน"}
        </div>
      )}

      <div className="flex justify-center overflow-x-auto">
        <div
          className="grid gap-1 rounded-md border border-stone-200 bg-white p-2"
          style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleTap(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(r, c);
                }}
                onTouchStart={() => onTouchStartCell(r, c)}
                onTouchEnd={onTouchEndCell}
                onTouchMove={onTouchEndCell}
                className={`flex h-8 w-8 items-center justify-center rounded-sm border text-sm font-bold tabular-nums select-none ${
                  cell.revealed
                    ? cell.mine
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white"
                    : "border-stone-200 bg-stone-100 active:bg-stone-200"
                } ${cell.revealed && !cell.mine ? NUM_COLORS[cell.adjacent] ?? "text-stone-900" : "text-stone-900"}`}
                aria-label={`ช่อง ${r + 1},${c + 1}`}
              >
                {cell.revealed
                  ? cell.mine
                    ? "●"
                    : cell.adjacent > 0
                      ? cell.adjacent
                      : ""
                  : cell.flagged
                    ? "⚑"
                    : ""}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div className="flex rounded-md border border-stone-200 text-sm">
          <button
            onClick={() => setMode("reveal")}
            className={`rounded-l-md px-3 py-2 ${mode === "reveal" ? "bg-stone-900 text-white" : "bg-white text-stone-900"}`}
          >
            โหมดเปิด
          </button>
          <button
            onClick={() => setMode("flag")}
            className={`rounded-r-md px-3 py-2 ${mode === "flag" ? "bg-stone-900 text-white" : "bg-white text-stone-900"}`}
          >
            โหมดธง
          </button>
        </div>
        <button
          onClick={() => reset()}
          className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          เริ่มใหม่
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-stone-500">
        คลิกซ้ายเปิดช่อง คลิกขวาหรือกดค้างเพื่อปักธง คลิกแรกปลอดภัยเสมอ
      </p>
    </div>
  );
}
