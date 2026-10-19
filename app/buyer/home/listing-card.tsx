// 特集に並べる出品のカード（規格外の野菜の特集・季節の野菜で使い回す）
// 押すと購入希望の画面（詳しい内容つき）が開き、ふつうの購入希望と同じ流れで申し込む
import Link from "next/link";
import type { FeaturedListing } from "@/lib/irregular";
import { gramsToKgText } from "@/lib/quantity";
import { IrregularArt, VegIcon } from "./feature-art";

export function ListingCard({ item }: { item: FeaturedListing }) {
  const { listing: l, area } = item;
  const irregular = l.quality === "irregular";
  // 1kg あたりの値段は、比べるための参考（計算には使わない）
  const perKg = Math.round((l.unitPriceYen * 1000) / l.unitG);
  return (
    <Link href={`/buyer/listings/${l.id}`} className="relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line transition-transform hover:-translate-y-0.5">
      {/* 右上の印（規格外か通常品か） */}
      <span className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-bold text-white ${irregular ? "bg-earth" : "bg-leaf"}`}>{irregular ? "規格外" : "通常品"}</span>
      {/* 出品の写真は、写真のステップで作る。それまでは絵を出す */}
      <div className={`flex justify-center rounded-2xl py-2 ${irregular ? "bg-earth-soft" : "bg-leaf-soft"}`}>{irregular ? <IrregularArt /> : <VegIcon name={l.vegetable} />}</div>
      <div>
        {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
        <p className="text-xl font-bold">{l.vegetable}</p>
        <p className="text-sm text-muted">
          {l.producer.name}・{area}
        </p>
      </div>
      {/* 状態は、買うかどうか決める大事な手がかりなので、色の付いた枠で目立たせる */}
      {l.note && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-950">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">状態</p>
          <p className="whitespace-pre-wrap">{l.note}</p>
        </div>
      )}
      {/* 値段は大きく、色を変えて目立たせる */}
      <div className="flex items-end justify-between gap-2">
        <p className="flex items-baseline gap-1">
          <span className="text-sm text-muted">{gramsToKgText(l.unitG)}kg あたり</span>
          <span className={`text-3xl font-bold ${irregular ? "text-earth" : "text-leaf"}`}>{l.unitPriceYen.toLocaleString()}円</span>
        </p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${irregular ? "bg-earth-soft text-earth" : "bg-leaf-soft text-leaf"}`}>1kg 約{perKg.toLocaleString()}円</span>
      </div>
      <p className="text-xs text-muted">最低 {gramsToKgText(l.minOrderG)}kg から</p>
      <span className={`mt-auto rounded-xl px-4 py-3 text-center font-bold text-white ${irregular ? "bg-earth" : "bg-leaf"}`}>詳しく見る・希望する →</span>
    </Link>
  );
}
