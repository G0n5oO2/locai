"use client";
// 仕入れ条件の入力と、検索結果の表示（探す処理はサーバー側の search で行う）

import Link from "next/link";
import { useActionState } from "react";
import { search, type SearchFormState } from "@/app/actions/search";
import { Field } from "@/app/ui/field";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { gramsToKgText } from "@/lib/quantity";
import type { Candidate } from "@/lib/search";
import { PublishWanted } from "./publish-wanted";

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function SearchForm({ area }: { area: string }) {
  const [state, action, pending] = useActionState<SearchFormState, FormData>(search, {});
  const v = state.values ?? {};
  const r = state.result;
  const count = r ? r.repeat.length + r.matched.length + r.newcomers.length : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 入力の部分は、パソコンでも読みやすい幅のまま */}
      <form action={action} className="flex flex-col gap-4 md:max-w-md">
        <Field label="食材（空なら種類を問わない）" name="vegetable" maxLength={50} placeholder="例：賀茂茄子" defaultValue={v.vegetable} errors={state.errors?.vegetable} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="希望数量（kg）" name="quantity" inputMode="decimal" defaultValue={v.quantity} errors={state.errors?.quantity} />
          <Field label="予算（円・送料込み）" name="budget" inputMode="numeric" defaultValue={v.budget} errors={state.errors?.budget} />
        </div>
        <Field label="使用日" name="useDate" type="date" defaultValue={v.useDate} errors={state.errors?.useDate} />
        <div className="flex flex-col gap-1">
          <label htmlFor="method" className="text-sm font-bold">受け取り方法</label>
          <select id="method" name="method" defaultValue={v.method ?? ""} className={inputClass}>
            <option value="">選ぶ</option>
            <option value="delivery">宅配発送</option>
            <option value="self">農家さんが配達</option>
            <option value="pickup">引き取り</option>
          </select>
          {state.errors?.method && <p className={errorClass}>{state.errors.method[0]}</p>}
        </div>
        <p className="text-xs text-muted">お店の地域（{area}）から 70km 以内の農家さんの出品を探します。</p>
        {state.message && <p className={errorClass}>{state.message}</p>}
        <button type="submit" disabled={pending} className="rounded-xl bg-leaf px-4 py-3 font-bold text-white disabled:opacity-60">
          {pending ? "探しています…" : "仕入れ候補を探す"}
        </button>
      </form>

      {r && (
        <section aria-label="検索結果" className="flex flex-col gap-6">
          {count === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-5 text-sm leading-6">
              <p className="font-bold">条件に合う出品は、今はありません。</p>
              <p className="text-muted">数量・予算・使用日・受け取り方法を変えると、見つかるかもしれません。</p>
            </div>
          ) : null}
          {count === 0 ? (
            <PublishWanted key={JSON.stringify(v)} values={v} />
          ) : (
            <>
              <Group title="前に買った農家さん" list={r.repeat} useDate={v.useDate} />
              <Group title="条件に合う農家さん" list={r.matched} useDate={v.useDate} />
              <Group title="新しい農家さん" list={r.newcomers} useDate={v.useDate} />
              <p className="text-xs text-muted">並び順は、これまでに表示された回数が少ない農家さんからです（人気順ではありません）。</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Group({ title, list, useDate }: { title: string; list: Candidate[]; useDate?: string }) {
  if (list.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {/* パソコンの幅では、候補を横に並べる */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <CandidateCard key={c.listingId} c={c} useDate={useDate ?? ""} />
        ))}
      </div>
    </div>
  );
}

function CandidateCard({ c, useDate }: { c: Candidate; useDate: string }) {
  // 1kg あたりの値段は、市場と比べるための参考（計算には使わない）
  const perKg = Math.round((c.unitPriceYen * 1000) / c.unitG);
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
        <p className="text-lg font-bold">{c.vegetable}</p>
        <p className="text-sm text-muted">
          {c.producerName}・{c.producerArea}
        </p>
        <p className="text-sm">
          {c.quality === "normal" ? "通常品" : "規格外"}
          {c.surplus && "・余剰品"}
        </p>
        {c.note && <p className="text-sm whitespace-pre-wrap">{c.note}</p>}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">単価</dt>
        <dd>
          {gramsToKgText(c.unitG)}kg あたり {c.unitPriceYen.toLocaleString()}円（1kg あたり 約{perKg.toLocaleString()}円）
        </dd>
        <dt className="text-muted">希望数量</dt>
        <dd>{gramsToKgText(c.quantityG)}kg</dd>
        <dt className="text-muted">商品代</dt>
        <dd>{c.itemYen.toLocaleString()}円</dd>
        <dt className="text-muted">送料・配達料</dt>
        <dd>{c.shippingYen.toLocaleString()}円（{methodLabel[c.method]}）</dd>
        <dt className="font-bold">合計</dt>
        <dd className="font-bold">{c.totalYen.toLocaleString()}円</dd>
        <dt className="text-muted">届けられる日</dt>
        <dd>
          {formatDate(new Date(c.earliestDelivery))}〜{formatDate(new Date(c.latestDelivery))}
        </dd>
        <dt className="text-muted">受付期限</dt>
        <dd>{formatJstDateTime(new Date(c.acceptUntil))}</dd>
        <dt className="text-muted">回答期限</dt>
        <dd>{formatJstDateTime(new Date(c.answerUntil))}</dd>
        <dt className="text-muted">出品の状況</dt>
        <dd>
          出品 {gramsToKgText(c.totalListedG)}kg／販売確定 {gramsToKgText(c.confirmedG)}kg／返事待ち {gramsToKgText(c.reservedG)}kg（{c.requestCount}件）
        </dd>
      </dl>

      <details className="text-sm">
        <summary className="cursor-pointer font-bold">農家さんのこと</summary>
        <p className="mt-2">品目：{c.items}</p>
        <p className="mt-1 whitespace-pre-wrap">こだわり：{c.commitment}</p>
      </details>

      {/* 探したときの条件を持って、購入希望の画面へ */}
      <Link
        href={`/buyer/listings/${c.listingId}?${new URLSearchParams({ quantity: gramsToKgText(c.quantityG), method: c.method, useDate })}`}
        className="rounded-xl bg-leaf px-4 py-3 text-center font-bold text-white"
      >
        この内容で購入希望へ進む
      </Link>
    </article>
  );
}
