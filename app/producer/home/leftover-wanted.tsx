"use client";
// ホームの「残りの野菜を探しているお店」（第2版 4-3「ホーム」）
// 残りの量がある出品に、その野菜の「探しています」が来ていたら、すぐ気づけるようにホームに出す
// お店の名前・住所は出さない（不変条件4）。並びはサーバーで決めた順（近い順、同じ距離はランダム）

import Link from "next/link";
import { useActionState, useState } from "react";
import { notifyAction, type LeftoverState } from "@/app/actions/leftover";
import { methodLabel } from "@/lib/burden";
import { formatDate } from "@/lib/datetime";
import { gramsToKgText } from "@/lib/quantity";

export type LeftoverWantedItem = {
  id: string;
  vegetable: string;
  substitute: boolean; // 代わりの野菜として、この野菜を選んでいるお店
  quantityG: number;
  useDate: string;
  method: "delivery" | "self" | "pickup";
  area: string;
  km: number | null;
};

export type LeftoverWantedGroup = {
  listingId: string;
  vegetable: string;
  remainingG: number;
  expired: boolean; // 受付期限を過ぎているか（過ぎていたら、出品の画面で延ばしてから知らせる）
  wanted: LeftoverWantedItem[];
};

// 最初に見せる件数（「もっと見る」で残りも見られる）
const FIRST = 10;

export function LeftoverWanted({ groups }: { groups: LeftoverWantedGroup[] }) {
  return (
    <section aria-label="残りの野菜を探しているお店" className="flex flex-col gap-3 rounded-3xl border-2 border-earth bg-earth-soft/60 p-4">
      <h2 className="section-title section-title-earth">残りの野菜を探しているお店があります</h2>
      {groups.map((g) => (
        <Group key={g.listingId} g={g} />
      ))}
    </section>
  );
}

function Group({ g }: { g: LeftoverWantedGroup }) {
  const [showAll, setShowAll] = useState(false);
  const [state, notify, notifying] = useActionState<LeftoverState, FormData>(notifyAction, {});
  const shown = showAll ? g.wanted : g.wanted.slice(0, FIRST);
  return (
    <div className="flex flex-col gap-2 card p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
        <p className="text-lg font-bold">{g.vegetable}</p>
        <p className="text-sm">
          残り <strong className="text-earth">{gramsToKgText(g.remainingG)}kg</strong>・探しているお店 <strong className="text-earth">{g.wanted.length}件</strong>
        </p>
      </div>
      <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((w) => (
          <li key={w.id} className="flex flex-col rounded-xl bg-background px-3 py-2 text-sm">
            <span className="font-bold">
              {gramsToKgText(w.quantityG)}kg ほしい{w.substitute && `（${w.vegetable}の代わりとして）`}
            </span>
            <span className="text-xs text-muted">
              使用日 {formatDate(new Date(w.useDate))}・{methodLabel[w.method]}・{w.area}
              {w.km !== null && `（畑から 約${w.km}km）`}
            </span>
          </li>
        ))}
      </ul>
      {g.wanted.length > FIRST && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="w-fit text-sm font-bold text-earth underline">
          {showAll ? "少なく表示する" : `もっと見る（あと${g.wanted.length - FIRST}件）`}
        </button>
      )}
      {g.expired ? (
        // 受付期限を過ぎていたら、延ばす日数を選ぶ必要があるので、出品の画面へ
        <Link href="/producer/listings?status=expired" className="btn btn-sm btn-earth md:w-fit md:px-8">
          受付期限を延ばして知らせる（出品の画面へ）
        </Link>
      ) : (
        <form action={notify} className="flex flex-col gap-1">
          <input type="hidden" name="listingId" value={g.listingId} />
          <button type="submit" disabled={notifying} className="btn btn-sm btn-earth md:w-fit md:px-8">
            {notifying ? "知らせています…" : "探しているお店に、この出品を知らせる"}
          </button>
          {state.message && <p className={`text-sm ${state.ok ? "text-earth" : "text-red-700 dark:text-red-400"}`}>{state.message}</p>}
        </form>
      )}
    </div>
  );
}
