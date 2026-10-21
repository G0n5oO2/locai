// 送料・配達料の計算（金額はアプリが計算する：不変条件2）

type BandColumns = {
  deliveryBand1MaxG: number | null;
  deliveryBand1Yen: number | null;
  deliveryBand2MaxG: number | null;
  deliveryBand2Yen: number | null;
  deliveryBand3MaxG: number | null;
  deliveryBand3Yen: number | null;
};

// プロフィールの3行の送料を、「◯g まで ◯円」の一覧にする（入っている行だけ）
export function deliveryBands(p: BandColumns): { maxG: number; yen: number }[] {
  const rows = [
    [p.deliveryBand1MaxG, p.deliveryBand1Yen],
    [p.deliveryBand2MaxG, p.deliveryBand2Yen],
    [p.deliveryBand3MaxG, p.deliveryBand3Yen],
  ];
  return rows.filter(([g, yen]) => g !== null && yen !== null).map(([g, yen]) => ({ maxG: g as number, yen: yen as number }));
}

// 宅配の送料：注文の量が入る、いちばん軽い帯の金額。どの帯にも入らなければ null（宅配では受け付けない）
export function deliveryFeeFor(p: BandColumns, grams: number): number | null {
  const band = deliveryBands(p).find((b) => grams <= b.maxG);
  return band ? band.yen : null;
}

// ===== 距離の料金（第2版） =====
// 距離の料金は、5行まで（「＋距離の料金を追加」で増やす）
export const MAX_DISTANCE_ROWS = 5;
type DistanceColumns = { distanceFeeMaxKm: number[]; distanceFeeYen: number[] };

// 「◯km まで ◯円」の一覧（近い順）
export function distanceBands(p: DistanceColumns): { maxKm: number; yen: number }[] {
  return p.distanceFeeMaxKm.map((maxKm, i) => ({ maxKm, yen: p.distanceFeeYen[i] })).filter((b) => b.yen !== undefined);
}

// 宅配の距離の料金
// 表がなければ 0円。表があって、どの行にも入らない（表より遠い）ときは null（送料は要相談）
export function distanceFeeFor(p: DistanceColumns, km: number): number | null {
  const bands = distanceBands(p);
  if (bands.length === 0) return 0;
  const band = bands.find((b) => km <= b.maxKm);
  return band ? band.yen : null;
}
