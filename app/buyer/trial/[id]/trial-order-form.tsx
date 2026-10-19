"use client";
// お試し希望の入力フォーム（金額はここでは目安。送ったときにサーバーがもう一度計算する）
import { useActionState, useState } from "react";
import { sendTrialOrder, type OrderFormState } from "@/app/actions/order";
import { Field } from "@/app/ui/field";
import { methodLabel, type DeliveryMethod } from "@/lib/burden";
import { paymentFits, paymentLabel, type PaymentMethodKey } from "@/lib/payment";
import { quote } from "@/lib/pricing";

type Props = {
  listingId: string;
  requestKey: string;
  price: { unitG: number; unitPriceYen: number; minOrderG: number };
  fees: Parameters<typeof quote>[1];
  methods: DeliveryMethod[];
  restG: number;
  earliest: string;
  latest: string;
  payments: PaymentMethodKey[];
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function TrialOrderForm({ listingId, requestKey, price, fees, methods, restG, earliest, latest, payments }: Props) {
  const [state, action, pending] = useActionState<OrderFormState, FormData>(sendTrialOrder, {});
  const v = state.values ?? {};
  const [quantity, setQuantity] = useState(v.quantity ?? String(price.unitG));
  const [method, setMethod] = useState(v.method ?? methods[0]);
  const grams = /^\d+$/.test(quantity.trim()) ? Number(quantity) : null;
  const q = grams ? quote(price, fees, grams, method as DeliveryMethod) : null;

  // 支払方法：選んだ受け取り方法で使えるものだけを出す（代金引換は宅配のときだけ）
  const paymentOptions = payments.filter((p) => paymentFits(p, method as DeliveryMethod));
  const [payment, setPayment] = useState(v.paymentMethod ?? "");
  const shownPayment = paymentOptions.includes(payment as PaymentMethodKey) ? payment : (paymentOptions[0] ?? "");

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* どのお試し食材への申し込みか・二重送信を防ぐ目印 */}
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="requestKey" value={requestKey} />

      <Field
        label={`希望数量（g・${price.unitG}g 単位、残り ${restG.toLocaleString()}g まで）`}
        name="quantity"
        type="number"
        inputMode="numeric"
        min={price.unitG}
        max={restG}
        step={price.unitG}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        errors={state.errors?.quantity}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="method" className="text-sm font-bold">受け取り方法</label>
        <select id="method" name="method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
          {methods.map((m) => (
            <option key={m} value={m}>{methodLabel[m]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Field label="届けてほしい日（納品日）" name="deliveryDate" type="date" min={earliest} max={latest} defaultValue={v.deliveryDate} errors={state.errors?.deliveryDate} />
        <p className="text-xs text-muted">農家さんの返事のあとに届くように、{earliest}〜{latest} の中から選んでください。</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="paymentMethod" className="text-sm font-bold">支払方法</label>
        {payments.length === 0 ? (
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
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-bold">農家さんへのメッセージ（任意）</label>
        <textarea id="message" name="message" rows={3} maxLength={500} defaultValue={v.message} placeholder="例：煮物に使ってみたいです" className={inputClass} />
        {state.errors?.message && <p className={errorClass}>{state.errors.message[0]}</p>}
      </div>

      {/* 金額の目安（不変条件2：本当の金額は、送ったときにサーバーが計算する）。合計は大きく、色を変える */}
      <div className="rounded-3xl bg-leaf-soft p-4 text-sm">
        {q && !("error" in q) ? (
          <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1">
            <dt>商品代</dt>
            <dd>{q.itemYen.toLocaleString()}円</dd>
            <dt>送料・配達料</dt>
            <dd>{q.shippingYen.toLocaleString()}円</dd>
            <dt className="font-bold">合計</dt>
            <dd className="text-2xl font-bold text-leaf">{q.totalYen.toLocaleString()}円</dd>
          </dl>
        ) : (
          <p>{q && "error" in q ? q.error : `希望数量を ${price.unitG}g 単位で入れると、合計金額が出ます`}</p>
        )}
      </div>

      {state.message && <p className={errorClass}>{state.message}</p>}
      <p className="text-sm font-bold">送っただけでは、購入は決まりません。農家さんが承認すると「販売確定」になります。</p>
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "送っています…" : "お試し希望を送る"}
      </button>
    </form>
  );
}
