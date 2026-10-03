"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = { word: string; hint: string; cat: string };

const WORDS: Entry[] = [
  // หมวดสัตว์
  { word: "ELEPHANT", hint: "ช้าง มีงวงยาว", cat: "สัตว์" },
  { word: "TIGER", hint: "เสือลายพาดกลอน", cat: "สัตว์" },
  { word: "LION", hint: "สิงโต เจ้าป่า", cat: "สัตว์" },
  { word: "MONKEY", hint: "ลิง ชอบปีนต้นไม้", cat: "สัตว์" },
  { word: "GIRAFFE", hint: "ยีราฟ คอยาว", cat: "สัตว์" },
  { word: "ZEBRA", hint: "ม้าลาย", cat: "สัตว์" },
  { word: "PANDA", hint: "แพนด้า กินไผ่", cat: "สัตว์" },
  { word: "KANGAROO", hint: "จิงโจ้ กระโดดเก่ง", cat: "สัตว์" },
  { word: "CROCODILE", hint: "จระเข้", cat: "สัตว์" },
  { word: "DOLPHIN", hint: "โลมา ฉลาดมาก", cat: "สัตว์" },
  { word: "RABBIT", hint: "กระต่าย หูยาว", cat: "สัตว์" },
  { word: "TURTLE", hint: "เต่า เดินช้า", cat: "สัตว์" },
  { word: "EAGLE", hint: "นกอินทรี", cat: "สัตว์" },
  { word: "PENGUIN", hint: "เพนกวิน ขั้วโลก", cat: "สัตว์" },
  { word: "SNAKE", hint: "งู ไม่มีขา", cat: "สัตว์" },
  // หมวดผลไม้
  { word: "APPLE", hint: "แอปเปิล ผลสีแดง", cat: "ผลไม้" },
  { word: "BANANA", hint: "กล้วย", cat: "ผลไม้" },
  { word: "ORANGE", hint: "ส้ม", cat: "ผลไม้" },
  { word: "MANGO", hint: "มะม่วง", cat: "ผลไม้" },
  { word: "PAPAYA", hint: "มะละกอ", cat: "ผลไม้" },
  { word: "DURIAN", hint: "ทุเรียน ราชาผลไม้", cat: "ผลไม้" },
  { word: "WATERMELON", hint: "แตงโม ลูกใหญ่เนื้อแดง", cat: "ผลไม้" },
  { word: "PINEAPPLE", hint: "สับปะรด", cat: "ผลไม้" },
  { word: "COCONUT", hint: "มะพร้าว", cat: "ผลไม้" },
  { word: "GRAPE", hint: "องุ่น เป็นพวง", cat: "ผลไม้" },
  { word: "STRAWBERRY", hint: "สตรอว์เบอร์รี สีแดง", cat: "ผลไม้" },
  { word: "LEMON", hint: "มะนาว เปรี้ยว", cat: "ผลไม้" },
  { word: "LYCHEE", hint: "ลิ้นจี่", cat: "ผลไม้" },
  { word: "LONGAN", hint: "ลำไย", cat: "ผลไม้" },
  { word: "MANGOSTEEN", hint: "มังคุด ราชินีผลไม้", cat: "ผลไม้" },
  // หมวดอาชีพ
  { word: "TEACHER", hint: "ครู สอนนักเรียน", cat: "อาชีพ" },
  { word: "DOCTOR", hint: "หมอ รักษาคนไข้", cat: "อาชีพ" },
  { word: "NURSE", hint: "พยาบาล", cat: "อาชีพ" },
  { word: "ENGINEER", hint: "วิศวกร", cat: "อาชีพ" },
  { word: "FARMER", hint: "ชาวนา ทำนา", cat: "อาชีพ" },
  { word: "CHEF", hint: "พ่อครัว ทำอาหาร", cat: "อาชีพ" },
  { word: "PILOT", hint: "นักบิน ขับเครื่องบิน", cat: "อาชีพ" },
  { word: "POLICE", hint: "ตำรวจ", cat: "อาชีพ" },
  { word: "SOLDIER", hint: "ทหาร", cat: "อาชีพ" },
  { word: "ARTIST", hint: "ศิลปิน วาดรูป", cat: "อาชีพ" },
  { word: "WRITER", hint: "นักเขียน", cat: "อาชีพ" },
  { word: "SINGER", hint: "นักร้อง", cat: "อาชีพ" },
  { word: "DRIVER", hint: "คนขับรถ", cat: "อาชีพ" },
  { word: "LAWYER", hint: "ทนายความ", cat: "อาชีพ" },
  { word: "PHOTOGRAPHER", hint: "ช่างภาพ ถ่ายรูป", cat: "อาชีพ" },
];

const MAX_WRONG = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STATS_KEY = "mg-hangman-stats";

type Stats = { wins: number; streak: number; best: number };

function loadStats(): Stats {
  if (typeof window === "undefined") return { wins: 0, streak: 0, best: 0 };
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { wins: 0, streak: 0, best: 0 };
    const p = JSON.parse(raw) as Partial<Stats>;
    return {
      wins: typeof p.wins === "number" ? p.wins : 0,
      streak: typeof p.streak === "number" ? p.streak : 0,
      best: typeof p.best === "number" ? p.best : 0,
    };
  } catch {
    return { wins: 0, streak: 0, best: 0 };
  }
}

function pickIndex(exclude: number): number {
  if (WORDS.length <= 1) return 0;
  let i = Math.floor(Math.random() * WORDS.length);
  let guard = 0;
  while (i === exclude && guard < 10) {
    i = Math.floor(Math.random() * WORDS.length);
    guard += 1;
  }
  return i;
}

export default function Hangman() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * WORDS.length)
  );
  const [guessed, setGuessed] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ wins: 0, streak: 0, best: 0 });
  const [counted, setCounted] = useState(false);

  const entry = WORDS[index];
  const word = entry.word;

  const wrongLetters = guessed.filter((l) => !word.includes(l));
  const wrongCount = wrongLetters.length;
  const correctCount = word
    .split("")
    .filter((ch, i) => word.indexOf(ch) === i && guessed.includes(ch)).length;
  void correctCount;

  const won = word.split("").every((ch) => guessed.includes(ch));
  const lost = wrongCount >= MAX_WRONG;
  const over = won || lost;

  useEffect(() => {
    setStats(loadStats());
  }, []);

  useEffect(() => {
    if (!over || counted) return;
    setCounted(true);
    setStats((prev) => {
      let next: Stats;
      if (won) {
        const streak = prev.streak + 1;
        next = {
          wins: prev.wins + 1,
          streak,
          best: Math.max(prev.best, streak),
        };
      } else {
        next = { ...prev, streak: 0 };
      }
      try {
        window.localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [over, won, counted]);

  const newWord = useCallback(() => {
    setIndex((prev) => pickIndex(prev));
    setGuessed([]);
    setCounted(false);
  }, []);

  const guess = useCallback(
    (letter: string) => {
      if (over) return;
      setGuessed((prev) => (prev.includes(letter) ? prev : [...prev, letter]));
    },
    [over]
  );

  const remaining = MAX_WRONG - wrongCount;

  return (
    <div className="relative bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-stone-900">แฮงก์แมน</h2>
          <p className="text-[13px] text-stone-500">
            ทายคำภาษาอังกฤษ พลาดได้{" "}
            <span className="tabular">{MAX_WRONG}</span> ครั้ง
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-stone-600">
          <span className="rounded-full border border-stone-200 px-2.5 py-1">
            หมวด: {entry.cat}
          </span>
          <span className="rounded-full border border-stone-200 px-2.5 py-1 tabular">
            เหลือ {remaining}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        {/* รูป hangman */}
        <div className="flex items-center justify-center rounded-md border border-stone-200 bg-white p-3">
          <svg
            viewBox="0 0 120 110"
            className="h-40 w-auto text-stone-900"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label={`พลาด ${wrongCount} จาก ${MAX_WRONG}`}
          >
            {/* ฐาน */}
            <line x1="10" y1="102" x2="70" y2="102" strokeWidth={1.5} />
            <line x1="30" y1="102" x2="30" y2="10" strokeWidth={1.5} />
            <line x1="30" y1="10" x2="90" y2="10" strokeWidth={1.5} />
            <line x1="90" y1="10" x2="90" y2="22" strokeWidth={1.5} />
            {/* 1 หัว */}
            {wrongCount >= 1 && <circle cx="90" cy="32" r="10" />}
            {/* 2 ลำตัว */}
            {wrongCount >= 2 && <line x1="90" y1="42" x2="90" y2="70" />}
            {/* 3 แขนซ้าย */}
            {wrongCount >= 3 && <line x1="90" y1="50" x2="78" y2="60" />}
            {/* 4 แขนขวา */}
            {wrongCount >= 4 && <line x1="90" y1="50" x2="102" y2="60" />}
            {/* 5 ขาซ้าย */}
            {wrongCount >= 5 && <line x1="90" y1="70" x2="80" y2="88" />}
            {/* 6 ขาขวา */}
            {wrongCount >= 6 && <line x1="90" y1="70" x2="100" y2="88" />}
          </svg>
        </div>

        <div>
          <p className="mb-1 text-[13px] text-stone-500">
            คำใบ้: <span className="text-stone-800">{entry.hint}</span>
            <span className="tabular"> ({word.length} ตัวอักษร)</span>
          </p>

          {/* ช่องตัวอักษร */}
          <div className="mb-3 flex flex-wrap gap-1.5" aria-live="polite">
            {word.split("").map((ch, i) => (
              <span
                key={i}
                className="flex h-10 w-8 items-center justify-center rounded border border-stone-200 bg-white text-lg font-semibold text-stone-900"
              >
                {guessed.includes(ch) ? ch : <span className="text-stone-300">_</span>}
              </span>
            ))}
          </div>

          {/* แป้น A-Z */}
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
            {ALPHABET.map((l) => {
              const used = guessed.includes(l);
              const isWrong = used && !word.includes(l);
              const isRight = used && word.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  disabled={used || over}
                  onClick={() => guess(l)}
                  className={`h-9 rounded border text-[13px] font-medium tabular ${
                    isWrong
                      ? "border-stone-200 bg-stone-100 text-stone-400"
                      : isRight
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-40"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-stone-500">ทายผิด:</span>
            {wrongLetters.length === 0 ? (
              <span className="text-stone-400">— ยังไม่มี —</span>
            ) : (
              wrongLetters.map((l) => (
                <span
                  key={l}
                  className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 font-medium text-stone-700"
                >
                  {l}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 text-[13px] text-stone-600">
        <p className="tabular">
          ชนะรวม {stats.wins} • ชนะติดต่อกัน {stats.streak} • ดีสุด {stats.best}
        </p>
        <button
          type="button"
          onClick={newWord}
          className="rounded border border-stone-300 bg-white px-3 py-1.5 text-[13px] font-medium text-stone-800 hover:border-stone-500"
        >
          คำใหม่
        </button>
      </div>

      {/* overlay ชนะ/แพ้ */}
      {over && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/90 p-4">
          <div className="w-full max-w-xs rounded-md border border-stone-200 bg-white p-5 text-center">
            <p className="text-base font-semibold text-stone-900">
              {won ? "ชนะ! เก่งมาก" : "แพ้แล้ว"}
            </p>
            <p className="mt-1 text-[13px] text-stone-600">
              เฉลย: <span className="font-semibold text-stone-900">{word}</span>
            </p>
            <p className="text-[12px] text-stone-500">{entry.hint}</p>
            <p className="mt-2 text-[13px] text-stone-600 tabular">
              {won
                ? `พลาด ${wrongCount} ครั้ง`
                : `พลาดครบ ${MAX_WRONG} ครั้ง`}
            </p>
            <button
              type="button"
              onClick={newWord}
              className="mt-3 w-full rounded bg-stone-900 px-3 py-2 text-[13px] font-medium text-white hover:bg-stone-700"
            >
              เล่นคำใหม่
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
