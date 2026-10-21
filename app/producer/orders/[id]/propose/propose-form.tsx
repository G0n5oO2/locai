"use client";
// 条件変更の提案フォーム（本当に提案してよいかは、サーバーで確かめる）

import { useActionState, useState } from "react";
import { proposeAction, type FlowState } from "@/app/actions/order-flow";
import { Field } from "@/app/ui/field";
import { RequiredMark } from "@/app/ui/required-mark";

export type DateOption = { value: string; label: string; detail: string; over: boolean };

type Props = {
  orderId: string;
  currentDateLabel: string;
  dateOptions: DateOption[]; // 使用日を見せていないお店では空
  unitText: string;
  maxQuantityText: string;
  shippingToBeDecided: boolean; // 送料が要相談の注文（送料を入れることが提案になる）
  itemYen: number; // いまの商品代（合計の目安を出すため。本当の金額はサーバーが計算する）
};

const errorClass = "text-sm text-red-700 dark:text-red-400";

export function ProposeForm({ orderId, currentDateLabel, dateOptions, unitText, maxQuantityText, shippingToBeDecided, itemYen }: Props) {
  const [state, action, pending] = useActionState<FlowState, FormData>(proposeAction, {});
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState("");
  // 数量を変えるとき・送料が要相談のときは、断られたら「見送る」だけ
  const changingQuantity = quantity.trim() !== "" || shippingToBeDecided;
  const shippingNumber = /^\d{1,6}$/.test(shipping.trim()) ? Number(shipping.trim()) : null;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="orderId" value={orderId} />

      {/* 送料が要相談の注文：送料を決める（距離の料金の表より遠いお店の宅配） */}
      {shippingToBeDecided && (
        <div className="flex flex-col gap-2 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950">
          <Field label="送料（円）" required name="shippingYen" inputMode="numeric" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="例：1500" />
          <p className="text-xs text-muted">お店は、商品代と送料を足した合計を見て、承認するか決めます。断られたら見送りになります。</p>
          {shippingNumber !== null && (
            <p className="text-sm">
              合計の目安：商品代 {itemYen.toLocaleString()}円 ＋ 送料 {shippingNumber.toLocaleString()}円 ＝ <strong className="text-lg text-earth">{(itemYen + shippingNumber).toLocaleString()}円</strong>
              <span className="block text-xs text-muted">数量を変えるときは、送ったときにアプリが計算し直します。</span>
            </p>
          )}
        </div>
      )}

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
        <legend className="mb-1 text-sm font-bold">もし断られたら<RequiredMark /></legend>
        <label className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm ${changingQuantity ? "opacity-50" : ""}`}>
          <input type="radio" name="confirmIfRefused" value="yes" disabled={changingQuantity} defaultChecked={!changingQuantity} key={`yes-${changingQuantity}`} />
          元の条件（{currentDateLabel}）で販売を確定する
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
          <input type="radio" name="confirmIfRefused" value="no" defaultChecked={changingQuantity} key={`no-${changingQuantity}`} />
          見送る
        </label>
        {changingQuantity && (
          <p className="text-xs text-muted">
            {shippingToBeDecided ? "送料が要相談の注文は「見送る」だけです（送料が決まらないまま確定できないため）。" : "数量を変えるときは「見送る」だけです（元の数量を出せないため）。"}
          </p>
        )}
        <p className="text-xs text-muted">選んだ内容は、お店の画面にも表示されます。</p>
      </fieldset>

      {state.message && <p className={errorClass}>{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-earth">
        {pending ? "提案を送っています…" : "提案を送る"}
      </button>
    </form>
  );
}
