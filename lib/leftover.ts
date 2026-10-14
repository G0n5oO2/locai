// 売れ残りのときの操作（docs/04_producer_design.md 3章）
import "server-only";
import { jstDateText } from "./datetime";
import { prisma } from "./prisma";
import { matchingBuyerIds } from "./wanted";

type Result = { ok: true; message?: string } | { ok: false; message: string };
const day = 24 * 60 * 60 * 1000;

// 自分の出品だけを取り出す（他人の出品は「見つからない」）
async function ownListing(producerId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { producer: { select: { profile: true } } } });
  if (!listing || listing.producerId !== producerId) return null;
  return listing;
}

// 受付期限を延ばす：今（または今の受付期限）から days 日。回答期限は新しい受付期限の1日後
// すでに回答待ちの申し込みは、申し込んだときの回答期限を写して持っているので、変わらない
async function extend(listing: { id: string; acceptUntil: Date; deliverTo: Date }, days: number): Promise<Result> {
  if (![1, 2, 3].includes(days)) return { ok: false, message: "延ばす日数は、1〜3日から選んでください" };
  const base = Math.max(Date.now(), listing.acceptUntil.getTime());
  const acceptUntil = new Date(base + days * day);
  const answerUntil = new Date(acceptUntil.getTime() + day);
  // 新しい回答期限が、納品できる日（いつまで）を過ぎるなら延ばせない
  if (jstDateText(answerUntil) >= listing.deliverTo.toISOString().slice(0, 10)) {
    return { ok: false, message: "延ばすと、納品できる日を過ぎてしまうので延ばせません。条件を見直して再出品してください" };
  }
  await prisma.listing.update({ where: { id: listing.id }, data: { acceptUntil, answerUntil, status: "open" } });
  return { ok: true };
}

// 販売を継続する（受付期限を延ばす）
export async function continueSale(producerId: string, listingId: string, days: number): Promise<Result> {
  const listing = await ownListing(producerId, listingId);
  if (!listing) return { ok: false, message: "出品が見つかりません" };
  if (listing.status !== "open") return { ok: false, message: "受付を終了した出品は、延ばせません" };
  return extend(listing, days);
}

// 探しているお店に出品を知らせる（同じ出品・同じお店には1回だけ）
// 受付期限が過ぎていたら、days 日延ばしてから知らせる（お店が購入希望を送れるように）
export async function notifyWanted(producerId: string, listingId: string, days: number | null): Promise<Result> {
  const listing = await ownListing(producerId, listingId);
  if (!listing || !listing.producer.profile) return { ok: false, message: "出品が見つかりません" };
  if (listing.status !== "open") return { ok: false, message: "受付を終了した出品は、知らせられません" };

  if (listing.acceptUntil <= new Date()) {
    if (days === null) return { ok: false, message: "受付期限が過ぎているので、延ばす日数を選んでください" };
    const extended = await extend(listing, days);
    if (!extended.ok) return extended;
  }

  const buyerIds = await matchingBuyerIds(listing.producer.profile, listing.vegetable);
  // まだ知らせていないお店だけに知らせる（すでに知らせたお店は飛ばす）
  const created = await prisma.listingNotice.createMany({
    data: buyerIds.map((buyerId) => ({ listingId: listing.id, buyerId })),
    skipDuplicates: true,
  });
  return { ok: true, message: created.count === 0 ? "新しく知らせるお店はありませんでした" : `${created.count}件のお店に知らせました` };
}

// 受付を終了する
export async function closeListing(producerId: string, listingId: string): Promise<Result> {
  const listing = await ownListing(producerId, listingId);
  if (!listing) return { ok: false, message: "出品が見つかりません" };
  await prisma.listing.update({ where: { id: listing.id }, data: { status: "closed" } });
  return { ok: true };
}
