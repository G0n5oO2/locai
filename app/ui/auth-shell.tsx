// 登録・ログイン画面の外枠（ロゴと見出し）
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-md px-4 pt-5">
        <Link href="/" className="text-lg font-bold tracking-wide text-leaf">
          LocAI
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-8 pb-12">
        <h1 className="text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
