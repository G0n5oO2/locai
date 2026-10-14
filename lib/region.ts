// 地域（市区町村）と「近いかどうか」の判断
// 決めたこと：代表地点どうしのまっすぐな距離が 70km 以内なら「近い」（docs/04_producer_design.md 5章）
import { municipalities } from "./data/municipalities";

export const NEAR_DISTANCE_KM = 70;

export const prefectures = ["滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"] as const;

type Municipality = (typeof municipalities)[number];

// 府県と市区町村の組み合わせが一覧にあるかを調べる（画面から送られた値を信用しないため）
export function findMunicipality(prefecture: string, city: string): Municipality | undefined {
  return municipalities.find((m) => m.prefecture === prefecture && m.city === city);
}

// 府県ごとの市区町村の一覧（入力欄の選択肢に使う）
export function citiesOf(prefecture: string): string[] {
  return municipalities.filter((m) => m.prefecture === prefecture).map((m) => m.city);
}

// 2地点のまっすぐな距離（km）。地球を球として計算する
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 2つの市区町村が「近い」かどうか
export function isNear(a: Municipality, b: Municipality): boolean {
  return distanceKm(a, b) <= NEAR_DISTANCE_KM;
}
