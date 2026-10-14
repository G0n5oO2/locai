// 「探しています」の読み出し（農家さんに見せる形にする）
import "server-only";
import type { DeliveryMethod } from "./burden";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { findMunicipality, isNear } from "./region";

// 農家さんに見せる形：地域・食材・希望数量・使用日・受け取り方法だけ（店名・住所・お店の ID は入れない）
export type PublicWanted = {
  id: string;
  kind: "specified" | "substitute" | "any";
  vegetable: string;
  substitutes: string[];
  quantityG: number;
  useDate: string; // "2026-10-22"
  method: DeliveryMethod;
  area: string; // "大阪府 大阪市福島区"
};

// 畑の地域から 70km 以内の、公開中の「探しています」（使用日を過ぎたものは出さない）
export async function nearWanted(farm: { prefecture: string; city: string }): Promise<PublicWanted[]> {
  const farmPlace = findMunicipality(farm.prefecture, farm.city);
  if (!farmPlace) return [];
  const today = parseDate(jstDateText(new Date()))!;
  const rows = await prisma.wantedRequest.findMany({
    where: { closed: false, useDate: { gte: today } },
    orderBy: { quantityG: "asc" },
  });
  return rows
    .filter((w) => {
      const shop = findMunicipality(w.prefecture, w.city);
      return shop !== undefined && isNear(farmPlace, shop);
    })
    .map((w) => ({
      id: w.id,
      kind: w.kind,
      vegetable: w.vegetable,
      substitutes: w.substitutes,
      quantityG: w.quantityG,
      useDate: w.useDate.toISOString().slice(0, 10),
      method: w.method,
      area: `${w.prefecture} ${w.city}`,
    }));
}
