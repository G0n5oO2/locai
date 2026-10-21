// 地域（市区町村）と距離
// 第2版：70km 以内だけに絞る決まりは外した。距離は、近い順に並べることと、宅配の距離の料金・自分で配達の範囲に使う
import { municipalities } from "./data/municipalities";

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

// 畑とお店の距離（km の整数。小数は切り上げる）。市区町村の代表地点どうしの距離で、畑のくわしい場所は使わない（第2版）
// 地域が一覧にないときは null
export function farmShopKm(farm: { prefecture: string; city: string }, shop: { prefecture: string; city: string }): number | null {
  const a = findMunicipality(farm.prefecture, farm.city);
  const b = findMunicipality(shop.prefecture, shop.city);
  return a && b ? Math.ceil(distanceKm(a, b)) : null;
}
