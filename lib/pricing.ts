// 金額の計算（不変条件2：金額はアプリが計算する。画面から送られた金額は使わない）
import type { DeliveryMethod } from "./burden";
import { deliveryFeeFor, distanceFeeFor } from "./fees";

type ListingPrice = { unitG: number; unitPriceYen: number; minOrderG: number };
type ProfileFees = Parameters<typeof deliveryFeeFor>[0] &
  Parameters<typeof distanceFeeFor>[0] & { selfDeliveryYen: number | null; selfDeliveryMaxKm: number | null; pickupPlace: string | null };

// shippingToBeDecided が true のときは、送料が要相談（shippingYen は 0、合計は商品代だけ）
export type Quote = { itemYen: number; shippingYen: number; totalYen: number; shippingToBeDecided: boolean };

// 量（g）と受け渡し方法と、畑からお店までの距離（km）から、商品代・送料・合計を計算する
// 計算できないとき（注文単位の倍数でない、送料が決まらない、配達できない距離 など）は、理由の文を返す
export function quote(listing: ListingPrice, profile: ProfileFees, quantityG: number, method: DeliveryMethod, km: number): Quote | { error: string } {
  if (quantityG % listing.unitG !== 0) return { error: "注文単位の倍数ではありません" };
  // 商品代 ＝ 単価（注文単位あたり）× 注文単位の数。必ず整数になる
  const itemYen = listing.unitPriceYen * (quantityG / listing.unitG);

  if (method === "delivery") {
    // 宅配の送料 ＝ 重さの料金 ＋ 距離の料金（第2版）
    const weightYen = deliveryFeeFor(profile, quantityG);
    if (weightYen === null) return { error: "この量では、宅配の送料が決まりません" };
    const distanceYen = distanceFeeFor(profile, km);
    // 距離の料金の表より遠いお店は、送料が要相談（農家さんが送料を入れて、お店がもう一度同意する）
    if (distanceYen === null) return { itemYen, shippingYen: 0, totalYen: itemYen, shippingToBeDecided: true };
    const shippingYen = weightYen + distanceYen;
    return { itemYen, shippingYen, totalYen: itemYen + shippingYen, shippingToBeDecided: false };
  }

  let shippingYen: number | null;
  if (method === "self") {
    // 農家さんが決めた距離より遠いお店には、自分で配達しない（第2版）
    if (profile.selfDeliveryMaxKm !== null && km > profile.selfDeliveryMaxKm) return { error: `この農家さんの配達は、${profile.selfDeliveryMaxKm}km までのお店だけです` };
    shippingYen = profile.selfDeliveryYen;
  } else shippingYen = profile.pickupPlace === null ? null : 0;
  if (shippingYen === null) return { error: "この受け渡し方法では、送料が決まりません" };

  return { itemYen, shippingYen, totalYen: itemYen + shippingYen, shippingToBeDecided: false };
}

// 購入希望の画面に渡す、送料の計算に使う値（引き取りの場所そのものは渡さない。引き取りできるときは "" にする：不変条件4）
export function feesForForm(p: ProfileFees): ProfileFees {
  return {
    deliveryBand1MaxG: p.deliveryBand1MaxG,
    deliveryBand1Yen: p.deliveryBand1Yen,
    deliveryBand2MaxG: p.deliveryBand2MaxG,
    deliveryBand2Yen: p.deliveryBand2Yen,
    deliveryBand3MaxG: p.deliveryBand3MaxG,
    deliveryBand3Yen: p.deliveryBand3Yen,
    distanceFeeMaxKm: p.distanceFeeMaxKm,
    distanceFeeYen: p.distanceFeeYen,
    selfDeliveryYen: p.selfDeliveryYen,
    selfDeliveryMaxKm: p.selfDeliveryMaxKm,
    pickupPlace: p.pickupPlace === null ? null : "",
  };
}

// 自分で配達を選べるか（農家さんが決めた距離より遠いお店は、選べない）
export function selfDeliveryAllowed(p: { selfDeliveryMaxKm: number | null }, km: number): boolean {
  return p.selfDeliveryMaxKm === null || km <= p.selfDeliveryMaxKm;
}
