"use client";
// 購入希望の入力フォーム（金額はここでは目安。送ったときにサーバーがもう一度計算する）

import { useActionState, useState } from "react";
import { sendOrder, type OrderFormState } from "@/app/actions/order";
import { Field } from "@/app/ui/field";
import { methodLabel, type DeliveryMethod } from "@/lib/burden";
import { paymentFits, paymentLabel, type PaymentMethodKey } from "@/lib/payment";
import { quote } from "@/lib/pricing";
import { gramsToKgText, kgTextToGrams } from "@/lib/quantity";
import { RequiredMark } from "@/app/ui/required-mark";

type Props = {
  listingId: string;
  requestKey: string;
  price: { unitG: number; unitPriceYen: number; minOrderG: number };
  // 送料の計算に使う値（引き取りの場所そのものは渡さない。引き取りできるときは "" にしている）
  fees: Parameters<typeof quote>[1];
  methods: DeliveryMethod[];
  earliest: string;
  latest: string;
  initial: { quantity: string; method: string; useDate: string };
  // 農家さんが受け付ける支払方法（空なら、メッセージで相談）
  payments: PaymentMethodKey[];
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function OrderForm({ listingId, requestKey, price, fees, methods, earliest, latest, initial, payments }: Props) {
  const [state, action, pending] = useActionState<OrderFormState, FormData>(sendOrder, {});
  const v = state.values ?? {};
  const [quantity, setQuantity] = useState(v.quantity ?? initial.quantity);
  const [method, setMethod] = useState(v.method ?? (methods.includes(initial.method as DeliveryMethod) ? initial.method : methods[0]));

  const grams = kgTextToGrams(quantity);
  const q = grams ? quote(price, fees, grams, method as DeliveryMethod) : null;

  // 支払方法：選んだ受け取り方法で使えるものだけを出す（代金引換は宅配のときだけ）
  const paymentOptions = payments.filter((p) => paymentFits(p, method as DeliveryMethod));
  const [payment, setPayment] = useState(v.paymentMethod ?? "");
  // 受け取り方法を変えて、選んでいた支払方法が使えなくなったら、使えるものの先頭にする
  const shownPayment = paymentOptions.includes(payment as PaymentMethodKey) ? payment : (paymentOptions[0] ?? "");

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* どの出品への申し込みか・二重送信を防ぐ目印 */}
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="requestKey" value={requestKey} />

      <Field
        label={`数量（kg・${gramsToKgText(price.unitG)}kg 単位、${gramsToKgText(price.minOrderG)}kg から）`}
        name="quantity"
        required
        inputMode="decimal"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        errors={state.errors?.quantity}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="method" className="text-sm font-bold">受け取り方法<RequiredMark /></label>
        <select id="method" name="method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
          {methods.map((m) => (
            <option key={m} value={m}>{methodLabel[m]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="paymentMethod" className="text-sm font-bold">支払方法{payments.length > 0 && <RequiredMark />}</label>
        {payments.length === 0 ? (
          // 農家さんがまだ設定していないときは、選ばずに送れる
          <>
            <input type="hidden" name="paymentMethod" value="" />
            <p className="rounded-xl bg-surface p-3 text-sm text-muted">この農家さんは、まだ支払方法を設定していません。支払方法はメッセージで相談してください。</p>
          </>
        ) : paymentOptions.length === 0 ? (
          <>
            <input type="hidden" name="paymentMethod" value="" />
            <p className={errorClass}>この受け取り方法で使える支払方法がありません。受け取り方法を変えてください。</p>
          </>
        ) : (
          <select id="paymentMethod" name="paymentMethod" value={shownPayment} onChange={(e) => setPayment(e.target.value)} className={inputClass}>
            {paymentOptions.map((p) => (
              <option key={p} value={p}>{paymentLabel[p]}</option>
            ))}
          </select>
        )}
        {state.errors?.paymentMethod && <p className={errorClass}>{state.errors.paymentMethod[0]}</p>}
        <p className="text-xs text-muted">支払い自体は、アプリの外で行います。{payments.includes("cod") && "代金引換は、宅配のときだけ選べます。"}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <Field label="納品日" required name="deliveryDate" type="date" min={earliest} max={latest} defaultValue={v.deliveryDate} errors={state.errors?.deliveryDate} />
        <Field label="使用日" required name="useDate" type="date" defaultValue={v.useDate ?? initial.useDate} errors={state.errors?.useDate} />
      </div>
      <p className="-mt-3 text-xs text-muted">納品日は、届けられる日（{earliest}〜{latest}）の中から、使用日までの日を選んでください。</p>

      <label className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="checkbox" name="showUseDate" defaultChecked={v.showUseDate === "on"} className="mt-1" />
        <span>
          使用日を農家さんに見せる（任意）
          <span className="block text-xs text-muted">農家さんが納品日を調整するときの参考になります。見せなくても、申し込みが不利になることはありません。</span>
        </span>
      </label>

      {/* 金額の目安（不変条件2：本当の金額は、送ったときにサーバーが計算する） */}
      <div className="rounded-3xl bg-leaf-soft p-4 text-sm">
        {q && !("error" in q) ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt>商品代</dt>
            <dd>{q.itemYen.toLocaleString()}円</dd>
            <dt>送料・配達料</dt>
            <dd>{q.shippingYen.toLocaleString()}円</dd>
            <dt className="font-bold">合計</dt>
            <dd className="font-bold">{q.totalYen.toLocaleString()}円</dd>
          </dl>
        ) : (
          <p>{q && "error" in q ? q.error : "数量を入れると、合計金額が出ます"}</p>
        )}
      </div>

      {state.message && <p className={errorClass}>{state.message}</p>}

      <p className="text-sm font-bold">送っただけでは、購入は決まりません。農家さんが承認すると「販売確定」になります。</p>
      {/* 送信中はボタンを押せなくして、二重送信を防ぐ（押してしまっても、目印で1件にまとめる） */}
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "送っています…" : "購入希望を送る"}
      </button>
    </form>
  );
}
