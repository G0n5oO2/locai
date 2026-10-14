// 出品を探す（飲食店の条件に、すべて合う出品だけを出す）
// 並び順：3つの枠に分け、それぞれの中で「表示された回数が少ない農家さん」から（不変条件6）
import "server-only";
import type { DeliveryMethod } from "./burden";
import { expireOverdue, usedAmounts } from "./availability";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { quote } from "./pricing";
import { findMunicipality, isNear } from "./region";

export type SearchInput = {
  buyerId: string;
  buyerPrefecture: string;
  buyerCity: string;
  vegetable: string;
  quantityG: number;
  budgetYen: number;
  useDate: Date;
  method: DeliveryMethod;
};

export type Candidate = {
  listingId: string;
  vegetable: string;
  producerName: string;
  producerArea: string;
  items: string;
  commitment: string;
  quality: "normal" | "irregular";
  surplus: boolean;
  note: string;
  unitG: number;
  unitPriceYen: number;
  quantityG: number;
  itemYen: number;
  shippingYen: number;
  totalYen: number;
  method: DeliveryMethod;
  earliestDelivery: string; // 届けられる最初の日（"2026-10-20"）
  latestDelivery: string; // 届けられる最後の日（使用日まで）
  acceptUntil: Date;
  answerUntil: Date;
  totalListedG: number; // 出品総量
  confirmedG: number; // 販売確定の量
  reservedG: number; // 返事待ちの量（仮押さえ）
  requestCount: number; // 返事待ちの件数
};

export type SearchResult = { repeat: Candidate[]; matched: Candidate[]; newcomers: Candidate[] };

// 1つの枠の中で、同じ農家さんの出品は2件まで
const PER_PRODUCER_LIMIT = 2;

export async function searchListings(input: SearchInput): Promise<SearchResult> {
  const buyerPlace = findMunicipality(input.buyerPrefecture, input.buyerCity);
  if (!buyerPlace) return { repeat: [], matched: [], newcomers: [] };

  // 回答期限を過ぎた返事待ちは、先に期限切れにして、仮押さえを解除しておく
  await expireOverdue(prisma);

  const now = new Date();
  const methodColumn = { delivery: "offersDelivery", self: "offersSelf", pickup: "offersPickup" } as const;
  const listings = await prisma.listing.findMany({
    where: {
      status: "open",
      acceptUntil: { gt: now },
      vegetable: { contains: input.vegetable, mode: "insensitive" },
      [methodColumn[input.method]]: true,
      deliverFrom: { lte: input.useDate },
    },
    include: { producer: { select: { id: true, name: true, profile: true } } },
  });

  const used = await usedAmounts(prisma, listings.map((l) => l.id));
  const today = parseDate(jstDateText(now))!;

  const candidates: (Candidate & { producerId: string })[] = [];
  for (const l of listings) {
    const profile = l.producer.profile;
    if (!profile) continue;
    // 地域：畑とお店が 70km 以内か
    const farm = findMunicipality(profile.prefecture, profile.city);
    if (!farm || !isNear(farm, buyerPlace)) continue;
    // 量：最低注文量以上・注文単位の倍数・残りの量が足りる（不変条件1）
    const u = used.get(l.id)!;
    const availableG = l.totalG - u.confirmedG - u.reservedG;
    if (input.quantityG < l.minOrderG || input.quantityG % l.unitG !== 0 || input.quantityG > availableG) continue;
    // 日付：今日以降で、納品できる日の中に、使用日までに届く日があるか
    const earliest = l.deliverFrom > today ? l.deliverFrom : today;
    const latest = l.deliverTo < input.useDate ? l.deliverTo : input.useDate;
    if (earliest > latest) continue;
    // 金額：送料込みで予算以内か（金額はアプリが計算する）
    const q = quote(l, profile, input.quantityG, input.method);
    if ("error" in q || q.totalYen > input.budgetYen) continue;

    candidates.push({
      producerId: l.producerId,
      listingId: l.id,
      vegetable: l.vegetable,
      producerName: l.producer.name,
      producerArea: `${profile.prefecture} ${profile.city}`,
      items: profile.items,
      commitment: profile.commitment,
      quality: l.quality,
      surplus: l.surplus,
      note: l.note,
      unitG: l.unitG,
      unitPriceYen: l.unitPriceYen,
      quantityG: input.quantityG,
      ...q,
      method: input.method,
      earliestDelivery: earliest.toISOString().slice(0, 10),
      latestDelivery: latest.toISOString().slice(0, 10),
      acceptUntil: l.acceptUntil,
      answerUntil: l.answerUntil,
      totalListedG: l.totalG,
      confirmedG: u.confirmedG,
      reservedG: u.reservedG,
      requestCount: u.requestCount,
    });
  }

  const producerIds = [...new Set(candidates.map((c) => c.producerId))];
  // 前に買った農家さん：このお店と販売確定したことがある
  const repeatRows = await prisma.order.findMany({
    where: { buyerId: input.buyerId, status: "confirmed", listing: { producerId: { in: producerIds } } },
    select: { listing: { select: { producerId: true } } },
  });
  const repeatIds = new Set(repeatRows.map((r) => r.listing.producerId));
  // 新しい農家さん：まだ1回も販売確定していない
  const soldRows = await prisma.order.findMany({
    where: { status: "confirmed", listing: { producerId: { in: producerIds } } },
    select: { listing: { select: { producerId: true } } },
  });
  const soldIds = new Set(soldRows.map((r) => r.listing.producerId));
  // 表示された回数
  const exposures = await prisma.producerExposure.findMany({ where: { producerId: { in: producerIds } } });
  const countOf = new Map(exposures.map((e) => [e.producerId, e.count]));

  // 表示回数が少ない順に並べ、同じ農家さんは2件までにする
  function arrange(list: typeof candidates) {
    const sorted = [...list].sort((a, b) => (countOf.get(a.producerId) ?? 0) - (countOf.get(b.producerId) ?? 0));
    const perProducer = new Map<string, number>();
    return sorted.filter((c) => {
      const n = perProducer.get(c.producerId) ?? 0;
      perProducer.set(c.producerId, n + 1);
      return n < PER_PRODUCER_LIMIT;
    });
  }
  const repeat = arrange(candidates.filter((c) => repeatIds.has(c.producerId)));
  const newcomers = arrange(candidates.filter((c) => !repeatIds.has(c.producerId) && !soldIds.has(c.producerId)));
  const matched = arrange(candidates.filter((c) => !repeatIds.has(c.producerId) && soldIds.has(c.producerId)));

  // 表示した農家さんの「表示された回数」を1つ増やす
  const shown = [...new Set([...repeat, ...matched, ...newcomers].map((c) => c.producerId))];
  await Promise.all(
    shown.map((producerId) =>
      prisma.producerExposure.upsert({
        where: { producerId },
        create: { producerId, count: 1 },
        update: { count: { increment: 1 } },
      }),
    ),
  );

  // 画面に渡すときは、農家さんの ID は外す（必要なものだけ渡す）
  const strip = (list: typeof candidates): Candidate[] =>
    list.map((c) => {
      const copy: Partial<typeof c> = { ...c };
      delete copy.producerId;
      return copy as Candidate;
    });
  return { repeat: strip(repeat), matched: strip(matched), newcomers: strip(newcomers) };
}
