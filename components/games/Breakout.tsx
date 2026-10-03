"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "playing" | "paused" | "gameover";

const W = 480;
const H = 360;
const BEST_KEY = "mg-breakout-best";
const ROWS = 3;
const COLS = 6;
const BRICK_COLORS = ["#a8a29e", "#57534e", "#1c1917"];

interface Brick {
  alive: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GameState {
  paddleX: number;
  paddleW: number;
  paddleH: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  ballR: number;
  bricks: Brick[];
  running: boolean;
}

function buildBricks(): Brick[] {
  const gap = 6;
  const top = 44;
  const side = 16;
  const bw = (W - side * 2 - gap * (COLS - 1)) / COLS;
  const bh = 20;
  const bricks: Brick[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      bricks.push({
        alive: true,
        x: side + c * (bw + gap),
        y: top + r * (bh + gap),
        w: bw,
        h: bh,
      });
  return bricks;
}

function baseSpeed(level: number): number {
  return 3.2 + (level - 1) * 0.7;
}

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameState>({
    paddleX: W / 2 - 40,
    paddleW: 80,
    paddleH: 10,
    ballX: W / 2,
    ballY: H - 60,
    ballVX: 2.4,
    ballVY: -3.2,
    ballR: 6,
    bricks: buildBricks(),
    running: false,
  });
  const keys = useRef({ left: false, right: false });
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const statusRef = useRef<Status>("idle");
  const noticeRef = useRef<string | null>(null);
  const noticeUntil = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState<string | null>(null);

  const setStatusBoth = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
  };

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (!Number.isNaN(v)) setBest(v);
    } catch {
      /* ignore */
    }
  }, []);

  const saveBest = (s: number) => {
    setBest((b) => {
      if (s > b) {
        try {
          localStorage.setItem(BEST_KEY, String(s));
        } catch {
          /* ignore */
        }
        return s;
      }
      return b;
    });
  };

  const resetBall = (lvl: number) => {
    const g = game.current;
    const sp = baseSpeed(lvl);
    g.ballX = W / 2;
    g.ballY = H - 60;
    g.ballVX = (Math.random() < 0.5 ? -1 : 1) * sp * 0.75;
    g.ballVY = -sp;
    g.paddleX = W / 2 - g.paddleW / 2;
  };

  const startGame = () => {
    game.current.bricks = buildBricks();
    levelRef.current = 1;
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setLevel(1);
    resetBall(1);
    game.current.running = true;
    noticeRef.current = null;
    setNotice(null);
    setStatusBoth("playing");
  };

  const togglePause = () => {
    if (statusRef.current === "playing") {
      game.current.running = false;
      setStatusBoth("paused");
    } else if (statusRef.current === "paused") {
      game.current.running = true;
      setStatusBoth("playing");
    }
  };

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const update = () => {
      const g = game.current;
      // paddle keyboard
      const speed = 6;
      if (keys.current.left) g.paddleX -= speed;
      if (keys.current.right) g.paddleX += speed;
      g.paddleX = Math.max(0, Math.min(W - g.paddleW, g.paddleX));

      g.ballX += g.ballVX;
      g.ballY += g.ballVY;

      // walls
      if (g.ballX - g.ballR < 0) {
        g.ballX = g.ballR;
        g.ballVX = Math.abs(g.ballVX);
      }
      if (g.ballX + g.ballR > W) {
        g.ballX = W - g.ballR;
        g.ballVX = -Math.abs(g.ballVX);
      }
      if (g.ballY - g.ballR < 0) {
        g.ballY = g.ballR;
        g.ballVY = Math.abs(g.ballVY);
      }

      // paddle
      const py = H - 24;
      if (
        g.ballVY > 0 &&
        g.ballY + g.ballR >= py &&
        g.ballY + g.ballR <= py + g.paddleH + 8 &&
        g.ballX >= g.paddleX - g.ballR &&
        g.ballX <= g.paddleX + g.paddleW + g.ballR
      ) {
        const rel = (g.ballX - (g.paddleX + g.paddleW / 2)) / (g.paddleW / 2);
        const sp = Math.hypot(g.ballVX, g.ballVY) || baseSpeed(levelRef.current);
        const angle = rel * 1.0; // -1..1
        g.ballVX = sp * Math.sin(angle) * 0.9 + rel * 1.2;
        g.ballVY = -Math.abs(sp * Math.cos(angle) * 0.9) - 0.5;
        g.ballY = py - g.ballR;
      }

      // bricks
      for (const b of g.bricks) {
        if (!b.alive) continue;
        if (
          g.ballX + g.ballR > b.x &&
          g.ballX - g.ballR < b.x + b.w &&
          g.ballY + g.ballR > b.y &&
          g.ballY - g.ballR < b.y + b.h
        ) {
          b.alive = false;
          g.ballVY = -g.ballVY;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          saveBest(scoreRef.current);
          break;
        }
      }

      // level clear
      if (g.bricks.every((b) => !b.alive) && g.running) {
        levelRef.current += 1;
        setLevel(levelRef.current);
        g.bricks = buildBricks();
        resetBall(levelRef.current);
        noticeRef.current = `ผ่านด่าน ไปด่านที่ ${levelRef.current}`;
        noticeUntil.current = Date.now() + 1500;
        setNotice(noticeRef.current);
      }

      // fall
      if (g.ballY - g.ballR > H) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          g.running = false;
          setStatusBoth("gameover");
        } else {
          resetBall(levelRef.current);
        }
      }

      if (noticeRef.current && Date.now() > noticeUntil.current) {
        noticeRef.current = null;
        setNotice(null);
      }
    };

    const draw = () => {
      const g = game.current;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      g.bricks.forEach((b, i) => {
        if (!b.alive) return;
        const row = Math.floor(i / COLS);
        ctx.fillStyle = BRICK_COLORS[row % BRICK_COLORS.length];
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      // paddle
      ctx.fillStyle = "#1c1917";
      const py = H - 24;
      ctx.fillRect(g.paddleX, py, g.paddleW, g.paddleH);

      // ball
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, g.ballR, 0, Math.PI * 2);
      ctx.fillStyle = "#1c1917";
      ctx.fill();

      // border line top area handled by css; draw status text
      if (statusRef.current === "idle") {
        ctx.fillStyle = "#57534e";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("กด เริ่มเกม เพื่อเล่น", W / 2, H / 2);
      } else if (statusRef.current === "gameover") {
        ctx.fillStyle = "#1c1917";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("จบเกม", W / 2, H / 2 - 8);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#57534e";
        ctx.fillText(`คะแนน ${scoreRef.current} — กดเริ่มใหม่เพื่อเล่นอีกครั้ง`, W / 2, H / 2 + 16);
      }
      if (noticeRef.current) {
        ctx.fillStyle = "#1c1917";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(noticeRef.current, W / 2, H / 2);
      }
    };

    const loop = () => {
      if (game.current.running) update();
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        keys.current.left = true;
        if (statusRef.current === "playing") e.preventDefault();
      } else if (e.key === "ArrowRight") {
        keys.current.right = true;
        if (statusRef.current === "playing") e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.current.left = false;
      else if (e.key === "ArrowRight") keys.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePaddleToClientX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    game.current.paddleX = Math.max(
      0,
      Math.min(W - game.current.paddleW, x - game.current.paddleW / 2)
    );
  };

  return (
    <div className="p-4 text-stone-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">เบรกเอาต์</h2>
        <div className="flex gap-2 text-sm">
          <div className="rounded-md border border-stone-200 px-3 py-1">
            คะแนน <span className="tabular-nums font-bold">{score}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ดีที่สุด <span className="tabular-nums font-bold">{best}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ด่าน <span className="tabular-nums font-bold">{level}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ชีวิต <span className="tabular-nums font-bold">{lives}</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[480px]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onMouseMove={(e) => movePaddleToClientX(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches[0]) movePaddleToClientX(e.touches[0].clientX);
          }}
          className="h-auto w-full touch-none rounded-md border border-stone-200 bg-white"
        />
        {(status === "paused" || notice) && status !== "gameover" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-medium">
              {status === "paused" ? "หยุดชั่วคราว" : notice}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {status === "idle" || status === "gameover" ? (
          <button
            onClick={startGame}
            className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            {status === "gameover" ? "เริ่มใหม่" : "เริ่มเกม"}
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              {status === "paused" ? "เล่นต่อ" : "หยุด"}
            </button>
            <button
              onClick={startGame}
              className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900"
            >
              เริ่มใหม่
            </button>
          </>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-stone-500">
        เลื่อนแป้นด้วยเมาส์ นิ้ว หรือปุ่มลูกศรซ้ายขวา ทำลายอิฐให้หมดเพื่อขึ้นด่านใหม่
      </p>
    </div>
  );
}
