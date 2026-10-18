// 計算タブの試算（第2版 4-3「計算」）
// 売上から、配送の実費・梱包費などを差し引いた「概算受取額」を出す。実際の注文や記録には使わない
// 金額は円、量は g の整数で計算する（小数を使わない）。画面とテストの両方から使う

// 単価（1kg あたりの円）と量（g）から商品代を出す。1円未満は切り捨て
export function itemYenOf(yenPerKg: number, grams: number): number {
  return Math.floor((yenPerKg * grams) / 1000);
}

// 直販の概算受取額 ＝ 商品代 ＋ お店から受け取る送料・配達料 − 配送の実費 − 梱包費
export function directReceipt(itemYen: number, c: { feeYen: number; deliveryCostYen: number; packingYen: number }): number {
  return itemYen + c.feeYen - c.deliveryCostYen - c.packingYen;
}

// 市場に出したときの概算受取額 ＝ 市場での単価 × 量 − 出荷の費用（手数料・運賃など）
export function marketReceipt(marketYenPerKg: number, grams: number, costYen: number): number {
  return itemYenOf(marketYenPerKg, grams) - costYen;
}

// 入力欄の円：空なら 0、0〜1,000,000 の整数でなければ null
export function yenInput(text: string): number | null {
  const t = text.trim();
  if (t === "") return 0;
  if (!/^\d{1,7}$/.test(t) || Number(t) > 1_000_000) return null;
  return Number(t);
}
