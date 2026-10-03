"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Player = "X" | "O";
type Cell = Player | null;
type Mode = "pvp" | "pve";
type BotLevel = "random" | "block" | "minimax";
type Stats = { x: number; o: number; draws: number };

const STATS_KEY = "mg-tictactoe-stats";
const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board: Cell[]): { winner: Player | null; line: number[] | null; isDraw: boolean } {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line, isDraw: false };
    }
  }
  const isDraw = board.every((v) => v !== null);
  return { winner: null, line: null, isDraw };
}

function emptyCells(board: Cell[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) out.push(i);
  }
  return out;
}

function findWinningMove(board: Cell[], player: Player): number | null {
  for (const idx of emptyCells(board)) {
    const copy = board.slice();
    copy[idx] = player;
    if (getWinner(copy).winner === player) return idx;
  }
  return null;
}

function pickRandomMove(board: Cell[]): number | null {
  const empties = emptyCells(board);
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

function pickBlockMove(board: Cell[]): number | null {
  // 1) ถ้าบอท (O) จะชนะได้ ให้ลงชนะทันที
  const win = findWinningMove(board, "O");
  if (win !== null) return win;
  // 2) กันผู้เล่น (X) ที่กำลังจะชนะ
  const block = findWinningMove(board, "X");
  if (block !== null) return block;
  // 3) ยึดกลางก่อน แล้วค่อยมุม แล้วค่อยสุ่ม
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
  return pickRandomMove(board);
}

function minimax(board: Cell[], isMax: boolean, depth: number): number {
  const { winner, isDraw } = getWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (isDraw) return 0;

  if (isMax) {
    let best = -Infinity;
    for (const i of emptyCells(board)) {
      board[i] = "O";
      best = Math.max(best, minimax(board, false, depth + 1));
      board[i] = null;
    }
    return best;
  }
  let best = Infinity;
  for (const i of emptyCells(board)) {
    board[i] = "X";
    best = Math.min(best, minimax(board, true, depth + 1));
    board[i] = null;
  }
  return best;
}

function pickMinimaxMove(board: Cell[]): number | null {
  const empties = emptyCells(board);
  if (empties.length === 0) return null;
  let bestScore = -Infinity;
  let bestMove: number | null = null;
  const copy = board.slice();
  for (const i of empties) {
    copy[i] = "O";
    const score = minimax(copy, false, 0);
    copy[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function loadStats(): Stats {
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stats>;
      return {
        x: typeof parsed.x === "number" && parsed.x >= 0 ? parsed.x : 0,
        o: typeof parsed.o === "number" && parsed.o >= 0 ? parsed.o : 0,
        draws: typeof parsed.draws === "number" && parsed.draws >= 0 ? parsed.draws : 0,
      };
    }
  } catch {
    // อ่านไม่ได้ ใช้ค่าเริ่มต้น
  }
  return { x: 0, o: 0, draws: 0 };
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Cell[]>(Array<Cell>(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [mode, setMode] = useState<Mode>("pvp");
  const [botLevel, setBotLevel] = useState<BotLevel>("block");
  const [stats, setStats] = useState<Stats>({ x: 0, o: 0, draws: 0 });
  const [counted, setCounted] = useState<boolean>(false);

  const result = useMemo(() => getWinner(board), [board]);
  const gameOver = result.winner !== null || result.isDraw;

  useEffect(() => {
    setStats(loadStats());
  }, []);

  // นับสถิติเมื่อเกมจบ (ครั้งเดียวต่อกระดาน)
  useEffect(() => {
    if (!gameOver || counted) return;
    setCounted(true);
    setStats((prev) => {
      const next: Stats =
        result.winner === "X"
          ? { ...prev, x: prev.x + 1 }
          : result.winner === "O"
            ? { ...prev, o: prev.o + 1 }
            : { ...prev, draws: prev.draws + 1 };
      try {
        window.localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        // เงียบไว้
      }
      return next;
    });
  }, [gameOver, counted, result.winner]);

  const clearBoard = useCallback(() => {
    setBoard(Array<Cell>(9).fill(null));
    setTurn("X");
    setCounted(false);
  }, []);

  const resetStats = useCallback(() => {
    const zero: Stats = { x: 0, o: 0, draws: 0 };
    setStats(zero);
    try {
      window.localStorage.setItem(STATS_KEY, JSON.stringify(zero));
    } catch {
      // เงียบไว้
    }
  }, []);

  const place = useCallback(
    (index: number) => {
      if (board[index] !== null || gameOver) return;
      if (mode === "pve" && turn !== "X") return;
      const next = board.slice();
      next[index] = turn;
      setBoard(next);
      setTurn(turn === "X" ? "O" : "X");
    },
    [board, gameOver, mode, turn]
  );

  // ตาบอท
  useEffect(() => {
    if (mode !== "pve" || turn !== "O" || gameOver) return;
    const id = window.setTimeout(() => {
      let move: number | null = null;
      if (botLevel === "random") move = pickRandomMove(board);
      else if (botLevel === "block") move = pickBlockMove(board);
      else move = pickMinimaxMove(board);
      if (move !== null) {
        setBoard((prev) => {
          if (prev[move as number] !== null) return prev;
          const next = prev.slice();
          next[move as number] = "O";
          return next;
        });
        setTurn("X");
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [mode, turn, gameOver, board, botLevel]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setBoard(Array<Cell>(9).fill(null));
    setTurn("X");
    setCounted(false);
  };

  const switchLevel = (lv: BotLevel) => {
    setBotLevel(lv);
    setBoard(Array<Cell>(9).fill(null));
    setTurn("X");
    setCounted(false);
  };

  const statusText = result.winner
    ? `ผู้ชนะ: ${result.winner}`
    : result.isDraw
      ? "เสมอ"
      : mode === "pve" && turn === "O"
        ? "ตาบอท (O) กำลังคิด"
        : `ตาของ: ${turn}`;

  const botLabel: Record<BotLevel, string> = {
    random: "สุ่ม",
    block: "กันชนะ",
    minimax: "เก่งสุด",
  };
  const botLevels: BotLevel[] = ["random", "block", "minimax"];

  return (
    <div className="bg-white p-4 text-stone-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">โอเอกซ์</h2>
          <p className="text-sm text-stone-500">{statusText}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            X ชนะ: <span className="tabular font-semibold">{stats.x}</span>
          </span>
          <span>
            O ชนะ: <span className="tabular font-semibold">{stats.o}</span>
          </span>
          <span>
            เสมอ: <span className="tabular font-semibold">{stats.draws}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="mx-auto grid w-full max-w-[320px] grid-cols-3 gap-2">
          {board.map((cell, i) => {
            const inWin = result.line !== null && result.line.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => place(i)}
                aria-label={`ช่องที่ ${i + 1}`}
                className={`flex aspect-square items-center justify-center rounded-md border text-3xl font-semibold ${
                  inWin
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-900"
                }`}
              >
                <span className="tabular">{cell ?? ""}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-3">
          <div className="rounded-md border border-stone-200 p-3">
            <p className="mb-2 text-sm font-medium">โหมดการเล่น</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchMode("pvp")}
                aria-pressed={mode === "pvp"}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  mode === "pvp"
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 text-stone-700"
                }`}
              >
                เล่น 2 คน
              </button>
              <button
                type="button"
                onClick={() => switchMode("pve")}
                aria-pressed={mode === "pve"}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  mode === "pve"
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 text-stone-700"
                }`}
              >
                เล่นกับบอท
              </button>
            </div>
          </div>

          {mode === "pve" ? (
            <div className="rounded-md border border-stone-200 p-3">
              <p className="mb-2 text-sm font-medium">ระดับบอท (บอทเป็น O)</p>
              <div className="flex flex-wrap gap-2">
                {botLevels.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => switchLevel(lv)}
                    aria-pressed={botLevel === lv}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      botLevel === lv
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 text-stone-700"
                    }`}
                  >
                    {botLabel[lv]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-stone-500">
                สุ่ม: เดามั่ว กันชนะ: บุกชนะและตั้งรับ เก่งสุด: อ่านเกมเต็มกระดาน
              </p>
            </div>
          ) : null}

          <div className="rounded-md border border-stone-200 p-3">
            <p className="mb-2 text-sm font-medium">กระดาน</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={clearBoard}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              >
                ล้างกระดาน
              </button>
              <button
                type="button"
                onClick={resetStats}
                className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
              >
                รีเซ็ตสถิติ
              </button>
            </div>
            {gameOver ? (
              <p className="mt-2 text-sm text-stone-600">
                {result.winner
                  ? `ฝ่าย ${result.winner} ชนะ กดล้างกระดานเพื่อเล่นตาใหม่`
                  : "เสมอกัน กดล้างกระดานเพื่อเล่นตาใหม่"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
