"use client";
// 仕入れ条件の入力と、検索結果の表示（探す処理はサーバー側の search で行う）

import Link from "next/link";
import { useActionState, useState } from "react";
import { search, type SearchFormState } from "@/app/actions/search";
import { Field } from "@/app/ui/field";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { gramsToKgText } from "@/lib/quantity";
import type { Candidate, SortKey } from "@/lib/search";
import { PublishWanted } from "./publish-wanted";
import { RequiredMark } from "@/app/ui/required-mark";
import { QualityTags } from "@/app/ui/price-box";

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function SearchForm({ area, initialVegetable }: { area: string; initialVegetable?: string }) {
  const [state, action, pending] = useActionState<SearchFormState, FormData>(search, {});
  const v = state.values ?? {};
  const r = state.result;
  // どの並べ方も中身は同じ（並び順が違うだけ）なので、件数はランダムの数で数える
  const count = r ? r.random.length : 0;
  // 今見ている並べ方（最初はランダム）
  const [sort, setSort] = useState<SortKey>("random");

  return (
    <div className="flex flex-col gap-6">
      {/* 入力の部分：スマホは縦に1つずつ。パソコンは横幅いっぱいに使い、入力欄を2〜3列に並べる */}
      <form action={action} className="card grid w-full gap-4 p-5 md:grid-cols-2 md:items-end lg:grid-cols-3">
        <Field label="食材（空なら種類を問わない）" name="vegetable" maxLength={50} placeholder="例：賀茂茄子" defaultValue={v.vegetable ?? initialVegetable} errors={state.errors?.vegetable} />
        <Field label="希望数量（kg）" required name="quantity" inputMode="decimal" defaultValue={v.quantity} errors={state.errors?.quantity} />
        <Field label="予算（円・送料込み）" required name="budget" inputMode="numeric" defaultValue={v.budget} errors={state.errors?.budget} />
        <Field label="使用日" required name="useDate" type="date" defaultValue={v.useDate} errors={state.errors?.useDate} />
        <div className="flex flex-col gap-1">
          <label htmlFor="method" className="text-sm font-bold">受け取り方法<RequiredMark /></label>
          <select id="method" name="method" defaultValue={v.method ?? ""} className={inputClass}>
            <option value="">選ぶ</option>
            <option value="delivery">宅配発送</option>
            <option value="self">農家さんが配達</option>
            <option value="pickup">引き取り</option>
          </select>
          {state.errors?.method && <p className={errorClass}>{state.errors.method[0]}</p>}
        </div>
        <p className="text-xs text-muted md:col-span-2 lg:col-span-3">関西の農家さんの出品から、条件に合うものを探します。お店の地域（{area}）からの距離は、宅配の送料と、農家さんが配達できるかに使います。</p>
        {state.message && <p className={`${errorClass} md:col-span-2 lg:col-span-3`}>{state.message}</p>}
        <button type="submit" disabled={pending} className="btn btn-leaf md:col-span-2 md:w-fit md:px-12 lg:col-span-3">
          {pending ? "探しています…" : "仕入れ候補を探す"}
        </button>
      </form>

      {r && (
        <section aria-label="検索結果" className="flex flex-col gap-6">
          {count === 0 ? (
            <div className="card p-5 text-sm leading-6">
              <p className="font-bold">条件に合う出品は、今はありません。</p>
              <p className="text-muted">数量・予算・使用日・受け取り方法を変えると、見つかるかもしれません。</p>
            </div>
          ) : null}
          {count === 0 ? (
            <PublishWanted key={JSON.stringify(v)} values={v} />
          ) : (
            <>
              {/* 並べ方の切り替え（押すと、同じ候補を別の順番で見られる） */}
              <div role="tablist" aria-label="並べ方" className="flex flex-wrap gap-2">
                {sortTabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={sort === t.key}
                    onClick={() => setSort(t.key)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${sort === t.key ? "border-leaf bg-leaf text-white" : "border-line bg-surface text-muted"}`}
                  >
                    {t.label}（{r[t.key].length}）
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted">{sortTabs.find((t) => t.key === sort)!.note}</p>
              {r[sort].length === 0 ? (
                <p className="text-sm text-muted">お試しで買ったことがある農家さんの出品は、今回の条件の中にはありません。</p>
              ) : (
                <Group list={r[sort]} useDate={v.useDate} />
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

// 並べ方の項目（並び順はアプリの決まりで決める。人気順や AI では決めない：不変条件5・6）
const sortTabs: { key: SortKey; label: string; note: string }[] = [
  { key: "random", label: "ランダム", note: "前に買ったことがあるかに関係なく、毎回ばらばらに並べています。" },
  { key: "cheap", label: "安い順", note: "送料込みの合計金額が安い順です。" },
  { key: "early", label: "納品日が早い順", note: "届けられる最初の日が早い順です。" },
  { key: "trial", label: "お試しを利用した農家", note: "前にお試しで買ったことがある農家さんの出品です。" },
];

function Group({ list, useDate }: { list: Candidate[]; useDate?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">同じ農家さんの出品は、続けて並ばないようにしています。</p>
      {/* パソコンの幅では、候補を横に並べる */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {list.map((c) => (
          <CandidateCard key={c.listingId} c={c} useDate={useDate ?? ""} />
        ))}
      </div>
    </div>
  );
}

// 条件に合った出品のカード
// 一番知りたい「送料込みの合計」を大きく出し、内訳・量・日付は小さな枠に分けて、ひと目で読めるようにする
function CandidateCard({ c, useDate }: { c: Candidate; useDate: string }) {
  // 1kg あたりの値段は、市場と比べるための参考（計算には使わない）
  const perKg = Math.round((c.unitPriceYen * 1000) / c.unitG);
  return (
    <article className="flex flex-col gap-3 card p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
          <p className="text-xl font-bold">{c.vegetable}</p>
          <QualityTags quality={c.quality} surplus={c.surplus} />
        </div>
        <p className="text-sm text-muted">
          {c.producerName}・{c.producerArea}（お店から 約{c.distanceKm}km）
        </p>
      </div>
      {/* 状態は、買うかどうか決める大事な手がかりなので、色の付いた枠で目立たせる */}
      {c.note && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">状態</p>
          <p className="whitespace-pre-wrap">{c.note}</p>
        </div>
      )}

      {/* 金額：合計を大きく、内訳は小さく添える（金額はアプリが計算したもの：不変条件2） */}
      <div className="flex flex-col gap-2 rounded-2xl bg-earth-soft px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-earth">
            {gramsToKgText(c.quantityG)}kg の合計{c.shippingToBeDecided ? "（送料を除く）" : "（送料込み）"}
          </span>
          <span className="text-3xl font-bold text-earth">{c.totalYen.toLocaleString()}円</span>
        </div>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border-t border-earth/20 pt-2 text-sm">
          <dt className="text-muted">
            商品代（{gramsToKgText(c.unitG)}kg {c.unitPriceYen.toLocaleString()}円 × {c.quantityG / c.unitG}）
          </dt>
          <dd className="text-right">{c.itemYen.toLocaleString()}円</dd>
          <dt className="text-muted">送料・配達料（{methodLabel[c.method]}）</dt>
          <dd className="text-right">{c.shippingToBeDecided ? "要相談" : `${c.shippingYen.toLocaleString()}円`}</dd>
        </dl>
        {c.shippingToBeDecided && <p className="text-xs text-muted">お店が農家さんの送料の表より遠いため、送料は農家さんが決めてから知らせます。</p>}
        <p className="text-xs text-muted">1kg あたり 約{perKg.toLocaleString()}円（送料を除く）</p>
      </div>

      {/* 日付と期限 */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="col-span-2 rounded-xl bg-leaf-soft px-3 py-2">
          <dt className="text-xs font-bold text-leaf">届けられる日</dt>
          <dd className="text-base font-bold">
            {formatDate(new Date(c.earliestDelivery))}〜{formatDate(new Date(c.latestDelivery))}
          </dd>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950">
          <dt className="text-xs font-bold text-amber-800 dark:text-amber-300">受付期限</dt>
          <dd className="font-bold">{formatJstDateTime(new Date(c.acceptUntil))}</dd>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-sky-950">
          <dt className="text-xs font-bold text-sky-800 dark:text-sky-300">農家さんの回答期限</dt>
          <dd className="font-bold">{formatJstDateTime(new Date(c.answerUntil))}</dd>
        </div>
      </dl>

      {/* 出品の残りの様子（どれくらい申し込まれているか） */}
      <p className="text-xs text-muted">
        出品 {gramsToKgText(c.totalListedG)}kg のうち、販売確定 {gramsToKgText(c.confirmedG)}kg・返事待ち {gramsToKgText(c.reservedG)}kg（{c.requestCount}件）
      </p>

      <details className="text-sm">
        <summary className="cursor-pointer font-bold">農家さんのこと</summary>
        <p className="mt-2">品目：{c.items}</p>
        <p className="mt-1 whitespace-pre-wrap">こだわり：{c.commitment}</p>
      </details>

      {/* 探したときの条件を持って、購入希望の画面へ */}
      <Link
        href={`/buyer/listings/${c.listingId}?${new URLSearchParams({ quantity: gramsToKgText(c.quantityG), method: c.method, useDate })}`}
        className="btn btn-leaf mt-auto"
      >
        この内容で購入希望へ進む
      </Link>
    </article>
  );
}
