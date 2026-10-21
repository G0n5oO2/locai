"use client";
// 地図で探す（第2版）
// 地図には、出品がある市区町村の代表地点に「件数の丸」を出す（畑の場所は出さない：不変条件4）
// スマホは指でなぞって囲む、パソコンはマウスで円を描いて囲む。囲んだ中の出品だけを下に並べる
// 地図の絵は国土地理院の淡色地図を使う（端に出典を表示する）

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AreaMap, isInside, type Area } from "@/app/ui/area-map";
import { mapSearch } from "@/app/actions/map-search";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import type { MapListing } from "@/lib/map-search";
import { gramsToKgText } from "@/lib/quantity";
import { PriceBox, QualityTags } from "@/app/ui/price-box";


export function MapSearch({ home }: { home: { lat: number; lng: number; label: string } }) {
  const [vegetable, setVegetable] = useState("");
  const [listings, setListings] = useState<MapListing[] | null>(null);
  const [message, setMessage] = useState("");
  const [area, setArea] = useState<Area | null>(null);
  const [pending, startTransition] = useTransition();

  // 食材の名前で絞って、受付中の出品を読み直す
  const load = (text: string) =>
    startTransition(async () => {
      const r = await mapSearch(text);
      if ("message" in r) {
        setMessage(r.message);
        return;
      }
      setMessage("");
      setListings(r.listings);
    });

  // 最初に開いたときは、すべての食材を読む
  useEffect(() => {
    load("");
  }, []);

  // 囲んだ中にある出品だけ（並び順はサーバーが決めた順のまま）
  const inside = listings && area ? listings.filter((l) => isInside(area, l)) : [];

  return (
    <div className="flex flex-col gap-4">
      <form
        className="card flex flex-col gap-3 p-4 md:flex-row md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          load(vegetable);
        }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="map-vegetable" className="text-sm font-bold">
            食材（空なら種類を問わない）
          </label>
          <input
            id="map-vegetable"
            value={vegetable}
            maxLength={50}
            placeholder="例：賀茂茄子"
            onChange={(e) => setVegetable(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-3 text-base"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-leaf md:w-fit md:px-10">
          {pending ? "読み込み中…" : "地図に出す"}
        </button>
        {message && <p className="text-sm text-red-700 dark:text-red-400">{message}</p>}
      </form>

      <p className="text-xs text-muted">
        丸の中の数字は、その市区町村にある出品の数です。場所は市区町村の役所の位置で、畑の場所ではありません。地図で探すときは、お店からの距離では絞りません。
      </p>

      <AreaMap points={listings ?? []} home={{ ...home, label: `お店の地域（${home.label}）` }} area={area} onArea={setArea} />

      {listings && listings.length === 0 && <p className="text-sm text-muted">今、受付中の出品はありません。</p>}
      {listings && listings.length > 0 && !area && <p className="text-sm text-muted">地図で地域を囲むと、その中の出品が下に並びます。</p>}
      {area && (
        <section aria-label="囲んだ地域の出品" className="flex flex-col gap-3">
          <p className="font-bold">囲んだ地域の出品（{inside.length}件）</p>
          {inside.length === 0 ? (
            <p className="text-sm text-muted">囲んだ中に出品はありません。もう少し広く囲んでみてください。</p>
          ) : (
            <>
              <p className="text-xs text-muted">毎回ばらばらに並べ、同じ農家さんの出品は続けて並ばないようにしています。</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {inside.map((l) => (
                  <MapCard key={l.listingId} l={l} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

// 出品のカード（金額は、数量を入れる次の画面でアプリが計算する）
// 値段をいちばん大きく、茶色の囲みで目立たせる。量・日付・受け取り方法は小さな枠に分けて、ひと目で読めるようにする
function MapCard({ l }: { l: MapListing }) {
  return (
    <article className="flex flex-col gap-3 card p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
          <p className="text-xl font-bold">{l.vegetable}</p>
          <QualityTags quality={l.quality} surplus={l.surplus} />
        </div>
        <p className="text-sm text-muted">
          {l.producerName}・{l.area}
          {l.distanceKm !== null && `（お店から 約${l.distanceKm}km）`}
        </p>
      </div>

      {/* 値段 */}
      <PriceBox unitG={l.unitG} unitPriceYen={l.unitPriceYen} />

      {/* 量・日付・受け取り方法 */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-leaf-soft px-3 py-2">
          <dt className="text-xs font-bold text-leaf">申し込める量</dt>
          <dd className="text-base font-bold">
            {gramsToKgText(l.minOrderG)}〜{gramsToKgText(l.availableG)}kg
          </dd>
        </div>
        <div className="rounded-xl bg-leaf-soft px-3 py-2">
          <dt className="text-xs font-bold text-leaf">届けられる日</dt>
          <dd className="text-base font-bold">
            {formatDate(new Date(l.deliverFrom))}〜{formatDate(new Date(l.deliverTo))}
          </dd>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
          <dt className="text-xs font-bold text-muted">受け取り方法</dt>
          {l.methods.map((m) => (
            <dd key={m} className="rounded-full border border-leaf px-2 py-0.5 text-xs font-bold text-leaf">
              {methodLabel[m]}
            </dd>
          ))}
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
          <dt className="text-xs font-bold text-muted">受付期限</dt>
          <dd className="font-bold text-amber-800 dark:text-amber-300">{formatJstDateTime(new Date(l.acceptUntil))}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">合計金額（送料込み）は、次の画面で数量と受け取り方法を入れると、アプリが計算して出します。</p>
      <Link href={`/buyer/listings/${l.listingId}`} className="btn btn-leaf mt-auto">
        この出品の購入希望へ進む
      </Link>
    </article>
  );
}
