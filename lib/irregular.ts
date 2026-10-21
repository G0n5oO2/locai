// 受付中のふつうの出品を、特集のために集める（第2版 4-4「ホーム」）
// - 規格外の野菜の特集：品の状態が「規格外」のもの
// - 季節の野菜：名前に旬の野菜の名前を含むもの
// 出すのは、最低注文量より残りがあるものだけ（第2版：70km 以内に絞る決まりは外した。遠くの農家さんにも見つけてもらうため）
// 並びはランダムで、同じ農家さんが続かないようにする（不変条件6：人気順にしない）
import "server-only";
import { expireOverdue, usedAmounts } from "./availability";
import { prisma } from "./prisma";
import { findMunicipality } from "./region";
import { noRepeatInRow, shuffle } from "./search";

type Filter = { quality?: "normal" | "irregular"; vegetableIncludes?: string };

export async function featuredListings(buyerPrefecture: string, buyerCity: string, filter: Filter) {
  const shop = findMunicipality(buyerPrefecture, buyerCity);
  if (!shop) return [];
  await expireOverdue(prisma);
  const listings = await prisma.listing.findMany({
    where: {
      isTrial: false,
      status: "open",
      acceptUntil: { gt: new Date() },
      ...(filter.quality ? { quality: filter.quality } : {}),
      ...(filter.vegetableIncludes ? { vegetable: { contains: filter.vegetableIncludes } } : {}),
    },
    include: { producer: { select: { name: true, profile: true } } },
  });
  const used = await usedAmounts(prisma, listings.map((l) => l.id));
  const shown = listings.flatMap((l) => {
    const profile = l.producer.profile;
    if (!profile) return [];
    const farm = findMunicipality(profile.prefecture, profile.city);
    if (!farm) return [];
    const u = used.get(l.id)!;
    const restG = l.totalG - u.confirmedG - u.reservedG;
    if (restG < l.minOrderG) return [];
    return [{ listing: l, area: `${profile.prefecture} ${profile.city}`, restG, producerId: l.producerId }];
  });
  return noRepeatInRow(shuffle(shown));
}

// 規格外の野菜の特集
export function irregularListings(buyerPrefecture: string, buyerCity: string) {
  return featuredListings(buyerPrefecture, buyerCity, { quality: "irregular" });
}

export type FeaturedListing = Awaited<ReturnType<typeof featuredListings>>[number];
