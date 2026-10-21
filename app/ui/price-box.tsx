// 出品の値段を、ひと目で分かるように出す部品（地図で探す・購入希望の画面で使い回す）
// 「1kg あたり 約◯円」を大きく出して、ほかの出品と比べやすくする。実際の注文の単位と値段は、その下に添える
import { gramsToKgText } from "@/lib/quantity";

export function PriceBox({ unitG, unitPriceYen }: { unitG: number; unitPriceYen: number }) {
  // 1kg あたりの値段は、比べるための目安（計算には使わない）
  const perKg = Math.round((unitPriceYen * 1000) / unitG);
  return (
    <div className="flex flex-col rounded-2xl bg-earth-soft px-4 py-3">
      <p className="text-xs font-bold text-earth">1kg あたり</p>
      <p className="text-earth">
        <span className="text-sm font-bold">約 </span>
        <span className="text-3xl font-bold">{perKg.toLocaleString()}</span>
        <span className="text-lg font-bold"> 円</span>
      </p>
      <p className="text-sm">
        注文は {gramsToKgText(unitG)}kg ごと（{gramsToKgText(unitG)}kg で <strong>{unitPriceYen.toLocaleString()}円</strong>）
      </p>
    </div>
  );
}

// 品の状態の札（通常品・規格外・余剰品）
export function QualityTags({ quality, surplus }: { quality: "normal" | "irregular"; surplus: boolean }) {
  return (
    <>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${quality === "normal" ? "bg-leaf-soft text-leaf" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>
        {quality === "normal" ? "通常品" : "規格外"}
      </span>
      {surplus && <span className="rounded-full bg-earth-soft px-2 py-0.5 text-xs font-bold text-earth">余剰品</span>}
    </>
  );
}
