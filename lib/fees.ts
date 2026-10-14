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
