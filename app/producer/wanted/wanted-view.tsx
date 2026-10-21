"use client";
// お店の「探しています」を、一覧と地図で切り替えて見る（第2版）
// 地図の丸は、お店の市区町村の代表地点（役所の場所）に出す。店名・住所は出さない（不変条件4）
// 地図で囲むと、その地域の「探しています」だけが下に並ぶ

import Link from "next/link";
import { useState } from "react";
import { AreaMap, isInside, type Area } from "@/app/ui/area-map";
import { methodLabel } from "@/lib/burden";
import { formatDate } from "@/lib/datetime";
import { gramsToKgText } from "@/lib/quantity";
import type { PublicWanted } from "@/lib/wanted";

export type WantedWithPlace = PublicWanted & { lat: number; lng: number };

export function WantedView({ wanted, home }: { wanted: WantedWithPlace[]; home: { lat: number; lng: number; label: string } }) {
  const [tab, setTab] = useState<"list" | "map">("list");
  // 地図は、はじめて開いたときに読み込む
  const [mapOpened, setMapOpened] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const inside = area ? wanted.filter((w) => isInside(area, w)) : [];
  const tabs = [
    { key: "list", label: "一覧" },
    { key: "map", label: "地図" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="見かた" className="flex w-full rounded-full bg-earth-soft p-1 md:w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === "map") setMapOpened(true);
            }}
            className={`flex-1 rounded-full px-6 py-2 text-sm font-bold md:flex-none ${tab === t.key ? "bg-earth text-white shadow" : "text-earth"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div hidden={tab !== "list"}>
        {wanted.length === 0 ? <p className="text-muted">今は、「探しています」はありません。</p> : <WantedCards list={wanted} />}
      </div>

      {mapOpened && (
        <div hidden={tab !== "map"} className="flex flex-col gap-3">
          <p className="text-xs text-muted">丸の中の数字は、その市区町村のお店の「探しています」の数です。場所は市区町村の役所の位置で、お店の場所ではありません。</p>
          <AreaMap points={wanted} home={{ ...home, label: `畑の地域（${home.label}）` }} area={area} onArea={setArea} tone="earth" />
          {!area && wanted.length > 0 && <p className="text-sm text-muted">地図で地域を囲むと、その中の「探しています」が下に並びます。</p>}
          {area && (
            <section aria-label="囲んだ地域の「探しています」" className="flex flex-col gap-3">
              <p className="font-bold">囲んだ地域の「探しています」（{inside.length}件）</p>
              {inside.length === 0 ? <p className="text-sm text-muted">囲んだ中に「探しています」はありません。もう少し広く囲んでみてください。</p> : <WantedCards list={inside} />}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const kindLabel = { specified: "", substitute: "（代わりの野菜も可）", any: "種類を問わない" } as const;

// 「探しています」のカード（一覧と、地図で囲んだ結果で使い回す）
function WantedCards({ list }: { list: WantedWithPlace[] }) {
  return (
    // パソコンの幅では、カードを横に並べる
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {list.map((w) => (
        <div key={w.id} className="flex flex-col gap-1 card p-4 text-sm">
          {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
          <p className="font-bold">
            {w.vegetable}
            {kindLabel[w.kind]}・{gramsToKgText(w.quantityG)}kg
          </p>
          {w.substitutes.length > 0 && <p>代わりにOK：{w.substitutes.join("、")}</p>}
          <p className="text-muted">
            使用日 {formatDate(new Date(w.useDate))}・{methodLabel[w.method]}・{w.area}
          </p>
          <Link href={`/producer/listings/new${w.vegetable ? `?vegetable=${encodeURIComponent(w.vegetable)}` : ""}`} className="mt-1 font-bold text-earth underline">
            これに応えて出品する
          </Link>
        </div>
      ))}
    </div>
  );
}
