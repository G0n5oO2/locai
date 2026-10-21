"use client";
// 売れ残りのパネル（docs/04_producer_design.md 3章）
// 3つのボタンを押す前に、「探しています」の件数と合計量を見せる

import Link from "next/link";
import { useActionState } from "react";
import { closeAction, continueAction, notifyAction, type LeftoverState } from "@/app/actions/leftover";
import { WantedSheet } from "@/app/producer/listings/new/wanted-sheet";
import { gramsToKgText } from "@/lib/quantity";
import type { PublicWanted } from "@/lib/wanted";
import { splitWanted } from "@/lib/wanted-tabs";

type Props = {
  listingId: string;
  vegetable: string;
  remainingG: number;
  expired: boolean; // 受付期限を過ぎているか
  wanted: PublicWanted[];
  notifiedCount: number; // もう知らせたお店の数
  newCount: number; // まだ知らせていない、合うお店の数
};

// 延ばす日数のボタン（あと1〜3日）
function DaysChoice({ name = "days" }: { name?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((d) => (
        <label key={d} className="flex items-center justify-center gap-1 rounded-xl border border-line p-2 has-checked:border-earth has-checked:bg-earth-soft">
          <input type="radio" name={name} value={d} defaultChecked={d === 1} />
          あと{d}日
        </label>
      ))}
    </div>
  );
}

export function LeftoverPanel({ listingId, vegetable, remainingG, expired, wanted, notifiedCount, newCount }: Props) {
  const [notifyState, notify, notifying] = useActionState<LeftoverState, FormData>(notifyAction, {});
  const [continueState, keep, keeping] = useActionState<LeftoverState, FormData>(continueAction, {});
  const [closeState, close, closing] = useActionState<LeftoverState, FormData>(closeAction, {});
  const tabs = splitWanted(wanted, vegetable);
  const sum = (list: PublicWanted[]) => gramsToKgText(list.reduce((s, w) => s + w.quantityG, 0));
  const busy = notifying || keeping || closing;
  const message = notifyState.message ?? continueState.message ?? closeState.message;

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-earth p-3 text-sm">
      <p className="font-bold">
        {expired ? `${vegetable} ${gramsToKgText(remainingG)}kg 売れ残りました（受付期限を過ぎました）` : `残り ${gramsToKgText(remainingG)}kg`}
      </p>

      {/* 「探しています」：件数と合計量 */}
      <div className="flex flex-col gap-1 rounded-xl bg-earth-soft p-3">
        <p className="font-bold">お店の「探しています」</p>
        <p>{vegetable}を探しているお店　{tabs.specified.length}件・合計 {sum(tabs.specified)}kg</p>
        <p>代替野菜OKのお店　{tabs.substitute.length}件・合計 {sum(tabs.substitute)}kg</p>
        <p>種類を問わないお店　{tabs.any.length}件・合計 {sum(tabs.any)}kg</p>
        <WantedSheet wanted={wanted} vegetable={vegetable} />

        {/* まとめて知らせる（同じお店には1回だけ） */}
        <form action={notify} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="listingId" value={listingId} />
          {notifiedCount > 0 && <p className="rounded-lg border border-line bg-surface px-3 py-2 text-center">知らせ済み（{notifiedCount}件）</p>}
          {newCount > 0 && (
            <>
              {expired && (
                <>
                  <p className="text-xs">受付期限が過ぎているので、知らせる前に延ばします（回答期限は、新しい受付期限の1日後になります）</p>
                  <DaysChoice />
                </>
              )}
              <button type="submit" disabled={busy} className="btn btn-sm btn-earth">
                {notifying ? "知らせています…" : notifiedCount > 0 ? `新しく探しているお店 ${newCount}件に知らせる` : "探しているお店に出品を知らせる"}
              </button>
            </>
          )}
          {notifiedCount === 0 && newCount === 0 && <p className="text-xs text-muted">今は、知らせられるお店がありません。</p>}
        </form>
      </div>

      {/* 3つのボタン */}
      <form action={keep} className="flex flex-col gap-2">
        <input type="hidden" name="listingId" value={listingId} />
        <DaysChoice />
        <button type="submit" disabled={busy} className="btn btn-sm btn-outline-earth">
          {keeping ? "延ばしています…" : "販売を継続する（受付期限を延ばす）"}
        </button>
      </form>
      <Link href={`/producer/listings/new?from=${listingId}`} className="btn btn-sm btn-plain">
        条件を見直して再出品する
      </Link>
      <form action={close}>
        <input type="hidden" name="listingId" value={listingId} />
        <button type="submit" disabled={busy} className="w-full btn btn-sm btn-plain">
          {closing ? "終了しています…" : "受付を終了する"}
        </button>
      </form>
      {message && <p className={continueState.ok || notifyState.ok || closeState.ok ? "font-bold" : "text-red-700 dark:text-red-400"}>{message}</p>}
    </div>
  );
}
