export type Category = "อาร์เคด" | "ปริศนา" | "ความจำ" | "คลาสสิก";

export interface CatStyle {
  dot: string;
  chip: string;
  hover: string;
}

/** สีประจำหมวด — โทนหม่นมินิมอล ใช้เฉพาะจุดเล็กๆ (จุด/ป้าย/ขอบ hover) */
export const CAT_STYLE: Record<Category, CatStyle> = {
  อาร์เคด: {
    dot: "bg-orange-500",
    chip: "border-orange-200 bg-orange-50 text-orange-800",
    hover: "hover:border-orange-400",
  },
  ปริศนา: {
    dot: "bg-sky-600",
    chip: "border-sky-200 bg-sky-50 text-sky-800",
    hover: "hover:border-sky-400",
  },
  ความจำ: {
    dot: "bg-emerald-600",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    hover: "hover:border-emerald-400",
  },
  คลาสสิก: {
    dot: "bg-rose-500",
    chip: "border-rose-200 bg-rose-50 text-rose-800",
    hover: "hover:border-rose-400",
  },
};

export interface GameMeta {
  slug: string;
  no: string;
  title: string;
  thai: string;
  desc: string;
  category: Category;
  players: string;
  time: string;
  level: "ง่าย" | "ปานกลาง" | "ยาก";
}

export const GAMES: GameMeta[] = [
  {
    slug: "snake",
    no: "01",
    title: "Snake",
    thai: "งูกินจุด",
    desc: "บังคับงูด้วยปุ่มลูกศร กินให้ยาวที่สุดโดยไม่ชนตัวเอง",
    category: "อาร์เคด",
    players: "1 คน",
    time: "2–5 นาที",
    level: "ง่าย",
  },
  {
    slug: "tictactoe",
    no: "02",
    title: "Tic-Tac-Toe",
    thai: "เอ็กซ์โอ",
    desc: "XO 3×3 เล่นกับเพื่อนหรือบอท ใครเรียง 3 ชนะ",
    category: "คลาสสิก",
    players: "1–2 คน",
    time: "1–3 นาที",
    level: "ง่าย",
  },
  {
    slug: "memory",
    no: "03",
    title: "Memory",
    thai: "เกมจับคู่",
    desc: "เปิดไพ่ 16 ใบ จับคู่ให้ครบด้วยจำนวนครั้งน้อยที่สุด",
    category: "ความจำ",
    players: "1 คน",
    time: "2–4 นาที",
    level: "ง่าย",
  },
  {
    slug: "2048",
    no: "04",
    title: "2048",
    thai: "เกมเลข 2048",
    desc: "เลื่อนรวมเลขให้ได้ 2048 ใช้ลูกศรหรือปัดนิ้ว",
    category: "ปริศนา",
    players: "1 คน",
    time: "5–10 นาที",
    level: "ปานกลาง",
  },
  {
    slug: "minesweeper",
    no: "05",
    title: "Minesweeper",
    thai: "กู้ระเบิด",
    desc: "ตาราง 9×9 มีระเบิด 10 ลูก เปิดให้ครบโดยไม่แตกระเบิด",
    category: "ปริศนา",
    players: "1 คน",
    time: "3–8 นาที",
    level: "ปานกลาง",
  },
  {
    slug: "breakout",
    no: "06",
    title: "Breakout",
    thai: "ทุบอิฐ",
    desc: "ขยับแป้นรับบอล ทำลายอิฐทั้งหมด 3 ด่าน",
    category: "อาร์เคด",
    players: "1 คน",
    time: "3–6 นาที",
    level: "ปานกลาง",
  },
  {
    slug: "simon",
    no: "07",
    title: "Simon",
    thai: "จำลำดับสี",
    desc: "ดูไฟกระพริบแล้วกดตามลำดับ ยิ่งลึกยิ่งเร็ว",
    category: "ความจำ",
    players: "1 คน",
    time: "2–5 นาที",
    level: "ง่าย",
  },
  {
    slug: "whack",
    no: "08",
    title: "Whack-a-Mole",
    thai: "ตีตุ่น",
    desc: "ตุ่นโผล่ 30 วินาที ตีให้โดนเยอะที่สุด ระวังระเบิด",
    category: "อาร์เคด",
    players: "1 คน",
    time: "1 นาที",
    level: "ง่าย",
  },
  {
    slug: "rps",
    no: "09",
    title: "Rock-Paper-Scissors",
    thai: "เป่ายิ้งฉุบ",
    desc: "ค้อน กรรไกร กระดาษ เล่นแบบ best-of-5 กับบอท",
    category: "คลาสสิก",
    players: "1 คน",
    time: "1–2 นาที",
    level: "ง่าย",
  },
  {
    slug: "hangman",
    no: "10",
    title: "Hangman",
    thai: "ทายคำศัพท์",
    desc: "ทายคำภาษาอังกฤษ 40+ คำ พลาดได้ 6 ครั้ง",
    category: "คลาสสิก",
    players: "1 คน",
    time: "2–4 นาที",
    level: "ปานกลาง",
  },
  {
    slug: "guess",
    no: "11",
    title: "Guess the Number",
    thai: "ทายตัวเลข",
    desc: "ทายเลข 1–100 ใน 7 ครั้ง มีคำใบ้ มากไป/น้อยไป",
    category: "ปริศนา",
    players: "1 คน",
    time: "1–2 นาที",
    level: "ง่าย",
  },
  {
    slug: "reaction",
    no: "12",
    title: "Reaction",
    thai: "วัดความไว",
    desc: "รอไฟเขียวแล้วกดให้เร็วที่สุด วัดเป็นมิลลิวินาที 5 รอบ",
    category: "อาร์เคด",
    players: "1 คน",
    time: "1 นาที",
    level: "ง่าย",
  },
];

export function getGame(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}
