"use client";

import { useCallback, useEffect, useState } from "react";

type Choice = "rock" | "scissors" | "paper";
type Result = "win" | "lose" | "draw";

type Round = { player: Choice; bot: Choice; result: Result };
type Stats = { w: number; l: number; d: number };

const STATS_KEY = "mg-rps-stats";
const WIN_TARGET = 3;
const CHOICES: Choice[] = ["rock", "scissors", "paper"];

const LABEL: Record<Choice, string> = {
  rock: "ค้อน",
  scissors: "กรรไกร",
  paper: "กระดาษ",
};

function beats(a: Choice, b: Choice): Result {
  if (a === b) return "draw";
  if (
    (a === "rock" && b === "scissors") ||
    (a === "scissors" && b === "paper") ||
    (a === "paper" && b === "rock")
  )
    return "win";
  return "lose";
}

function randomChoice(): Choice {
  return CHOICES[Math.floor(Math.random() * 3)];
}

function counterTo(c: Choice): Choice {
  if (c === "rock") return "paper";
  if (c === "paper") return "scissors";
  return "rock";
}

function smartBot(playerHistory: Choice[]): Choice {
  if (playerHistory.length < 2) return randomChoice();
  const recent = playerHistory.slice(-5);
  const count: Record<Choice, number> = { rock: 0, scissors: 0, paper: 0 };
  recent.forEach((c) => {
    count[c] += 1;
  });
  let top: Choice = "rock";
  let topN = -1;
  (Object.keys(count) as Choice[]).forEach((c) => {
    if (count[c] > topN) {
      topN = count[c];
      top = c;
    }
  });
  // 70% ดักทางที่ผู้เล่นออกบ่อย, 30% สุ่ม
  if (Math.random() < 0.7) return counterTo(top);
  return randomChoice();
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { w: 0, l: 0, d: 0 };
    const p = JSON.parse(raw) as Partial<Stats>;
    return {
      w: Number(p.w) || 0,
      l: Number(p.l) || 0,
      d: Number(p.d) || 0,
    };
  } catch {
    return { w: 0, l: 0, d: 0 };
  }
}

export default function Rps() {
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [playerMoves, setPlayerMoves] = useState<Choice[]>([]);
  const [smart, setSmart] = useState(true);
  const [stats, setStats] = useState<Stats>({ w: 0, l: 0, d: 0 });
  const [setWinner, setSetWinner] = useState<"player" | "bot" | null>(null);

  useEffect(() => {
    try {
      setStats(loadStats());
    } catch {
      /* ignore */
    }
  }, []);

  const persistStats = useCallback((s: Stats) => {
    setStats(s);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, []);

  const play = (player: Choice) => {
    if (setWinner) return;
    const bot = smart ? smartBot(playerMoves) : randomChoice();
    const result = beats(player, bot);
    const round: Round = { player, bot, result };
    const nextHistory = [round, ...history].slice(0, 10);
    setHistory(nextHistory);
    setPlayerMoves((m) => [...m, player].slice(-20));

    const np = playerScore + (result === "win" ? 1 : 0);
    const nb = botScore + (result === "lose" ? 1 : 0);
    setPlayerScore(np);
    setBotScore(nb);

    const ns: Stats = {
      w: stats.w + (result === "win" ? 1 : 0),
      l: stats.l + (result === "lose" ? 1 : 0),
      d: stats.d + (result === "draw" ? 1 : 0),
    };
    persistStats(ns);

    if (np >= WIN_TARGET) setSetWinner("player");
    else if (nb >= WIN_TARGET) setSetWinner("bot");
  };

  const newSet = () => {
    setPlayerScore(0);
    setBotScore(0);
    setHistory([]);
    setPlayerMoves([]);
    setSetWinner(null);
  };

  const resetStats = () => {
    persistStats({ w: 0, l: 0, d: 0 });
  };

  const resultText = (r: Result) =>
    r === "win" ? "คุณชนะ" : r === "lose" ? "บอทชนะ" : "เสมอ";

  return (
    <div className="p-4 text-stone-900">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">เป่ายิ้งฉุบ</h2>
        <span className="text-xs text-stone-500">ชนะ {WIN_TARGET} ใน 5 ก่อน</span>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md border border-stone-200 px-2 py-1.5">
          คุณ <span className="tabular font-bold">{playerScore}</span>
        </div>
        <div className="rounded-md border border-stone-200 px-2 py-1.5">
          บอท <span className="tabular font-bold">{botScore}</span>
        </div>
        <div className="rounded-md border border-stone-200 px-2 py-1.5 text-xs leading-6 text-stone-500">
          รวม <span className="tabular font-bold text-stone-900">{stats.w}</span>–
          <span className="tabular font-bold text-stone-900">{stats.l}</span>–
          <span className="tabular">{stats.d}</span>
        </div>
      </div>

      {setWinner ? (
        <div className="mb-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-center text-sm">
          {setWinner === "player" ? (
            <span>
              จบเซ็ต คุณชนะ {playerScore} ต่อ {botScore} ยินดีด้วย!
            </span>
          ) : (
            <span>
              จบเซ็ต บอทชนะ {botScore} ต่อ {playerScore} ลองอีกครั้ง!
            </span>
          )}
        </div>
      ) : (
        <p className="mb-3 text-center text-sm text-stone-600">
          {history.length === 0
            ? "เลือกค้อน กรรไกร หรือกระดาษเพื่อเริ่ม"
            : history[0].result === "win"
              ? "ตาที่แล้วคุณชนะ เลือกตาต่อไป"
              : history[0].result === "lose"
                ? "ตาที่แล้วบอทชนะ เลือกตาต่อไป"
                : "ตาที่แล้วเสมอ เลือกตาต่อไป"}
        </p>
      )}

      <div className="mx-auto grid max-w-[360px] grid-cols-3 gap-2">
        {CHOICES.map((c) => (
          <button
            key={c}
            onClick={() => play(c)}
            disabled={setWinner !== null}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-stone-200 bg-white text-stone-900 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-40"
          >
            <span className="text-base font-bold">{LABEL[c]}</span>
            <span className="text-[11px] text-stone-500">
              {c === "rock" ? "ชนะกรรไกร" : c === "scissors" ? "ชนะกระดาษ" : "ชนะค้อน"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {setWinner ? (
          <button
            onClick={newSet}
            className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            เล่นเซ็ตใหม่
          </button>
        ) : (
          <button
            onClick={newSet}
            className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900"
          >
            เริ่มเซ็ตใหม่
          </button>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={smart}
            onChange={(e) => setSmart(e.target.checked)}
            className="h-4 w-4 accent-stone-900"
          />
          บอทฉลาด
        </label>
      </div>
      <p className="mt-1 text-center text-xs text-stone-500">
        {smart ? "บอทฉลาด: อ่าน 5 ตาล่าสุดของคุณแล้วดักทาง" : "บอทสุ่มล้วน"}
      </p>

      <div className="mx-auto mt-4 max-w-[360px]">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold">ประวัติ {Math.min(history.length, 10)} ตาล่าสุด</h3>
          <button onClick={resetStats} className="text-xs text-stone-500 underline underline-offset-2">
            ล้างสถิติรวม
          </button>
        </div>
        {history.length === 0 ? (
          <p className="rounded-md border border-stone-200 px-3 py-2 text-center text-xs text-stone-500">
            ยังไม่มีประวัติ
          </p>
        ) : (
          <ol className="divide-y divide-stone-200 rounded-md border border-stone-200">
            {history.map((h, i) => (
              <li
                key={`${i}-${h.player}-${h.bot}`}
                className="flex items-center justify-between px-3 py-1.5 text-xs"
              >
                <span className="tabular text-stone-500">{history.length - i}</span>
                <span>
                  คุณ <span className="font-medium">{LABEL[h.player]}</span>
                  {" vs "}
                  บอท <span className="font-medium">{LABEL[h.bot]}</span>
                </span>
                <span
                  className={`rounded border px-2 py-0.5 font-medium ${
                    h.result === "win"
                      ? "border-stone-900 bg-stone-900 text-white"
                      : h.result === "lose"
                        ? "border-stone-200 bg-white text-stone-600"
                        : "border-stone-200 bg-stone-100 text-stone-600"
                  }`}
                >
                  {resultText(h.result)}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="tabular mt-2 text-center text-xs text-stone-500">
          สถิติรวม ชนะ {stats.w} / แพ้ {stats.l} / เสมอ {stats.d}
        </p>
      </div>
    </div>
  );
}
