"use client";
// 出品の入力フォーム（確かめと保存はサーバー側の createListing で行う）
// ここでの「最大◯件」の表示は目安。保存するときに、サーバーでもう一度計算する

import Link from "next/link";
import { useActionState, useState } from "react";
import { createListing, type ListingFormState } from "@/app/actions/listing";
import { Field } from "@/app/ui/field";
import { maxOrderCount, methodLabel, strictestLimit, type DeliveryMethod } from "@/lib/burden";
import { quantityErrors } from "@/lib/listing-rules";
import { kgTextToGrams } from "@/lib/quantity";
import type { PublicWanted } from "@/lib/wanted";
import { WantedSheet } from "./wanted-sheet";
import { OptionalMark, RequiredMark } from "@/app/ui/required-mark";

type Props = {
  // 受け渡し方法ごとの「1回の出荷で何件まで」（プロフィールの値）
  limits: { shipLimitDelivery: number; shipLimitSelf: number; shipLimitPickup: number };
  // プロフィールで送料などを入れていて、選べる受け渡し方法
  available: Record<DeliveryMethod, boolean>;
  // 畑から 70km 以内の「探しています」（店名・住所は入っていない）
  wanted: PublicWanted[];
  // 「探しています」に応えて出品するときの食材名
  initialVegetable?: string;
  // 再出品のとき：前の出品の内容と、その出品の ID（出品したら前の出品は受付終了にする）
  initial?: Record<string, string>;
  fromListingId?: string;
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";
const allMethods: DeliveryMethod[] = ["delivery", "self", "pickup"];

export function ListingForm({ limits, available, wanted, initialVegetable, initial, fromListingId }: Props) {
  const [state, action, pending] = useActionState<ListingFormState, FormData>(createListing, {});
  const v = state.values ?? initial ?? {};

  // 最大件数の表示のために、総量・最低注文量・受け渡し方法は入力のたびに覚えておく
  const [vegetable, setVegetable] = useState(v.vegetable ?? initialVegetable ?? "");
  const [total, setTotal] = useState(v.total ?? "");
  const [unit, setUnit] = useState(v.unit ?? "");
  const [minOrder, setMinOrder] = useState(v.minOrder ?? "");
  const [methods, setMethods] = useState<DeliveryMethod[]>(
    v.methods ? (v.methods.split(",") as DeliveryMethod[]) : allMethods.filter((m) => available[m]),
  );

  const totalG = kgTextToGrams(total);
  const unitG = kgTextToGrams(unit);
  const minOrderG = kgTextToGrams(minOrder);
  // 入力したその場の案内（サーバーと同じルール）。「出品する」を押したときは、サーバーでもう一度確かめる
  const liveErrors = quantityErrors(totalG, unitG, minOrderG);
  // その場の案内があればそれを、なければサーバーから返ってきたエラーを出す
  const errorsFor = (key: string) => (liveErrors[key] ? [liveErrors[key]] : state.errors?.[key]);
  const maxCount = totalG && minOrderG ? maxOrderCount(totalG, minOrderG) : null;
  const strictest = strictestLimit(limits, methods);
  const over = maxCount !== null && strictest !== null && maxCount > strictest.limit;

  function toggleMethod(m: DeliveryMethod, checked: boolean) {
    setMethods((prev) => (checked ? [...prev, m] : prev.filter((x) => x !== m)));
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {fromListingId && (
        <>
          <input type="hidden" name="fromListingId" value={fromListingId} />
          <p className="rounded-xl bg-earth-soft p-3 text-sm">前の出品の内容を入れてあります（総量は残りの量）。出品すると、前の出品は受付終了になります。期限と納品できる日は、入れ直してください。</p>
        </>
      )}
      <Field label="食材名（例：賀茂茄子）" required name="vegetable" maxLength={50} value={vegetable} onChange={(e) => setVegetable(e.target.value)} errors={state.errors?.vegetable} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="販売可能総量（kg）" required name="total" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} errors={errorsFor("total")} />
        <Field label="注文単位（kg）" required name="unit" inputMode="decimal" value={unit} onChange={(e) => setUnit(e.target.value)} errors={errorsFor("unit")} />
      </div>

      {/* 最低注文量：入力したその場で、出荷の負担の目安を出す */}
      <div className="flex flex-col gap-2">
        <Field label="最低注文量（kg・注文単位の倍数）" required name="minOrder" inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} errors={errorsFor("minOrder")} />
        {/* 最低注文量を決める手がかり：近くのお店が、どのくらいの量を探しているか（設計メモ1章） */}
        <WantedSheet wanted={wanted} vegetable={vegetable} />
        {maxCount !== null && (
          <div className={`rounded-xl p-3 text-sm ${over ? "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-leaf-soft"}`}>
            <p>最大 <strong>{maxCount}件</strong> の発送になる可能性があります</p>
            {strictest && (
              <p>
                あなたの基準：{methodLabel[strictest.method]}は1回の出荷で{strictest.limit}件まで → 負担：
                <strong>{over ? "大" : "大丈夫"}</strong>
              </p>
            )}
            <Link href="/producer/profile" className="underline">件数を変更する</Link>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Field label="単価（円・注文単位あたり）" required name="unitPrice" inputMode="numeric" defaultValue={v.unitPrice} errors={state.errors?.unitPrice} />
        <p className="text-xs text-muted">例：注文単位が 0.5kg なら「0.5kg あたり◯円」。金額が必ず整数になります。</p>
      </div>

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
        <label className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3 has-checked:border-earth has-checked:bg-earth-soft">
          <input type="checkbox" name="surplus" defaultChecked={v.surplus === "on"} />
          余剰品（豊作など）
        </label>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-bold">伝えたいこと<OptionalMark /></label>
        <textarea id="note" name="note" rows={3} maxLength={500} defaultValue={v.note} placeholder="例：形はきれいだが少し小ぶり" className={inputClass} />
        {state.errors?.note && <p className={errorClass}>{state.errors.note[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="受付期限" required name="acceptUntil" type="datetime-local" defaultValue={v.acceptUntil} errors={state.errors?.acceptUntil} />
        <Field label="回答期限" required name="answerUntil" type="datetime-local" defaultValue={v.answerUntil} errors={state.errors?.answerUntil} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">納品できる日<RequiredMark /></legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label="いつから" required name="deliverFrom" type="date" defaultValue={v.deliverFrom} errors={state.errors?.deliverFrom} />
          <Field label="いつまで" required name="deliverTo" type="date" defaultValue={v.deliverTo} errors={state.errors?.deliverTo} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">受け渡し方法（1つ以上）<RequiredMark /></legend>
        {allMethods.map((m) => (
          <label key={m} className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-3 ${available[m] ? "has-checked:border-earth has-checked:bg-earth-soft" : "opacity-60"}`}>
            <input
              type="checkbox"
              name="methods"
              value={m}
              disabled={!available[m]}
              checked={methods.includes(m)}
              onChange={(e) => toggleMethod(m, e.target.checked)}
            />
            {methodLabel[m]}
            {!available[m] && <span className="text-xs text-muted">（プロフィールで料金・場所を入れると選べます）</span>}
          </label>
        ))}
        {state.errors?.methods && <p className={errorClass}>{state.errors.methods[0]}</p>}
      </fieldset>

      {state.message && <p className={errorClass}>{state.message}</p>}

      {/* 出荷の負担が基準を超えたまま出品しようとしたときの注意書き */}
      {state.confirmOver && (
        <div role="alertdialog" aria-labelledby="over-title" className="flex flex-col gap-3 rounded-3xl border-2 border-red-700 p-4 dark:border-red-400">
          <p id="over-title" className="font-bold">
            最大{state.confirmOver.maxCount}件の発送になる可能性があります。あなたの基準（{state.confirmOver.methodLabel}：{state.confirmOver.limit}件）を超えています。
          </p>
          <p className="text-sm">このまま出品しますか？</p>
          <div className="grid grid-cols-2 gap-3">
            <a href="#minOrder" className="btn btn-plain">最低注文量を見直す</a>
            <button type="submit" name="confirmOver" value="yes" disabled={pending} className="rounded-xl bg-red-700 px-3 py-3 font-bold text-white disabled:opacity-60">
              このまま出品する
            </button>
          </div>
        </div>
      )}

      {/* 送信中はボタンを押せなくして、二重の出品を防ぐ */}
      {!state.confirmOver && (
        <button type="submit" disabled={pending} className="btn btn-earth">
          {pending ? "出品しています…" : "出品する"}
        </button>
      )}
    </form>
  );
}
