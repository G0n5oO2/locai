"use client";
// 条件変更の提案フォーム（本当に提案してよいかは、サーバーで確かめる）

import { useActionState, useState } from "react";
import { proposeAction, type FlowState } from "@/app/actions/order-flow";
import { Field } from "@/app/ui/field";

export type DateOption = { value: string; label: string; detail: string; over: boolean };

type Props = {
  orderId: string;
  currentDateLabel: string;
  dateOptions: DateOption[]; // 使用日を見せていないお店では空
  unitText: string;
  maxQuantityText: string;
};

const errorClass = "text-sm text-red-700 dark:text-red-400";

export function ProposeForm({ orderId, currentDateLabel, dateOptions, unitText, maxQuantityText }: Props) {
  const [state, action, pending] = useActionState<FlowState, FormData>(proposeAction, {});
  const [quantity, setQuantity] = useState("");
  // 数量を変えるときは、断られたら「見送る」だけ
  const changingQuantity = quantity.trim() !== "";

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="orderId" value={orderId} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">納品日をずらす（いまの納品日：{currentDateLabel}）</legend>
        {dateOptions.length === 0 ? (
          <p className="text-sm text-muted">このお店は使用日を見せていないので、納品日の変更は提案できません（申し込みが不利になることはありません）。</p>
        ) : (
          <>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
              <input type="radio" name="newDate" value="" defaultChecked />
              納品日は変えない
            </label>
            {dateOptions.map((d) => (
              <label key={d.value} className={`flex items-center gap-2 rounded-xl border bg-surface p-3 text-sm ${d.over ? "border-red-700 dark:border-red-400" : "border-line"}`}>
                <input type="radio" name="newDate" value={d.value} />
                <span>
                  <strong>{d.label}</strong>　{d.detail}
                  {d.over && <span className="block font-bold text-red-700 dark:text-red-400">基準を超えます</span>}
                </span>
              </label>
            ))}
          </>
        )}
      </fieldset>

      <div className="flex flex-col gap-1">
        <Field label={`数量を変える（kg・空なら変えない。${unitText} 単位、${maxQuantityText} まで）`} name="newQuantity" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">もし断られたら</legend>
        <label className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm ${changingQuantity ? "opacity-50" : ""}`}>
          <input type="radio" name="confirmIfRefused" value="yes" disabled={changingQuantity} defaultChecked={!changingQuantity} key={`yes-${changingQuantity}`} />
          元の条件（{currentDateLabel}）で販売を確定する
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
          <input type="radio" name="confirmIfRefused" value="no" defaultChecked={changingQuantity} key={`no-${changingQuantity}`} />
          見送る
        </label>
        {changingQuantity && <p className="text-xs text-muted">数量を変えるときは「見送る」だけです（元の数量を出せないため）。</p>}
        <p className="text-xs text-muted">選んだ内容は、お店の画面にも表示されます。</p>
      </fieldset>

      {state.message && <p className={errorClass}>{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-xl bg-earth px-4 py-3 font-bold text-white disabled:opacity-60">
        {pending ? "提案を送っています…" : "提案を送る"}
      </button>
    </form>
  );
}
