"use client";
// 文字の大きさ（第2版）：小・ふつう・大の3つから選ぶ。アプリ全体の文字と余白が、いっしょに大きく・小さくなる
// 選んだ大きさは、このブラウザにだけ覚えておく（保存できないブラウザでも、エラーで止まらないようにする）
import { useEffect, useState, useSyncExternalStore } from "react";

const KEY = "locai-font-size";
const sizes = [
  { key: "small", label: "小", px: "14px" },
  { key: "normal", label: "ふつう", px: "16px" },
  { key: "large", label: "大", px: "18px" },
] as const;
type SizeKey = (typeof sizes)[number]["key"];

function read(): SizeKey {
  try {
    const v = localStorage.getItem(KEY);
    return sizes.some((s) => s.key === v) ? (v as SizeKey) : "normal";
  } catch {
    return "normal";
  }
}
function apply(key: SizeKey) {
  document.documentElement.style.fontSize = sizes.find((s) => s.key === key)!.px;
}

// アプリを開いたときに、覚えておいた大きさにする（一番外側の枠に置く）
export function FontSizeApply() {
  useEffect(() => apply(read()), []);
  return null;
}

// 画面の上のロゴの右に置く、小さな「あ」のボタン。押すと小さな吹き出しが開き、小・ふつう・大を選べる
const noop = () => () => {};

export function FontSizeButton() {
  // 覚えておいた大きさ（サーバーで作る画面では「ふつう」）と、この画面で選んだ大きさ
  const stored = useSyncExternalStore(noop, read, () => "normal" as SizeKey);
  const [chosen, setChosen] = useState<SizeKey | null>(null);
  const [open, setOpen] = useState(false);
  const size = chosen ?? stored;
  const choose = (key: SizeKey) => {
    setChosen(key);
    apply(key);
    setOpen(false);
    try {
      localStorage.setItem(KEY, key);
    } catch {}
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="文字の大きさを変える"
        className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted ring-1 ring-line outline-none focus-visible:ring-2 focus-visible:ring-leaf"
      >
        <span className="text-base leading-none">あ</span>
        文字
      </button>
      {open && (
        <>
          {/* 吹き出しの外を押したら閉じる */}
          <button type="button" aria-label="閉じる" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div role="radiogroup" aria-label="文字の大きさ" className="absolute right-0 z-40 mt-2 flex gap-1 card p-1.5">
            {sizes.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={size === s.key}
                onClick={() => choose(s.key)}
                className={`flex w-14 flex-col items-center rounded-2xl py-1.5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-leaf ${
                  size === s.key ? "bg-leaf text-white" : "text-muted"
                }`}
              >
                {/* 「あ」の大きさで、どれくらいになるかを見せる */}
                <span style={{ fontSize: `${0.9 + i * 0.25}rem` }}>あ</span>
                <span className="text-[10px]">{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
