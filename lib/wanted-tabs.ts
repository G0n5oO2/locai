// 「探しています」を3つのタブに分ける（docs/04_producer_design.md 1章）
// 画面とサーバーの両方で使う
import type { PublicWanted } from "./wanted";

export type WantedTab = "specified" | "substitute" | "any";

// 野菜の名前が同じとみなすか：どちらかがどちらかを含んでいれば同じ（例：「伏見甘長」と「伏見甘長唐辛子」）
export function sameVegetable(a: string, b: string): boolean {
  const x = a.trim();
  const y = b.trim();
  return x !== "" && y !== "" && (x.includes(y) || y.includes(x));
}

// 出品する食材名に合わせて、3つのタブに分ける。それぞれ希望数量が少ない順
export function splitWanted(list: PublicWanted[], vegetable: string) {
  const name = vegetable.trim();
  const byQuantity = (a: PublicWanted, b: PublicWanted) => a.quantityG - b.quantityG;
  return {
    // その食材を探しているお店（「代替野菜も可」でも、元の食材が同じならここに入る）
    specified: name === "" ? [] : list.filter((w) => w.kind !== "any" && sameVegetable(w.vegetable, name)).sort(byQuantity),
    // お店が代替野菜として選んだものに、出品する食材が入っている
    substitute:
      name === ""
        ? []
        : list.filter((w) => w.kind === "substitute" && !sameVegetable(w.vegetable, name) && w.substitutes.some((s) => sameVegetable(s, name))).sort(byQuantity),
    // 種類を問わない
    any: list.filter((w) => w.kind === "any").sort(byQuantity),
  };
}

// 最初に開くタブ：出品する食材 → 0件なら代替野菜OK → それも0件なら種類を問わない
export function firstTab(tabs: ReturnType<typeof splitWanted>): WantedTab {
  if (tabs.specified.length > 0) return "specified";
  if (tabs.substitute.length > 0) return "substitute";
  return "any";
}
