// 今月の旬の野菜と、それぞれの出品の数（第2版 4-4「季節の野菜」）
// ホームの特集と、季節の野菜の画面で使い回す
import "server-only";
import { expireOverdue } from "./availability";
import { seasonalByMonth } from "./data/seasonal";
import { jstDateText } from "./datetime";
import { prisma } from "./prisma";
import { findMunicipality } from "./region";

export async function seasonalInfo(buyerPrefecture: string, buyerCity: string) {
  const month = Number(jstDateText(new Date()).slice(5, 7));
  const names = seasonalByMonth[month] ?? [];
  // 受付中のふつうの出品のうち、旬の野菜の名前を含むものを数える（第2版：70km 以内に絞る決まりは外した）
  await expireOverdue(prisma);
  const shop = findMunicipality(buyerPrefecture, buyerCity);
  const listings = await prisma.listing.findMany({
    where: { isTrial: false, status: "open", acceptUntil: { gt: new Date() } },
    select: { vegetable: true, producer: { select: { profile: { select: { prefecture: true, city: true } } } } },
  });
  const near = listings.filter((l) => {
    const farm = l.producer.profile && findMunicipality(l.producer.profile.prefecture, l.producer.profile.city);
    return shop && farm;
  });
  const vegetables = names.map((name) => ({ name, count: near.filter((l) => l.vegetable.includes(name)).length }));
  return { month, vegetables };
}
