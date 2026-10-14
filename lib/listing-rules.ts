// 出品の量のルール（画面とサーバーの両方で使う。ルールはここだけに書く）
// 画面では入力したその場の案内に使い、サーバーでは保存の前に必ずもう一度確かめる

// 総量・注文単位・最低注文量（すべて g。まだ入っていなければ null）の関係を確かめ、エラーの文を返す
// 入っている値だけで確かめられるものは確かめる（例：倍数かどうかは、総量がなくても分かる）
export function quantityErrors(totalG: number | null, unitG: number | null, minOrderG: number | null): Record<string, string> {
  const errors: Record<string, string> = {};
  if (totalG && unitG && unitG > totalG) errors.unit = "注文単位は、販売可能総量以下にしてください";
  if (unitG && minOrderG && minOrderG % unitG !== 0) errors.minOrder = "最低注文量は、注文単位の倍数にしてください";
  else if (totalG && minOrderG && minOrderG > totalG) errors.minOrder = "最低注文量は、販売可能総量以下にしてください";
  return errors;
}
