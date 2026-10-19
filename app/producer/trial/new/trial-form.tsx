"use client";
// お試し食材の登録フォーム（確かめと保存はサーバー側の createTrialItem で行う）
import { useActionState } from "react";
import { createTrialItem, type TrialFormState } from "@/app/actions/trial";
import { Field } from "@/app/ui/field";
import { methodLabel, type DeliveryMethod } from "@/lib/burden";
import { TRIAL_ANSWER_DAYS, TRIAL_UNIT_G } from "@/lib/trial";
import { RequiredMark } from "@/app/ui/required-mark";

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";
const allMethods: DeliveryMethod[] = ["delivery", "self", "pickup"];

// 保存ボタンの下に、直すところをまとめて出すときの欄の名前
const fieldNames: Record<string, string> = {
  vegetable: "食材名",
  note: "食材の説明",
  unitPrice: "値段",
  total: "出せる量",
  quality: "品の状態",
  lastDay: "収穫できる最後の日",
  answerDays: "返事の日数",
  methods: "受け渡し方法",
};

export function TrialForm({ available }: { available: Record<DeliveryMethod, boolean> }) {
  const [state, action, pending] = useActionState<TrialFormState, FormData>(createTrialItem, {});
  const v = state.values ?? {};
  const checkedMethods = v.methods ? v.methods.split(",") : allMethods.filter((m) => available[m]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="食材名（例：賀茂茄子）" required name="vegetable" maxLength={50} defaultValue={v.vegetable} errors={state.errors?.vegetable} />

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-bold">食材の説明<RequiredMark /></label>
        <textarea id="note" name="note" rows={3} maxLength={500} defaultValue={v.note} placeholder="例：皮がやわらかく、焼き物に向いています" className={inputClass} />
        {state.errors?.note && <p className={errorClass}>{state.errors.note[0]}</p>}
      </div>

      {/* お試しはグラム単位で取引する（値段は「100g あたり何円」で決める） */}
      <div className="flex flex-col gap-1">
        <Field label={`値段（${TRIAL_UNIT_G}g あたり・円）`} required name="unitPrice" inputMode="numeric" placeholder="例：80" defaultValue={v.unitPrice} errors={state.errors?.unitPrice} />
        <p className="text-xs text-muted">お店は {TRIAL_UNIT_G}g ずつ申し込みます（例：{TRIAL_UNIT_G}g あたり 80円 → 300g なら 240円）。お試しのサイズに合わせて決めてください。</p>
      </div>

      <Field label={`出せる量（g・${TRIAL_UNIT_G}g 単位）`} required name="total" inputMode="numeric" placeholder="例：1000" defaultValue={v.total} errors={state.errors?.total} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">品の状態<RequiredMark /></legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "normal", label: "通常品" },
            { value: "irregular", label: "規格外" },
          ].map((q) => (
            <label key={q.value} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 has-checked:border-earth has-checked:bg-earth-soft">
              <input type="radio" name="quality" value={q.value} defaultChecked={v.quality === q.value} />
              {q.label}
            </label>
          ))}
        </div>
        {state.errors?.quality && <p className={errorClass}>{state.errors.quality[0]}</p>}
      </fieldset>

      <div className="flex flex-col gap-1">
        <Field label="収穫できる最後の日" required name="lastDay" type="date" defaultValue={v.lastDay} errors={state.errors?.lastDay} />
        <p className="text-xs text-muted">この日まで届けられます。受付は、最後の日に間に合うように自動で終わります（最後の日の「返事の日数」日前まで）。</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">申し込みから何日以内に返事をしますか<RequiredMark /></legend>
        <div className="grid grid-cols-3 gap-3">
          {TRIAL_ANSWER_DAYS.map((n) => (
            <label key={n} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface p-3 has-checked:border-earth has-checked:bg-earth-soft">
              <input type="radio" name="answerDays" value={n} defaultChecked={v.answerDays === String(n)} />
              {n}日
            </label>
          ))}
        </div>
        {state.errors?.answerDays && <p className={errorClass}>{state.errors.answerDays[0]}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">受け渡し方法（1つ以上）<RequiredMark /></legend>
        {allMethods.map((m) => (
          <label key={m} className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-3 ${available[m] ? "has-checked:border-earth has-checked:bg-earth-soft" : "opacity-60"}`}>
            <input type="checkbox" name="methods" value={m} disabled={!available[m]} defaultChecked={checkedMethods.includes(m)} />
            {methodLabel[m]}
            {!available[m] && <span className="text-xs text-muted">（プロフィールで料金・場所を入れると選べます）</span>}
          </label>
        ))}
        {state.errors?.methods && <p className={errorClass}>{state.errors.methods[0]}</p>}
      </fieldset>

      <p className="text-xs text-muted">写真は、あとで追加できるようにする予定です。</p>

      <button type="submit" disabled={pending} className="btn btn-earth">
        {pending ? "登録しています…" : "お試し食材を登録する"}
      </button>

      {/* 直すところがあれば、ボタンのすぐ下にまとめて出す */}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-xl border border-red-700 p-3 dark:border-red-400">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">登録できませんでした。次のところを直してください。</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {Object.entries(state.errors).map(([key, messages]) => (
              <li key={key} className={errorClass}>
                {fieldNames[key] ?? key}：{messages?.[0]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
