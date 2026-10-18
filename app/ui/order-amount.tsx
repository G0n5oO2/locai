// 注文の量と金額を、ひと目で分かるように出す部品（注文の一覧と注文の詳細で使い回す）
// 合計は大きく、色を変えて目立たせ、商品代と送料の内訳は小さく添える（第1版：商品代と送料を分けて見せる）
import { gramsToKgText } from "@/lib/quantity";

type Props = {
  isTrial: boolean;
  quantityG: number;
  unitG: number;
  unitPriceYen: number;
  itemYen: number;
  shippingYen: number;
  totalYen: number;
};

// 量の書き方：お試しは g、ふつうは kg
export function quantityText(grams: number, isTrial: boolean) {
  return isTrial ? `${grams.toLocaleString()}g` : `${gramsToKgText(grams)}kg`;
}

export function OrderAmount({ isTrial, quantityG, unitG, unitPriceYen, itemYen, shippingYen, totalYen }: Props) {
  const unitText = isTrial ? `${unitG}g` : `${gramsToKgText(unitG)}kg`;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-leaf-soft p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">数量</span>
        <span className="text-xl font-bold">{quantityText(quantityG, isTrial)}</span>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm">
        <dt className="text-muted">
          商品代（{unitText} あたり {unitPriceYen.toLocaleString()}円 × {quantityG / unitG}）
        </dt>
        <dd className="text-right">{itemYen.toLocaleString()}円</dd>
        <dt className="text-muted">送料・配達料</dt>
        <dd className="text-right">{shippingYen.toLocaleString()}円</dd>
      </dl>
      <div className="flex items-baseline justify-between gap-2 border-t border-line pt-2">
        <span className="font-bold">合計</span>
        <span className="text-2xl font-bold text-leaf">{totalYen.toLocaleString()}円</span>
      </div>
    </div>
  );
}
