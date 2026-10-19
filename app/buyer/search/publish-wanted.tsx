"use client";
// 候補が0件のとき、その条件を「探しています」として公開するフォーム（確かめはサーバー側の publishWanted で行う）

import { useActionState, useState } from "react";
import { publishWanted, suggestAction, type SuggestState, type WantedFormState } from "@/app/actions/wanted";

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";

export function PublishWanted({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<WantedFormState, FormData>(publishWanted, {});
  const hasVegetable = (values.vegetable ?? "").trim() !== "";
  const [kind, setKind] = useState(hasVegetable ? "specified" : "any");
  const [suggestState, suggest, suggesting] = useActionState<SuggestState, FormData>(suggestAction, {});
  // 代わりに使える野菜（お店が選んだもの・自分で入力したもの）
  const [substitutes, setSubstitutes] = useState("");
  const chosen = substitutes.split(/[、,]/).map((x) => x.trim()).filter(Boolean);
  function toggle(name: string) {
    const next = chosen.includes(name) ? chosen.filter((x) => x !== name) : [...chosen, name];
    setSubstitutes(next.join("、"));
  }

  if (state.done) {
    return <p className="rounded-3xl bg-leaf-soft p-4 text-sm font-bold">「探しています」として公開しました。近くの農家さんに、地域と条件だけが伝わります。</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-3xl border border-leaf bg-surface p-4 text-sm">
      <p className="font-bold">この条件を「探しています」として、近くの農家さんに公開できます</p>
      <p className="text-muted">伝わるのは、地域・食材・希望数量・使用日・受け取り方法だけです。お店の名前・住所・予算は伝わりません。</p>
      {/* 探したときの条件をそのまま送る */}
      {(["vegetable", "quantity", "useDate", "method"] as const).map((f) => (
        <input key={f} type="hidden" name={f} value={values[f] ?? ""} />
      ))}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">食材</legend>
        {hasVegetable && (
          <>
            <label className="flex items-center gap-2">
              <input type="radio" name="kind" value="specified" checked={kind === "specified"} onChange={() => setKind("specified")} />
              {values.vegetable} だけ
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="kind" value="substitute" checked={kind === "substitute"} onChange={() => setKind("substitute")} />
              {values.vegetable}、または代わりの野菜でもよい
            </label>
          </>
        )}
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="any" checked={kind === "any"} onChange={() => setKind("any")} />
          種類を問わない
        </label>
      </fieldset>
      {kind === "substitute" && (
        <div className="flex flex-col gap-2">
          {/* AI の提案：候補と理由・使い道を出すだけ。どれを使うかは、お店がチェックで選ぶ（不変条件5） */}
          <div className="flex flex-col gap-2 rounded-xl bg-leaf-soft p-3">
            <label htmlFor="usage" className="font-bold">料理の用途（任意・AI の提案に使います）</label>
            <input id="usage" name="usage" maxLength={50} placeholder="例：焼物、炊き合わせ" className={inputClass} />
            <button type="submit" formAction={suggest} disabled={suggesting} className="btn btn-sm btn-outline-leaf">
              {suggesting ? "AI が考えています…" : "AI に代わりの野菜を提案してもらう"}
            </button>
            {suggestState.message && <p className="text-xs">{suggestState.message}</p>}
            {suggestState.suggestions && (
              <ul className="flex flex-col gap-2">
                {suggestState.suggestions.map((s) => (
                  <li key={s.name}>
                    <label className="flex items-start gap-2 rounded-xl border border-line bg-surface p-2">
                      <input type="checkbox" checked={chosen.includes(s.name)} onChange={() => toggle(s.name)} className="mt-1" />
                      {/* AI の答えは、テキストとしてそのまま表示する */}
                      <span>
                        <strong>{s.name}</strong>
                        <span className="block text-xs">{s.reason}</span>
                        <span className="block text-xs text-muted">使い方：{s.usage}</span>
                      </span>
                    </label>
                  </li>
                ))}
                <li className="text-xs text-muted">AI の提案です。料理に使えるものだけを選んでください。</li>
              </ul>
            )}
          </div>
          <label htmlFor="substitutes" className="font-bold">代わりに使える野菜（「、」で区切って5つまで）</label>
          <input id="substitutes" name="substitutes" maxLength={200} value={substitutes} onChange={(e) => setSubstitutes(e.target.value)} placeholder="例：伏見甘長、ししとう" className={inputClass} />
          <p className="text-xs text-muted">料理に使えるものだけを選んでください。使えない野菜が届くと、廃棄につながります。</p>
        </div>
      )}
      {state.message && <p className="text-red-700 dark:text-red-400">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "公開しています…" : "「探しています」として公開する"}
      </button>
    </form>
  );
}
