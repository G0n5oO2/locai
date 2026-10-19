"use client";
// 選んだ旬の野菜の料理の案（AI）。料理の種類で絞り込める。分量は「目安」と明記する
import { useState, useTransition } from "react";
import { recipeAction } from "@/app/actions/recipes";
import type { RecipeIdea } from "@/lib/ai-recipes";
import { GENRES as genres } from "@/lib/recipe-genres";

export function RecipePanel({ vegetable }: { vegetable: string }) {
  const [genre, setGenre] = useState<(typeof genres)[number]>("すべて");
  const [result, setResult] = useState<{ recipes?: RecipeIdea[]; message?: string } | null>(null);
  const [loading, start] = useTransition();
  // AI を呼ぶのは、ボタンを押したときだけ（呼びすぎないように）
  const ask = (g: (typeof genres)[number]) => {
    setGenre(g);
    start(async () => setResult(await recipeAction(vegetable, g)));
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-bold">{vegetable}を使った料理の案（AI）</h3>
      {/* 料理の種類で絞り込む。押すと、その種類の案を AI に頼む */}
      <div role="group" aria-label="料理の種類" className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => ask(g)}
            disabled={loading}
            aria-pressed={result !== null && genre === g}
            className={`rounded-full border px-4 py-2 text-sm font-bold disabled:opacity-60 ${result !== null && genre === g ? "border-leaf bg-leaf text-white" : "border-line bg-surface text-muted"}`}
          >
            {g}
          </button>
        ))}
      </div>
      {loading && <p className="text-sm text-muted">AI が考えています…</p>}
      {!loading && result === null && <p className="text-sm text-muted">料理の種類を押すと、AI が料理の案を出します。</p>}
      {!loading && result?.message && <p className="text-sm text-muted">{result.message}</p>}
      {!loading && result?.recipes && (
        <>
          <ul className="grid gap-3 md:grid-cols-3">
            {result.recipes.map((r) => (
              // AI の文は、テキストとしてそのまま表示する
              <li key={r.name} className="flex flex-col gap-2 rounded-2xl bg-surface p-4 text-sm shadow-sm ring-1 ring-line">
                <span className="w-fit rounded-full bg-leaf-soft px-2 py-0.5 text-xs font-bold text-leaf">{genre === "すべて" ? "おすすめ" : genre}</span>
                <p className="text-lg font-bold leading-snug">{r.name}</p>
                <p className="leading-6">{r.description}</p>
                <p className="text-muted">使う量（目安）：{r.amount}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">AI の案です。分量は目安なので、お店に合わせて決めてください。</p>
        </>
      )}
    </section>
  );
}
