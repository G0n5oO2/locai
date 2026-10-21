// 地図で探す（第2版）
// 地図で囲んだ地域の、受付中の出品を出す。条件で探すと違い、お店からの距離（70km）では絞らない（遠くの農家さんも見つけてもらえるように）
// 場所は市区町村の代表地点（役所の場所）だけを使う。畑の場所は出さない（不変条件4）
// 並び順はランダムで、同じ農家さんが続かないようにする（不変条件5・6）
import "server-only";
import type { DeliveryMethod } from "./burden";
import { expireOverdue, usedAmounts } from "./availability";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { findMunicipality } from "./region";
import { noRepeatInRow, shuffle } from "./search";

export type MapListing = {
  listingId: string;
  vegetable: string;
  producerName: string;
  area: string; // 「府県 市区町村」
  lat: number; // 市区町村の代表地点
  lng: number;
  quality: "normal" | "irregular";
  surplus: boolean;
  unitG: number;
  unitPriceYen: number;
  minOrderG: number;
  availableG: number; // 今、申し込める量
  methods: DeliveryMethod[];
  deliverFrom: string; // 届けられる最初の日（"2026-10-20"）
  deliverTo: string;
  acceptUntil: Date;
};

export async function mapListings(buyerId: string, vegetable: string): Promise<MapListing[]> {
  // 回答期限を過ぎた返事待ちは、先に期限切れにして、仮押さえを解除しておく
  await expireOverdue(prisma);

  const now = new Date();
  const today = parseDate(jstDateText(now))!;
  const listings = await prisma.listing.findMany({
    where: {
      status: "open",
      isTrial: false, // お試し食材は、お試しのタブにだけ出す
      acceptUntil: { gt: now },
      deliverTo: { gte: today },
      vegetable: { contains: vegetable, mode: "insensitive" },
      producerId: { not: buyerId },
    },
    include: { producer: { select: { id: true, name: true, profile: { select: { prefecture: true, city: true } } } } },
  });
  const used = await usedAmounts(prisma, listings.map((l) => l.id));

  const rows: (MapListing & { producerId: string })[] = [];
  for (const l of listings) {
    const profile = l.producer.profile;
    const place = profile && findMunicipality(profile.prefecture, profile.city);
    if (!place) continue;
    // 残りの量が、最低注文量に届かない出品は出さない（不変条件1）
    const u = used.get(l.id)!;
    const availableG = l.totalG - u.confirmedG - u.reservedG;
    if (availableG < l.minOrderG) continue;
    const from = l.deliverFrom > today ? l.deliverFrom : today;
    rows.push({
      producerId: l.producerId,
      listingId: l.id,
      vegetable: l.vegetable,
      producerName: l.producer.name,
      area: `${place.prefecture} ${place.city}`,
      lat: place.lat,
      lng: place.lng,
      quality: l.quality,
      surplus: l.surplus,
      unitG: l.unitG,
      unitPriceYen: l.unitPriceYen,
      minOrderG: l.minOrderG,
      availableG,
      methods: (["delivery", "self", "pickup"] as const).filter((m) => ({ delivery: l.offersDelivery, self: l.offersSelf, pickup: l.offersPickup })[m]),
      deliverFrom: from.toISOString().slice(0, 10),
      deliverTo: l.deliverTo.toISOString().slice(0, 10),
      acceptUntil: l.acceptUntil,
    });
  }

  // 地図に出した農家さんの「表示された回数」を1つ増やす（露出の偏りを確かめるための記録。不変条件6）
  const producerIds = [...new Set(rows.map((r) => r.producerId))];
  await Promise.all(
    producerIds.map((producerId) =>
      prisma.producerExposure.upsert({ where: { producerId }, create: { producerId, count: 1 }, update: { count: { increment: 1 } } }),
    ),
  );

  // 画面に渡すときは、農家さんの ID は外す（必要なものだけ渡す）
  return noRepeatInRow(shuffle(rows)).map((r) => {
    const copy: Partial<typeof r> = { ...r };
    delete copy.producerId;
    return copy as MapListing;
  });
}
