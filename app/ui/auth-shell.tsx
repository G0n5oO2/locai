// 画面の外枠（ロゴと見出し）
// wide を付けた一覧の画面は、パソコンの幅で広く使う（入力の画面は読みやすい幅のまま）
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, wide = false, children }: { title: string; wide?: boolean; children: ReactNode }) {
  const width = wide ? "max-w-md md:max-w-5xl" : "max-w-md";
  return (
    <div className="flex flex-1 flex-col">
      <header className={`mx-auto w-full ${width} px-4 pt-5`}>
        <Link href="/" className="text-lg font-bold tracking-wide text-leaf">
          LocAI
        </Link>
      </header>
      <main className={`mx-auto flex w-full ${width} flex-1 flex-col gap-6 px-4 pt-8 pb-12`}>
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
