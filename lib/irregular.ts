// 規格外の野菜の特集（第2版 4-4「ホーム」）
// 出すのは：受付中のふつうの出品で「規格外」のもの、畑とお店が近く、最低注文量より残りがあるもの
// 並びはランダムで、同じ農家さんが続かないようにする（不変条件6：人気順にしない）
import "server-only";
import { expireOverdue, usedAmounts } from "./availability";
import { prisma } from "./prisma";
import { findMunicipality, isNear } from "./region";
import { noRepeatInRow, shuffle } from "./search";

export async function irregularListings(buyerPrefecture: string, buyerCity: string) {
  const shop = findMunicipality(buyerPrefecture, buyerCity);
  if (!shop) return [];
  await expireOverdue(prisma);
  const listings = await prisma.listing.findMany({
    where: { isTrial: false, quality: "irregular", status: "open", acceptUntil: { gt: new Date() } },
    include: { producer: { select: { name: true, profile: true } } },
  });
  const used = await usedAmounts(prisma, listings.map((l) => l.id));
  const shown = listings.flatMap((l) => {
    const profile = l.producer.profile;
    if (!profile) return [];
    const farm = findMunicipality(profile.prefecture, profile.city);
    if (!farm || !isNear(farm, shop)) return [];
    const u = used.get(l.id)!;
    const restG = l.totalG - u.confirmedG - u.reservedG;
    if (restG < l.minOrderG) return [];
    return [{ listing: l, area: `${profile.prefecture} ${profile.city}`, restG, producerId: l.producerId }];
  });
  return noRepeatInRow(shuffle(shown));
}
