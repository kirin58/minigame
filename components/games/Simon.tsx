"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "showing" | "input" | "over";

const BEST_KEY = "mg-simon-best";
const FREQS = [415.3, 311.13, 261.63, 209.0];
const NAMES = ["เขียว", "แดง", "เหลือง", "น้ำเงิน"];

const BASE = [
  "bg-green-600",
  "bg-red-600",
  "bg-yellow-500",
  "bg-blue-600",
];
const LIT = [
  "bg-green-300",
  "bg-red-300",
  "bg-yellow-200",
  "bg-blue-300",
];

function randPad(): number {
  return Math.floor(Math.random() * 4);
}

export default function Simon() {
  const [seq, setSeq] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState<number | null>(null);
  const [strict, setStrict] = useState(false);
  const [best, setBest] = useState(0);
  const [msg, setMsg] = useState("กดเริ่มเพื่อเล่น");
  const timers = useRef<number[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const seqRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("idle");
  const posRef = useRef(0);
  const strictRef = useRef(false);

  seqRef.current = seq;
  phaseRef.current = phase;
  posRef.current = pos;
  strictRef.current = strict;

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (!Number.isNaN(v) && v > 0) setBest(v);
    } catch {
      /* ignore */
    }
  }, []);

  const saveBest = useCallback(
    (round: number) => {
      if (round > best) {
        setBest(round);
        try {
          localStorage.setItem(BEST_KEY, String(round));
        } catch {
          /* ignore */
        }
      }
    },
    [best]
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const beep = useCallback((freq: number, dur = 0.28, when = 0) => {
    try {
      if (!audioRef.current) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return;
        audioRef.current = new AC();
      }
      const ctx = audioRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* ignore */
    }
  }, []);

  const errorBeep = useCallback(() => {
    beep(130, 0.4);
  }, [beep]);

  const flashPad = useCallback(
    (i: number, delay: number) => {
      const t1 = window.setTimeout(() => {
        setLit(i);
        beep(FREQS[i], 0.28);
      }, delay);
      const t2 = window.setTimeout(() => {
        setLit(null);
      }, delay + 320);
      timers.current.push(t1, t2);
    },
    [beep]
  );

  const playSequence = useCallback(
    (s: number[]) => {
      clearTimers();
      setPhase("showing");
      setPos(0);
      setLit(null);
      setMsg(`จำลำดับ ${s.length} ขั้น`);
      s.forEach((pad, idx) => {
        flashPad(pad, 500 + idx * 600);
      });
      const done = window.setTimeout(() => {
        setLit(null);
        setPhase("input");
        setMsg("ตาคุณ กดตามลำดับ");
      }, 500 + s.length * 600 + 150);
      timers.current.push(done);
    },
    [clearTimers, flashPad]
  );

  const start = useCallback(() => {
    clearTimers();
    const s = [randPad()];
    setSeq(s);
    setPos(0);
    setMsg(`รอบที่ 1`);
    playSequence(s);
  }, [clearTimers, playSequence]);

  const handlePad = (i: number) => {
    if (phaseRef.current !== "input") return;
    beep(FREQS[i], 0.22);
    setLit(i);
    window.setTimeout(() => setLit(null), 180);
    const s = seqRef.current;
    const p = posRef.current;
    if (s[p] === i) {
      const next = p + 1;
      if (next >= s.length) {
        // จบรอบ
        const round = s.length;
        saveBest(round);
        setPhase("showing");
        setMsg("ถูกต้อง! ไปรอบถัดไป");
        const extended = [...s, randPad()];
        const t = window.setTimeout(() => {
          setSeq(extended);
          playSequence(extended);
        }, 800);
        timers.current.push(t);
        setPos(0);
      } else {
        setPos(next);
      }
    } else {
      // กดผิด
      errorBeep();
      if (strictRef.current) {
        saveBest(Math.max(0, s.length - 0));
        // strict: จบเกม เริ่มใหม่จาก 1
        setPhase("over");
        setMsg(`ผิด! จบเกมที่รอบ ${s.length} (โหมดเข้มงวด)`);
        saveBest(s.length);
      } else {
        // ปกติ: ซ้ำรอบเดิม
        setPhase("showing");
        setMsg(`ผิด! ดูลำดับรอบ ${s.length} อีกครั้ง`);
        const t = window.setTimeout(() => {
          playSequence([...s]);
        }, 900);
        timers.current.push(t);
      }
    }
  };

  const round = seq.length;

  return (
    <div className="p-4 text-stone-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">ไซมอนจำลำดับ</h2>
        <div className="flex gap-2 text-sm">
          <div className="rounded-md border border-stone-200 px-3 py-1">
            รอบ <span className="tabular font-bold">{round === 0 ? "–" : round}</span>
          </div>
          <div className="rounded-md border border-stone-200 px-3 py-1">
            ดีที่สุด <span className="tabular font-bold">{best}</span>
          </div>
        </div>
      </div>

      <p className="mb-3 text-center text-sm text-stone-600">{msg}</p>
      {phase === "input" && seq.length > 0 && (
        <p className="tabular mb-3 text-center text-xs text-stone-500">
          กดไป {pos} / {seq.length}
        </p>
      )}

      <div className="mx-auto grid max-w-[300px] grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => handlePad(i)}
            disabled={phase === "showing"}
            aria-label={NAMES[i]}
            className={`flex aspect-square items-center justify-center rounded-md border text-sm font-medium transition-colors ${
              lit === i
                ? `${LIT[i]} border-stone-900`
                : `${BASE[i]} border-stone-200 text-white`
            } disabled:opacity-90`}
          >
            <span
              className={`rounded border px-2 py-0.5 text-xs ${
                lit === i
                  ? "border-stone-900 bg-white text-stone-900"
                  : "border-white/40 bg-black/20 text-white"
              }`}
            >
              {NAMES[i]}
            </span>
          </button>
        ))}
      </div>

      {phase === "over" && (
        <div className="mx-auto mt-3 max-w-[300px] rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-center text-sm">
          จบเกม ได้ถึงรอบ <span className="tabular font-bold">{round}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={start}
          className="rounded-md border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          {seq.length === 0 ? "เริ่มเกม" : "เริ่มใหม่"}
        </button>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={strict}
            onChange={(e) => setStrict(e.target.checked)}
            className="h-4 w-4 accent-stone-900"
          />
          โหมดเข้มงวด
        </label>
      </div>
      <p className="mt-2 text-center text-xs text-stone-500">
        {strict
          ? "เข้มงวด: กดผิดจบเกม เริ่มใหม่จากรอบ 1"
          : "ปกติ: กดผิดได้ดูลำดับรอบเดิมอีกครั้ง"}
      </p>
    </div>
  );
}
