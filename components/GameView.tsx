"use client";

import dynamic from "next/dynamic";

const MAP: Record<string, any> = {
  snake: dynamic(() => import("@/components/games/Snake"), { ssr: false }),
  tictactoe: dynamic(() => import("@/components/games/TicTacToe"), {
    ssr: false,
  }),
  memory: dynamic(() => import("@/components/games/Memory"), { ssr: false }),
  "2048": dynamic(() => import("@/components/games/Game2048"), { ssr: false }),
  minesweeper: dynamic(() => import("@/components/games/Minesweeper"), {
    ssr: false,
  }),
  breakout: dynamic(() => import("@/components/games/Breakout"), {
    ssr: false,
  }),
  simon: dynamic(() => import("@/components/games/Simon"), { ssr: false }),
  whack: dynamic(() => import("@/components/games/Whack"), { ssr: false }),
  rps: dynamic(() => import("@/components/games/Rps"), { ssr: false }),
  hangman: dynamic(() => import("@/components/games/Hangman"), { ssr: false }),
  guess: dynamic(() => import("@/components/games/Guess"), { ssr: false }),
  reaction: dynamic(() => import("@/components/games/Reaction"), {
    ssr: false,
  }),
};

export default function GameView({ slug }: { slug: string }) {
  const C = MAP[slug];
  if (!C) return null;
  return (
    <div className="rounded-md border border-stone-200 bg-white">
      <C />
    </div>
  );
}
