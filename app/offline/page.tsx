export default function Offline() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16">
      <div className="mx-auto max-w-md rounded-md border border-stone-200 bg-white p-8 text-center anim-rise">
        <div className="mx-auto grid w-fit grid-cols-2 gap-1">
          <span className="h-4 w-4 bg-orange-500" />
          <span className="h-4 w-4 bg-sky-600" />
          <span className="h-4 w-4 bg-emerald-600" />
          <span className="h-4 w-4 bg-rose-500" />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          ออฟไลน์อยู่
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
          หน้านี้ยังไม่เคยเปิดมาก่อนเลยไม่มีในแคช
          หน้าที่เคยเปิดแล้วจะยังเล่นได้ตามปกติ
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-stone-900 px-4 py-2 text-[14px] font-medium text-white"
        >
          กลับหน้าแรก
        </a>
      </div>
    </main>
  );
}
