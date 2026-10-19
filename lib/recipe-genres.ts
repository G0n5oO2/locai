// 料理の案の種類（画面とサーバーの両方で使うので、"server-only" は付けない）
export const GENRES = ["すべて", "和食", "洋食", "中華", "フレンチ", "イタリアン"] as const;
export type Genre = (typeof GENRES)[number];
