"use client";
// はじめて開いたときの説明のスライド（第2版 4-2 ①）
// 1枚目はアプリの名前、最後の枚で「はじめる」を押すと閉じて、登録・ログインの入口（最初の画面）が見える
// 見たかどうかは、このブラウザにだけ覚えておく（2回目からは出さない。「もう一度見る」で出せる）
import { useEffect, useState, useSyncExternalStore } from "react";

const SEEN_KEY = "locai-intro-seen";

// スライドの中身（文は学生と相談して直す）
const slides = [
  {
    title: "LocAI",
    lead: "地元の野菜を、必要な量で。",
    body: ["関西の農家さんと、飲食店をつなぐアプリです。"],
  },
  {
    title: "こんな困りごとはありませんか？",
    lead: "",
    body: [],
  },
  {
    title: "LocAI でできること",
    lead: "",
    body: [],
  },
  {
    title: "はじめてみましょう",
    lead: "",
    body: ["登録は、お店か農家さんかを選ぶだけで始められます。"],
  },
];

// 2枚目：人物のイラストと、困りごとの吹き出し（仕様書 2章の課題から）
const troubles = [
  {
    who: "お店",
    figure: <ShopOwner />,
    lines: ["市場で狙っていた野菜が、先に押さえられて献立を組み直すことがある…", "使い切れなかった野菜を、毎週捨てている…"],
  },
  {
    who: "農家さん",
    figure: <Farmer />,
    lines: ["市場に出すと値段が決められていて、手元に残るお金が少ない…", "直接届けたいお店があっても、つながり方が分からない…"],
  },
];

// 3枚目：できること（番号つきのカード）
const features = [
  "農家さんは、自分で値段を決めて、売りたい野菜をまとめて出品できます",
  "お店は、仕入れ日の前に、必要な量だけ申し込めます",
  "送料込みの合計金額はアプリが計算し、農家さんが承認すると「販売確定」になります",
];

// このブラウザで、もう見たかどうか（保存できないブラウザでも、エラーで止まらないようにする）
function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
const noop = () => () => {};

export function IntroSlides() {
  // サーバーで作る画面にはスライドを出さず、ブラウザで「はじめてか」を確かめてから出す
  const seen = useSyncExternalStore(noop, readSeen, () => true);
  const [closed, setClosed] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [index, setIndex] = useState(0);
  const open = reopened || (!seen && !closed);

  // 「もう一度見る」ボタン（最初の画面にある）から開けるようにする
  useEffect(() => {
    const show = () => {
      setIndex(0);
      setReopened(true);
    };
    window.addEventListener("locai:show-intro", show);
    return () => window.removeEventListener("locai:show-intro", show);
  }, []);

  if (!open) return null;

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    setClosed(true);
    setReopened(false);
  };
  const slide = slides[index];
  const last = index === slides.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="LocAI の説明" className="fixed inset-0 z-30 flex flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-5 pb-8">
        <div className="flex justify-end">
          {!last && (
            <button type="button" onClick={finish} className="text-sm font-bold text-muted underline">
              スキップ
            </button>
          )}
        </div>

        {/* スライドの中身 */}
        <div className="flex flex-1 flex-col justify-center gap-4">
          {index === 0 ? (
            <>
              <p className="text-5xl font-bold tracking-wide text-leaf">{slide.title}</p>
              <p className="text-2xl font-bold">{slide.lead}</p>
            </>
          ) : (
            <h2 className="text-2xl font-bold">{slide.title}</h2>
          )}
          {index === 1 && <Troubles />}
          {index === 2 && <Connect />}
          {index === 3 && <Together />}
          {slide.body.length > 0 && (
            <ul className="flex flex-col gap-3">
              {slide.body.map((line) => (
                <li key={line} className="rounded-2xl bg-surface p-4 leading-7">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 何枚目か（点）と、進む・戻るボタン */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2" aria-label={`${slides.length}枚中 ${index + 1}枚目`}>
            {slides.map((s, i) => (
              <span key={s.title} aria-hidden className={`size-2.5 rounded-full ${i === index ? "bg-leaf" : "bg-line"}`} />
            ))}
          </div>
          <div className="flex gap-3">
            {index > 0 && (
              <button type="button" onClick={() => setIndex(index - 1)} className="flex-1 rounded-xl border border-line px-4 py-3 font-bold">
                もどる
              </button>
            )}
            <button
              type="button"
              onClick={last ? finish : () => setIndex(index + 1)}
              className="flex-1 rounded-xl bg-leaf px-4 py-3 font-bold text-white"
            >
              {last ? "はじめる" : "つぎへ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 最初の画面に置く「説明をもう一度見る」ボタン
export function ShowIntroButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("locai:show-intro"))} className="text-sm font-bold text-leaf underline">
      アプリの説明をもう一度見る
    </button>
  );
}

// 2枚目の中身：左に人物、右に吹き出し
function Troubles() {
  return (
    <div className="flex flex-col gap-5">
      {troubles.map((t) => (
        <div key={t.who} className="flex items-start gap-3">
          <figure className="flex w-20 shrink-0 flex-col items-center gap-1">
            {t.figure}
            <figcaption className="text-sm font-bold">{t.who}</figcaption>
          </figure>
          <ul className="flex flex-1 flex-col gap-2" aria-label={`${t.who}の困りごと`}>
            {t.lines.map((line) => (
              // 吹き出し：左上に小さな三角を付けて、人物が話しているように見せる
              <li key={line} className="relative rounded-2xl bg-surface px-3 py-2 text-sm leading-6 shadow-sm">
                <span aria-hidden className="absolute top-3 -left-1.5 size-3 rotate-45 bg-surface" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ===== 人物のイラスト（線と色で描いた簡単な絵） =====

// お店の人：コック帽とエプロン（体 → 顔 → 帽子の順に重ねる）
function ShopOwner({ happy = false }: { happy?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 64 72" className="size-20">
      {/* 体とエプロン */}
      <path d="M14 72c0-17 8-28 18-28s18 11 18 28z" fill="#e6f0e3" stroke="#5b6658" strokeWidth="1.5" />
      <path d="M24 50h16v22H24z" fill="#2f6b3a" />
      {/* 顔 */}
      <circle cx="32" cy="32" r="11" fill="#f4d9bf" stroke="#5b6658" strokeWidth="1.5" />
      {/* 眉・目・口（happy なら笑顔） */}
      <Brows y={29.5} happy={happy} />
      <circle cx="28.5" cy="32" r="1.3" fill="#5b6658" />
      <circle cx="35.5" cy="32" r="1.3" fill="#5b6658" />
      <Mouth y={38} happy={happy} />
      {/* コック帽 */}
      <rect x="21" y="17" width="22" height="5" fill="#ffffff" stroke="#5b6658" strokeWidth="1.5" />
      <path d="M21 17C15 17 14 9 19 8C20 3 27 2 30 5C33 2 40 3 41 7C46 8 47 16 43 17Z" fill="#ffffff" stroke="#5b6658" strokeWidth="1.5" />
    </svg>
  );
}

// 農家さん：麦わら帽子と首のタオル（体 → 顔 → 帽子の順に重ねる）
function Farmer({ happy = false }: { happy?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 64 72" className="size-20">
      {/* 体と首のタオル */}
      <path d="M14 72c0-17 8-28 18-28s18 11 18 28z" fill="#f5ebdf" stroke="#5b6658" strokeWidth="1.5" />
      <path d="M26 56h12v16H26z" fill="#8a5a2b" opacity="0.8" />
      <path d="M22 44Q32 52 42 44L40 51Q32 56 24 51Z" fill="#ffffff" stroke="#5b6658" strokeWidth="1.2" />
      {/* 顔 */}
      <circle cx="32" cy="33" r="11" fill="#e9c39f" stroke="#5b6658" strokeWidth="1.5" />
      {/* 眉・目・口（happy なら笑顔） */}
      <Brows y={30.5} happy={happy} />
      <circle cx="28.5" cy="33" r="1.3" fill="#5b6658" />
      <circle cx="35.5" cy="33" r="1.3" fill="#5b6658" />
      <Mouth y={39} happy={happy} />
      {/* 麦わら帽子 */}
      <path d="M22 23C22 15 26 11 32 11S42 15 42 23Z" fill="#e8c46a" stroke="#8a5a2b" strokeWidth="1.5" />
      <ellipse cx="32" cy="23" rx="21" ry="4" fill="#e8c46a" stroke="#8a5a2b" strokeWidth="1.5" />
      <path d="M22.5 20.5h19" stroke="#c0392b" strokeWidth="2" />
    </svg>
  );
}

// 3枚目の中身：農家さん →（出品）→ LocAI ←（申し込み）← お店。その下に、できることを番号つきで並べる
function Connect() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-1" aria-label="農家さんとお店が、LocAI でつながる図">
        <figure className="flex flex-col items-center gap-1">
          <Farmer happy />
          <figcaption className="text-xs font-bold">農家さん</figcaption>
        </figure>
        <Arrow label="出品" direction="right" />
        <figure className="flex flex-col items-center gap-1">
          <PhoneIcon />
          <figcaption className="text-xs font-bold text-leaf">LocAI</figcaption>
        </figure>
        <Arrow label="申し込み" direction="left" />
        <figure className="flex flex-col items-center gap-1">
          <ShopOwner happy />
          <figcaption className="text-xs font-bold">お店</figcaption>
        </figure>
      </div>
      <ol className="flex flex-col gap-2">
        {features.map((f, i) => (
          <li key={f} className="flex items-start gap-3 rounded-2xl bg-surface p-3 text-sm leading-6">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">{i + 1}</span>
            {f}
          </li>
        ))}
      </ol>
    </div>
  );
}

// 4枚目の中身：笑顔の2人が、野菜のかごをはさんで並ぶ
function Together() {
  return (
    <div className="flex items-end justify-center gap-2" aria-label="農家さんとお店が、野菜を通してつながっている絵">
      <Farmer happy />
      <BasketIcon />
      <ShopOwner happy />
    </div>
  );
}

// 矢印（向きと、上に書く言葉）
function Arrow({ label, direction }: { label: string; direction: "left" | "right" }) {
  return (
    <div className="mb-8 flex flex-1 flex-col items-center">
      <span className="text-xs font-bold text-earth">{label}</span>
      <svg aria-hidden viewBox="0 0 40 10" className="h-3 w-full text-earth">
        {direction === "right" ? (
          <path d="M2 5H36M31 1l5 4-5 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M38 5H4M9 1L4 5l5 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

// 眉：困った顔は内側が上がる。笑顔はなだらかな山形
function Brows({ y, happy }: { y: number; happy: boolean }) {
  const d = happy ? `M25.5 ${y - 0.5}Q27.5 ${y - 2} 29.5 ${y - 0.5}M34.5 ${y - 0.5}Q36.5 ${y - 2} 38.5 ${y - 0.5}` : `M25.5 ${y}l4 -1.5M38.5 ${y}l-4 -1.5`;
  return <path d={d} fill="none" stroke="#5b6658" strokeWidth="1.5" strokeLinecap="round" />;
}

// 口：困った顔は「へ」の字、笑顔は大きくにっこり
function Mouth({ y, happy }: { y: number; happy: boolean }) {
  const d = happy ? `M28 ${y - 1.5}Q32 ${y + 2.5} 36 ${y - 1.5}` : `M29 ${y}Q32 ${y - 2} 35 ${y}`;
  return <path d={d} fill="none" stroke="#5b6658" strokeWidth="1.5" strokeLinecap="round" />;
}

// LocAI のスマホ
function PhoneIcon() {
  return (
    <svg aria-hidden viewBox="0 0 40 64" className="h-20 w-12">
      <rect x="3" y="2" width="34" height="60" rx="6" fill="#ffffff" stroke="#2f6b3a" strokeWidth="2" />
      <rect x="8" y="10" width="24" height="40" rx="2" fill="#e6f0e3" />
      {/* 画面の中の芽（野菜） */}
      <path d="M20 40V28" stroke="#2f6b3a" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 31c0-4-3-6-7-6 0 4 3 6 7 6zM20 29c0-3 2.5-5 6-5 0 3-2.5 5-6 5z" fill="#2f6b3a" />
      <circle cx="20" cy="56" r="2" fill="#2f6b3a" />
    </svg>
  );
}

// 野菜のかご（なす・にんじん・葉もの）
function BasketIcon() {
  return (
    <svg aria-hidden viewBox="0 0 64 56" className="mb-2 h-16 w-20">
      <ellipse cx="22" cy="22" rx="6" ry="10" transform="rotate(-20 22 22)" fill="#6b3f8f" />
      <path d="M24 12l3-4" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 31L41 9L47 12Z" fill="#e67e22" />
      <path d="M44 10l-2-6M44 10l4-5" stroke="#2f6b3a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="22" r="7" fill="#7fb069" />
      <path d="M6 28h52l-6 24H12z" fill="#c8964f" stroke="#8a5a2b" strokeWidth="1.5" />
      <path d="M10 36h44M12 44h40" stroke="#8a5a2b" strokeWidth="1.2" />
    </svg>
  );
}
