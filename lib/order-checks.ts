// 生産者向け：注文の「確認が必要な点」を、アプリの決まりで見つける（AI には決めさせない）
// AI はこれを短い文にまとめるだけ（lib/ai-order-summary.ts）
import "server-only";
import { methodLabel } from "./burden";
import { jstDateText, parseDate } from "./datetime";
import { findMunicipality, distanceKm } from "./region";

const day = 24 * 60 * 60 * 1000;

type CheckInput = {
  method: "delivery" | "self" | "pickup";
  deliveryDate: Date;
  useDate: Date;
  showUseDate: boolean;
  isTrial: boolean;
  quality: "normal" | "irregular";
  farm: { prefecture: string; city: string };
  shop: { prefecture: string; city: string } | null;
  sameDayCount: number; // その納品日の、同じ受け渡し方法の件数
  limit: number; // その受け渡し方法の基準
};

// 確認が必要な点の一覧（短い文）
export function orderChecks(o: CheckInput): string[] {
  const checks: string[] = [];
  const today = parseDate(jstDateText(new Date()))!;
  const daysLeft = Math.round((o.deliveryDate.getTime() - today.getTime()) / day);
  if (daysLeft <= 2) checks.push(`納品日まで${daysLeft}日しかありません`);
  if (o.sameDayCount > o.limit) checks.push(`この日の${methodLabel[o.method]}が${o.sameDayCount}件で、基準（${o.limit}件）を超えています`);
  if (o.shop) {
    const farm = findMunicipality(o.farm.prefecture, o.farm.city);
    const shop = findMunicipality(o.shop.prefecture, o.shop.city);
    // 距離は 10km 単位のおおよそ。50km より遠いときだけ知らせる
    if (farm && shop) {
      const km = Math.round(distanceKm(farm, shop) / 10) * 10;
      if (km > 50 && o.method !== "pickup") checks.push(`お店まで約${km}km（まっすぐな距離）で、遠めです`);
    }
  }
  if (o.showUseDate && o.useDate.getTime() === o.deliveryDate.getTime()) checks.push("使用日が納品日と同じなので、納品日はずらせません");
  if (o.isTrial) checks.push("お試しの申し込みです（このお店は、あなたから買うのが初めてです）");
  if (o.quality === "irregular") checks.push("規格外の出品への申し込みです。品の状態が伝わっているか、メッセージで確かめると安心です");
  return checks;
}
