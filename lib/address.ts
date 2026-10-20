// 住所の入力の確かめ（第2版）。「ああああ」のような、でたらめな入力では保存できないようにする
// 画面とサーバーの両方で使う。決まり：
// - 6〜200文字
// - 番地などの数字（0〜9・０〜９）か、「丁目・番地・番・号」のどれかがある
// - 漢字が入っている（市・町・区などがある。ひらがな・カタカナと数字だけではない）
// - 同じ文字が4つ以上続かない（例：ああああ、1111）
export const ADDRESS_HINT = "例：大阪市福島区福島1-2-3";

export function addressError(text: string): string | null {
  const t = text.trim();
  if (t.length < 6) return `住所を正しく入力してください（${ADDRESS_HINT}）`;
  if (t.length > 200) return "200文字以内にしてください";
  if (/(.)\1{3,}/u.test(t)) return `同じ文字が続いています。住所を正しく入力してください（${ADDRESS_HINT}）`;
  if (!/[0-9０-９]|丁目|番地|番|号/u.test(t)) return `番地まで入力してください（${ADDRESS_HINT}）`;
  if (!/\p{Script=Han}/u.test(t)) return `住所を正しく入力してください（${ADDRESS_HINT}）`;
  return null;
}
