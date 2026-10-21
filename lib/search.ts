// 出品を探す（飲食店の条件に、すべて合う出品だけを出す）
// 並び順：4つの並べ方（ランダム・安い順・納品日が早い順・お試しを利用した農家さん）を、アプリが決める（第2版 4-4、不変条件5・6）
// どの並べ方でも、同じ農家さんの出品が続けて並ばないようにする
import "server-only";
import type { DeliveryMethod } from "./burden";
import { expireOverdue, usedAmounts } from "./availability";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { quote } from "./pricing";
import { farmShopKm, findMunicipality } from "./region";

export type SearchInput = {
  buyerId: string;
  buyerPrefecture: string;
  buyerCity: string;
  vegetable: string;
  // 希望数量・予算・使用日は任意（第2版）。null なら、その条件では絞らない
  quantityG: number | null;
  budgetYen: number | null;
  useDate: Date | null;
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
  perKgYen: number; // 1kg あたりの値段（比べるための目安。四捨五入）
  // 希望数量を入れたときだけ、量と金額を出す（入れていなければ null）
  quantityG: number | null;
  itemYen: number | null;
  shippingYen: number | null;
  totalYen: number | null;
  shippingToBeDecided: boolean; // 送料が要相談（距離の料金の表より遠い宅配）。このときの合計は商品代だけ
  distanceKm: number; // 畑からお店までの、だいたいの距離（市区町村の代表地点どうし）
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

// 4つの並べ方。中身はどれも「条件に合う出品」で、並び順だけが違う（お試しは、その中の一部）
export type SearchResult = { random: Candidate[]; cheap: Candidate[]; early: Candidate[]; trial: Candidate[] };
export type SortKey = keyof SearchResult;

const emptyResult: SearchResult = { random: [], cheap: [], early: [], trial: [] };

// 並べ替えたい順のまま、同じ農家さんが続かないように並べ直す
// 前と違う農家さんのうち、一番前にあるものを順に取り出す。どうしても続いてしまうとき（残りが1人の農家さんだけ）は、そのまま後ろに並べる
export function noRepeatInRow<T extends { producerId: string }>(list: T[]): T[] {
  const rest = [...list];
  const result: T[] = [];
  while (rest.length > 0) {
    const last = result.at(-1)?.producerId;
    const i = rest.findIndex((c) => c.producerId !== last);
    result.push(rest.splice(i === -1 ? 0 : i, 1)[0]);
  }
  return result;
}

// ばらばらに並べる（同じ値どうしの順番も、毎回くじ引きで決める）
export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function searchListings(input: SearchInput): Promise<SearchResult> {
  const buyerPlace = findMunicipality(input.buyerPrefecture, input.buyerCity);
  if (!buyerPlace) return emptyResult;

  // 回答期限を過ぎた返事待ちは、先に期限切れにして、仮押さえを解除しておく
  await expireOverdue(prisma);

  const now = new Date();
  const methodColumn = { delivery: "offersDelivery", self: "offersSelf", pickup: "offersPickup" } as const;
  const listings = await prisma.listing.findMany({
    where: {
      status: "open",
      isTrial: false, // お試し食材は、お試しのタブにだけ出す
      acceptUntil: { gt: now },
      vegetable: { contains: input.vegetable, mode: "insensitive" },
      [methodColumn[input.method]]: true,
      ...(input.useDate ? { deliverFrom: { lte: input.useDate } } : {}),
    },
    include: { producer: { select: { id: true, name: true, profile: true } } },
  });

  const used = await usedAmounts(prisma, listings.map((l) => l.id));
  const today = parseDate(jstDateText(now))!;

  const candidates: (Candidate & { producerId: string })[] = [];
  for (const l of listings) {
    const profile = l.producer.profile;
    if (!profile) continue;
    // 距離：畑からお店まで（第2版：70km 以内に絞る決まりは外した。距離は送料と、自分で配達できるかに使う）
    const km = farmShopKm(profile, buyerPlace);
    if (km === null) continue;
    // 量：最低注文量以上・注文単位の倍数・残りの量が足りる（不変条件1）
    const u = used.get(l.id)!;
    const availableG = l.totalG - u.confirmedG - u.reservedG;
    // 希望数量がないときは、最低注文量の分が残っているか
    const wantG = input.quantityG ?? l.minOrderG;
    if (wantG < l.minOrderG || wantG % l.unitG !== 0 || wantG > availableG) continue;
    // 日付：今日以降で、納品できる日の中に、使用日までに届く日があるか（使用日がなければ、納品できる最後の日まで）
    const earliest = l.deliverFrom > today ? l.deliverFrom : today;
    const latest = input.useDate && input.useDate < l.deliverTo ? input.useDate : l.deliverTo;
    if (earliest > latest) continue;
    // 金額：送料込みで予算以内か（金額はアプリが計算する）。予算がなければ比べない
    // 受け取り方法で届けられるか（自分で配達の距離・宅配の重さ）は、希望数量（なければ最低注文量）で確かめる
    // 送料が要相談のときは、商品代だけで予算と比べる（送料は、あとで農家さんが決める）
    const q = quote(l, profile, wantG, input.method, km);
    if ("error" in q || (input.budgetYen !== null && q.totalYen > input.budgetYen)) continue;
    // 希望数量がないときは、金額を出さない（1kg あたりの値段だけを出す）
    const amounts = input.quantityG === null ? { itemYen: null, shippingYen: null, totalYen: null, shippingToBeDecided: false } : q;

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
      perKgYen: Math.round((l.unitPriceYen * 1000) / l.unitG),
      quantityG: input.quantityG,
      ...amounts,
      distanceKm: km,
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
  // お試しを利用した農家さん：このお店が、お試しで買ったことがある（お試しが販売確定した）
  const trialRows = await prisma.order.findMany({
    where: { buyerId: input.buyerId, isTrial: true, status: "confirmed", listing: { producerId: { in: producerIds } } },
    select: { listing: { select: { producerId: true } } },
  });
  const trialIds = new Set(trialRows.map((r) => r.listing.producerId));

  // 先にばらばらにしておくと、金額や日付が同じ出品どうしの順番もくじ引きになる（いつも同じ農家さんが上に来ない）
  const base = shuffle(candidates);
  const random = noRepeatInRow(base);
  // 安い順：希望数量があれば送料込みの合計、なければ 1kg あたりの値段で並べる
  const cheap = noRepeatInRow([...base].sort((a, b) => (a.totalYen ?? a.perKgYen) - (b.totalYen ?? b.perKgYen)));
  const early = noRepeatInRow([...base].sort((a, b) => a.earliestDelivery.localeCompare(b.earliestDelivery)));
  const trial = noRepeatInRow(base.filter((c) => trialIds.has(c.producerId)));

  // 表示した農家さんの「表示された回数」を1つ増やす（露出の偏りを確かめるための記録。不変条件6）
  await Promise.all(
    producerIds.map((producerId) =>
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
  return { random: strip(random), cheap: strip(cheap), early: strip(early), trial: strip(trial) };
}
