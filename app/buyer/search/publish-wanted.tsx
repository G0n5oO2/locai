"use client";
// 「探しています」を公開するフォーム（確かめはサーバー側の publishWanted で行う）
// - 仕入れの画面：候補が0件のとき、探したときの条件をそのまま公開する
// - 探していますのタブ（editable）：食材・希望数量・使用日・受け取り方法を、ここで入力して公開する

import { useActionState, useState } from "react";
import { publishWanted, suggestAction, type SuggestState, type WantedFormState } from "@/app/actions/wanted";
import { Field } from "@/app/ui/field";
import { OptionalMark, RequiredMark } from "@/app/ui/required-mark";

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";

export function PublishWanted({ values = {}, editable = false }: { values?: Record<string, string>; editable?: boolean }) {
  const [state, action, pending] = useActionState<WantedFormState, FormData>(publishWanted, {});
  // 食材（タブから出すときは、ここで入力する）
  const [vegetable, setVegetable] = useState(values.vegetable ?? "");
  const hasVegetable = vegetable.trim() !== "";
  const [kind, setKind] = useState(hasVegetable ? "specified" : "any");
  const [suggestState, suggest, suggesting] = useActionState<SuggestState, FormData>(suggestAction, {});
  // 代わりに使える野菜（お店が選んだもの・自分で入力したもの）
  const [substitutes, setSubstitutes] = useState("");
  const chosen = substitutes.split(/[、,]/).map((x) => x.trim()).filter(Boolean);
  function toggle(name: string) {
    const next = chosen.includes(name) ? chosen.filter((x) => x !== name) : [...chosen, name];
    setSubstitutes(next.join("、"));
  }

  // 仕入れの画面では、公開したらフォームを閉じる（タブでは、続けてもう1つ出せるようにフォームを残す）
  if (state.done && !editable) {
    return <p className="rounded-3xl bg-leaf-soft p-4 text-sm font-bold">「探しています」として公開しました。近くの農家さんに、地域と条件だけが伝わります。</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-3xl border border-leaf bg-surface p-4 text-sm">
      <p className="font-bold">{editable ? "新しく「探しています」を出す" : "この条件を「探しています」として、近くの農家さんに公開できます"}</p>
      <p className="text-muted">伝わるのは、地域・食材・希望数量・使用日・受け取り方法だけです。お店の名前・住所・予算は伝わりません。</p>
      {state.done && editable && <p className="rounded-2xl bg-leaf-soft p-3 font-bold">公開しました。続けて、ほかの野菜も出せます。</p>}
      {editable ? (
        // タブから出すとき：条件を、ここで入力する
        <div className="grid gap-3 md:grid-cols-2 md:items-end lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="wanted-vegetable" className="font-bold">
              食材
              <OptionalMark />
            </label>
            <input id="wanted-vegetable" name="vegetable" maxLength={50} value={vegetable} onChange={(e) => {
                setVegetable(e.target.value);
                if (e.target.value.trim() === "") setKind("any");
              }} placeholder="例：万願寺唐辛子（空なら種類を問わない）" className={inputClass} />
          </div>
          <Field label="希望数量（kg）" name="quantity" inputMode="decimal" required />
          <Field label="使用日" name="useDate" type="date" required />
          <div className="flex flex-col gap-1">
            <label htmlFor="wanted-method" className="font-bold">
              受け取り方法
              <RequiredMark />
            </label>
            <select id="wanted-method" name="method" defaultValue="delivery" className={inputClass}>
              <option value="delivery">宅配発送</option>
              <option value="self">農家さんが配達</option>
              <option value="pickup">引き取り</option>
            </select>
          </div>
        </div>
      ) : (
        // 仕入れの画面から出すとき：探したときの条件をそのまま送る
        (["vegetable", "quantity", "useDate", "method"] as const).map((f) => <input key={f} type="hidden" name={f} value={values[f] ?? ""} />)
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-bold">
          食材の選び方
          <RequiredMark />
        </legend>
        {hasVegetable && (
          <>
            <label className="flex items-center gap-2">
              <input type="radio" name="kind" value="specified" checked={kind === "specified"} onChange={() => setKind("specified")} />
              {vegetable} だけ
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="kind" value="substitute" checked={kind === "substitute"} onChange={() => setKind("substitute")} />
              {vegetable}、または代わりの野菜でもよい
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
