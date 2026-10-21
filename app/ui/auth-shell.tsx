// 画面の外枠（ロゴと見出し）
// wide を付けた一覧の画面は、パソコンの幅で広く使う（入力の画面は読みやすい幅のまま）
import Link from "next/link";
import type { ReactNode } from "react";
import { FontSizeButton } from "./font-size";

export function AuthShell({ title, wide = false, children }: { title: string; wide?: boolean; children: ReactNode }) {
  // パソコンでは横幅をもっと使う：一覧の画面は画面いっぱい（左右に少し余白）、入力の画面も少し広くする
  const width = wide ? "max-w-md md:max-w-none md:px-8 lg:px-12" : "max-w-md md:max-w-3xl md:px-8";
  return (
    <div className="flex flex-1 flex-col">
      <header className={`mx-auto flex w-full ${width} items-center justify-between px-4 pt-5`}>
        <Link href="/" className="text-lg font-bold tracking-wide text-leaf">
          LocAI
        </Link>
        {/* 文字の大きさを変えるボタン（どの画面からでも変えられる） */}
        <FontSizeButton />
      </header>
      <main className={`mx-auto flex w-full ${width} flex-1 flex-col gap-6 px-4 pt-8 pb-12`}>
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
