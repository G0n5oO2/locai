// 金額の計算（不変条件2：金額はアプリが計算する。画面から送られた金額は使わない）
import type { DeliveryMethod } from "./burden";
import { deliveryFeeFor } from "./fees";

type ListingPrice = { unitG: number; unitPriceYen: number; minOrderG: number };
type ProfileFees = Parameters<typeof deliveryFeeFor>[0] & { selfDeliveryYen: number | null; pickupPlace: string | null };

export type Quote = { itemYen: number; shippingYen: number; totalYen: number };

// 量（g）と受け渡し方法から、商品代・送料・合計を計算する
// 計算できないとき（注文単位の倍数でない、送料が決まらない など）は、理由の文を返す
export function quote(listing: ListingPrice, profile: ProfileFees, quantityG: number, method: DeliveryMethod): Quote | { error: string } {
  if (quantityG % listing.unitG !== 0) return { error: "注文単位の倍数ではありません" };
  // 商品代 ＝ 単価（注文単位あたり）× 注文単位の数。必ず整数になる
  const itemYen = listing.unitPriceYen * (quantityG / listing.unitG);

  let shippingYen: number | null;
  if (method === "delivery") shippingYen = deliveryFeeFor(profile, quantityG);
  else if (method === "self") shippingYen = profile.selfDeliveryYen;
  else shippingYen = profile.pickupPlace === null ? null : 0;
  if (shippingYen === null) return { error: "この量・受け渡し方法では送料が決まりません" };

  return { itemYen, shippingYen, totalYen: itemYen + shippingYen };
}
