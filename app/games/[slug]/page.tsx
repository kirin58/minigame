import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { CAT_STYLE, GAMES, getGame } from "@/lib/games";
import GameView from "@/components/GameView";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export default function GamePage({ params }: { params: { slug: string } }) {
  const game = getGame(params.slug);
  if (!game) notFound();
  const style = CAT_STYLE[game!.category];
  const others = GAMES.filter((g) => g.slug !== params.slug).slice(0, 3);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <nav className="anim-rise text-[13px] text-stone-500">
        <a href="/" className="hover:text-stone-900 hover:underline">
          เกมทั้งหมด
        </a>
        <span className="mx-2">/</span>
        <span className="text-stone-900">{game!.thai}</span>
      </nav>

      <div className="anim-rise mt-4 flex flex-wrap items-end justify-between gap-3" style={{ "--d": "60ms" } as CSSProperties}>
        <div>
          <p className="flex items-center gap-2 font-mono text-[12px] tabular text-stone-400">
            {game!.no}
            <span
              className={`flex items-center gap-1.5 rounded border px-1.5 py-0.5 font-sans text-[11px] ${style.chip}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {game!.category}
            </span>
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {game!.thai}{" "}
            <span className="font-normal text-stone-400">{game!.title}</span>
          </h1>
          <p className="mt-2 max-w-lg text-[14px] text-stone-600">{game!.desc}</p>
        </div>
        <div className="flex gap-2 text-[12px] text-stone-500">
          <span className="rounded border border-stone-200 bg-white px-2 py-1 tabular">
            {game!.players}
          </span>
          <span className="rounded border border-stone-200 bg-white px-2 py-1 tabular">
            {game!.time}
          </span>
          <span className="rounded border border-stone-200 bg-white px-2 py-1">
            {game!.level}
          </span>
        </div>
      </div>

      <div className="anim-fade mt-6" style={{ "--d": "120ms" } as CSSProperties}>
        <div className={`h-1 rounded-t-md ${style.dot}`} aria-hidden />
        <div className="-mt-px">
          <GameView slug={game!.slug} />
        </div>
      </div>

      <div className="mt-10 border-t border-stone-200 pt-6">
        <h2 className="text-sm font-medium text-stone-500">เล่นเกมอื่นต่อ</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {others.map((o, i) => {
            const s = CAT_STYLE[o.category];
            return (
              <a
                key={o.slug}
                href={`/games/${o.slug}`}
                style={{ "--d": `${i * 60}ms` } as CSSProperties}
                className={`card-lift anim-rise rounded-md border border-stone-200 bg-white p-4 hover:border-stone-900 ${s.hover}`}
              >
                <p className="flex items-center justify-between font-mono text-[11px] tabular text-stone-400">
                  {o.no}
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                </p>
                <p className="mt-1 text-[14px] font-semibold">
                  {o.thai}{" "}
                  <span className="font-normal text-stone-400">{o.title}</span>
                </p>
                <p className="mt-1 line-clamp-1 text-[13px] text-stone-500">
                  {o.desc}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
