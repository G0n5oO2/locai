"use client";
// 概算受取額の試算（第2版 4-3「計算」）
// 単価と数量は1か所に入れるだけで、3つの受け渡し方法と市場のすべてに同じ商品代が入る
// 計算はブラウザの中だけで行い、保存しない（実際の注文の金額は、注文のときにサーバーが計算する）
import { useState } from "react";
import { directReceipt, itemYenOf, marketReceipt, yenInput } from "@/lib/estimate";
import { kgTextToGrams } from "@/lib/quantity";

const inputClass = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-base";
const errorClass = "text-xs text-red-700 dark:text-red-400";

// 受け渡し方法ごとに入れる費用（受け取りに来てもらうときは、送料も配送の実費もない）
const methods = [
  { key: "self", label: "自分で届ける", feeLabel: "お店から受け取る配達料", costLabel: "配送の実費（ガソリン代など）", hasDelivery: true },
  { key: "pickup", label: "受け取りに来てもらう", feeLabel: "", costLabel: "", hasDelivery: false },
  { key: "post", label: "郵送（宅配）", feeLabel: "お店から受け取る送料", costLabel: "送料の実費", hasDelivery: true },
] as const;
type MethodKey = (typeof methods)[number]["key"];
type Costs = { fee: string; cost: string; packing: string };

export function CalcForm() {
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costs, setCosts] = useState<Record<MethodKey, Costs>>({
    self: { fee: "", cost: "", packing: "" },
    pickup: { fee: "", cost: "", packing: "" },
    post: { fee: "", cost: "", packing: "" },
  });
  const [marketPrice, setMarketPrice] = useState("");
  const [marketCost, setMarketCost] = useState("");

  // 共通の商品代（単価 × 数量）
  const price = unitPrice.trim() === "" ? null : yenInput(unitPrice);
  const grams = kgTextToGrams(quantity);
  const itemYen = price !== null && price > 0 && grams !== null ? itemYenOf(price, grams) : null;

  const setCost = (m: MethodKey, field: keyof Costs, value: string) => setCosts((c) => ({ ...c, [m]: { ...c[m], [field]: value } }));

  // 受け渡し方法ごとの受取額（入力がそろっていなければ null）
  const results = methods.map((m) => {
    const fee = m.hasDelivery ? yenInput(costs[m.key].fee) : 0;
    const cost = m.hasDelivery ? yenInput(costs[m.key].cost) : 0;
    const packing = yenInput(costs[m.key].packing);
    const ok = itemYen !== null && fee !== null && cost !== null && packing !== null;
    return { ...m, fee, cost, packing, receipt: ok ? directReceipt(itemYen, { feeYen: fee, deliveryCostYen: cost, packingYen: packing }) : null };
  });
  const marketYen = yenInput(marketPrice);
  const marketCostYen = yenInput(marketCost);
  const market = grams !== null && marketPrice.trim() !== "" && marketYen !== null && marketYen > 0 && marketCostYen !== null ? marketReceipt(marketYen, grams, marketCostYen) : null;
  // 一番多く残る直販の方法
  const best = Math.max(...results.map((r) => r.receipt ?? -Infinity));

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-xl bg-earth-soft p-3 text-sm">
        これは<strong>試算（概算）</strong>です。入れた数字は保存されず、実際の注文の金額には使いません。費用は、あなたの実際の金額を入れてください。
      </p>

      {/* 共通：商品代（ここに入れると、下の全部に同じ商品代が入る） */}
      <section className="flex flex-col gap-3 md:max-w-md">
        <h2 className="font-bold">野菜の単価と数量</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold">
            単価（1kg あたりの円）
            <input inputMode="numeric" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="例：600" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold">
            数量（kg）
            <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="例：5" className={inputClass} />
          </label>
        </div>
        {unitPrice.trim() !== "" && (price === null || price === 0) && <p className={errorClass}>単価は 1〜1,000,000 の整数（円）で入れてください</p>}
        {quantity.trim() !== "" && grams === null && <p className={errorClass}>数量は 0.1kg 単位の数字で入れてください（例：2.5）</p>}
        <p className="text-sm">
          商品代：<strong className="text-lg">{itemYen === null ? "—" : `${itemYen.toLocaleString()}円`}</strong>
          <span className="ml-1 text-xs text-muted">（1円未満は切り捨て）</span>
        </p>
      </section>

      {/* 受け渡し方法ごとの試算と、市場に出したときの試算を横に並べる */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {results.map((r) => (
          <div key={r.key} className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 ${r.receipt !== null && r.receipt === best ? "border-earth" : "border-line"}`}>
            <h3 className="font-bold">{r.label}</h3>
            <p className="text-sm">商品代：{itemYen === null ? "—" : `${itemYen.toLocaleString()}円`}</p>
            {r.hasDelivery ? (
              <>
                <YenField label={r.feeLabel} value={costs[r.key].fee} onChange={(v) => setCost(r.key, "fee", v)} invalid={r.fee === null} />
                <YenField label={r.costLabel} value={costs[r.key].cost} onChange={(v) => setCost(r.key, "cost", v)} invalid={r.cost === null} />
              </>
            ) : (
              <p className="text-xs text-muted">お店が取りに来るので、送料も配送の実費もかかりません。</p>
            )}
            <YenField label="梱包費（袋・箱など）" value={costs[r.key].packing} onChange={(v) => setCost(r.key, "packing", v)} invalid={r.packing === null} />
            <Receipt yen={r.receipt} best={r.receipt !== null && r.receipt === best} />
          </div>
        ))}

        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line bg-surface p-4">
          <h3 className="font-bold">比べる：市場に出した場合</h3>
          <YenField label="市場での単価（1kg あたりの円）" value={marketPrice} onChange={setMarketPrice} invalid={marketPrice.trim() !== "" && (marketYen === null || marketYen === 0)} />
          <YenField label="出荷の費用（手数料・運賃など）" value={marketCost} onChange={setMarketCost} invalid={marketCostYen === null} />
          <Receipt yen={market} best={false} />
          {market !== null && best !== -Infinity && (
            <p className="text-sm">
              直販で一番多く残る方法との差：
              <strong className={best - market >= 0 ? "text-leaf" : "text-red-700 dark:text-red-400"}>
                {best - market >= 0 ? "+" : ""}
                {(best - market).toLocaleString()}円
              </strong>
            </p>
          )}
        </div>
      </section>
      <p className="text-xs text-muted">概算受取額 ＝ 商品代 ＋ お店から受け取る送料・配達料 − 配送の実費 − 梱包費。空の欄は 0円 として計算します。</p>
    </div>
  );
}

function YenField({ label, value, onChange, invalid }: { label: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}（円）
      <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" className={inputClass} />
      {invalid && <span className={errorClass}>0〜1,000,000 の整数（円）で入れてください</span>}
    </label>
  );
}

function Receipt({ yen, best }: { yen: number | null; best: boolean }) {
  return (
    <div className="mt-auto rounded-xl bg-earth-soft p-3">
      <p className="text-xs text-muted">概算受取額{best && "（直販で一番多い）"}</p>
      {/* 合計の値段は大きく、色を変えて分かりやすくする */}
      <p className={`text-2xl font-bold ${yen !== null && yen < 0 ? "text-red-700 dark:text-red-400" : "text-earth"}`}>{yen === null ? "—" : `${yen.toLocaleString()}円`}</p>
    </div>
  );
}
