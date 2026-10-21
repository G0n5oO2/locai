// 飲食店に見せるお試し食材（第2版 4-4「お試し」）
// 出すのは：受付中のお試し食材で、残りがあり、このお店がまだ買ったことがない野菜だけ
import "server-only";
import { expireOverdue, usedAmounts } from "./availability";
import { prisma } from "./prisma";
import { findMunicipality } from "./region";

export async function trialItemsFor(buyerId: string, buyerPrefecture: string, buyerCity: string, onlyId?: string) {
  const shop = findMunicipality(buyerPrefecture, buyerCity);
  if (!shop) return [];
  await expireOverdue(prisma);
  const now = new Date();
  const items = await prisma.listing.findMany({
    where: { isTrial: true, status: "open", acceptUntil: { gt: now }, ...(onlyId ? { id: onlyId } : {}) },
    include: { producer: { select: { id: true, name: true, profile: true } } },
    orderBy: { createdAt: "desc" },
  });
  const used = await usedAmounts(prisma, items.map((i) => i.id));

  // このお店が、農家さんごとに「買ったことがある野菜」と「返事待ちのお試しがある野菜」
  const mine = await prisma.order.findMany({
    where: {
      buyerId,
      listing: { producerId: { in: [...new Set(items.map((i) => i.producerId))] } },
      OR: [{ status: "confirmed" }, { isTrial: true, status: { in: ["pending", "change_pending"] } }],
    },
    select: { listing: { select: { producerId: true, vegetable: true } } },
  });
  const blocked = new Set(mine.map((o) => `${o.listing.producerId}|${o.listing.vegetable}`));

  return items.flatMap((i) => {
    const profile = i.producer.profile;
    if (!profile) return [];
    const farm = findMunicipality(profile.prefecture, profile.city);
    if (!farm) return [];
    const u = used.get(i.id)!;
    const restG = i.totalG - u.confirmedG - u.reservedG;
    if (restG < i.minOrderG) return [];
    if (blocked.has(`${i.producerId}|${i.vegetable}`)) return [];
    return [{ item: i, profile, restG }];
  });
}
