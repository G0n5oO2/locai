// 量の変換（画面では kg、保存は g の整数）
// 小数の計算をすると誤差が出るので、文字のまま分けて g の整数にする

// "1.5" → 1500、"2" → 2000。0.1kg（100g）より細かい値や、数字でないものは null
export function kgTextToGrams(text: string): number | null {
  const match = /^(\d{1,4})(?:\.(\d))?$/.exec(text.trim());
  if (!match) return null;
  return Number(match[1]) * 1000 + Number(match[2] ?? "0") * 100;
}

// 1500 → "1.5"、2000 → "2"（入力欄に戻すとき・表示するときに使う）
export function gramsToKgText(grams: number): string {
  const kg = Math.floor(grams / 1000);
  const rest = Math.floor((grams % 1000) / 100);
  return rest === 0 ? String(kg) : `${kg}.${rest}`;
}
