// 残りの量の計算（不変条件1：売りすぎない）
// 販売確定の量と、返事待ちの仮押さえの量を足して、出品した量から引く
import "server-only";
import type { Prisma } from "./generated/prisma/client";

type Db = Prisma.TransactionClient;

// 返事待ちのうち、回答期限を過ぎたものは仮押さえを解除する（期限切れにする）
export async function expireOverdue(db: Db, listingIds?: string[]) {
  await db.order.updateMany({
    where: {
      status: { in: ["pending", "change_pending"] },
      answerUntil: { lt: new Date() },
      ...(listingIds ? { listingId: { in: listingIds } } : {}),
    },
    data: { status: "expired" },
  });
}

// 出品ごとの「販売確定の量」と「仮押さえの量」
export async function usedAmounts(db: Db, listingIds: string[]) {
  const orders = await db.order.findMany({
    where: { listingId: { in: listingIds }, status: { in: ["pending", "change_pending", "confirmed"] } },
    select: { listingId: true, status: true, quantityG: true, proposedQuantityG: true },
  });
  const result = new Map<string, { confirmedG: number; reservedG: number; requestCount: number }>();
  for (const id of listingIds) result.set(id, { confirmedG: 0, reservedG: 0, requestCount: 0 });
  for (const o of orders) {
    const r = result.get(o.listingId)!;
    if (o.status === "confirmed") r.confirmedG += o.quantityG;
    else {
      // 条件変更の確認待ちは、元の量と変更後の量の大きいほうを押さえておく（どちらに決まっても売りすぎないように）
      r.reservedG += Math.max(o.quantityG, o.proposedQuantityG ?? 0);
      r.requestCount += 1;
    }
  }
  return result;
}
