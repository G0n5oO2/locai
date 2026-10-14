// 注文の状態の変え方（不変条件3：決めた流れ以外は起こさない）
// docs/04_producer_design.md 4章の状態遷移の表を、そのままプログラムの表にしたもの
// 表にない動きは、ここで必ず断る
import "server-only";
import type { Order, OrderStatus } from "./generated/prisma/client";
import { expireOverdue, usedAmounts } from "./availability";
import { prisma } from "./prisma";

// 操作 → 誰が・どの状態のときにできるか
const flow = {
  approve: { actor: "producer", from: ["pending"] }, // 承認 → 販売確定
  decline: { actor: "producer", from: ["pending", "change_pending"] }, // 見送り
  propose: { actor: "producer", from: ["pending"] }, // 条件変更の提案 → 条件変更の確認待ち
  accept: { actor: "buyer", from: ["change_pending"] }, // 提案に同意 → 販売確定
  refuse: { actor: "buyer", from: ["change_pending"] }, // 提案を断る → 販売確定（元の条件）または見送り
  cancel: { actor: "buyer", from: ["pending", "change_pending"] }, // 取消
} as const satisfies Record<string, { actor: "producer" | "buyer"; from: OrderStatus[] }>;

export type FlowAction = keyof typeof flow;
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
export type FlowResult = { ok: true } | { ok: false; message: string };

// 注文の状態を変える共通の手順
// 1. 出品に鍵をかける 2. 本人か確かめる 3. 期限切れを反映 4. 表にある動きか確かめる 5. 変える
export async function runFlow(
  action: FlowAction,
  userId: string,
  orderId: string,
  change: (tx: Tx, order: Order) => Promise<FlowResult>,
): Promise<FlowResult> {
  const rule = flow[action];
  return prisma.$transaction(
    async (tx) => {
      const found = await tx.order.findUnique({ where: { id: orderId }, select: { listingId: true } });
      if (!found) return { ok: false, message: "注文が見つかりません" };
      // 1. 出品に鍵をかける（同じ出品への承認や申し込みは、終わるまで待つ）
      await tx.$queryRaw`SELECT id FROM listing WHERE id = ${found.listingId} FOR UPDATE`;

      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { listing: { select: { producerId: true } } } });
      // 2. 本人か（他人の注文は、ないものとして扱う：不変条件4）
      const ownerId = rule.actor === "producer" ? order.listing.producerId : order.buyerId;
      if (ownerId !== userId) return { ok: false, message: "注文が見つかりません" };

      // 3. 回答期限を過ぎていたら、先に期限切れにする
      await expireOverdue(tx, [order.listingId]);
      const current = await tx.order.findUniqueOrThrow({ where: { id: orderId } });

      // 4. 表にある動きか
      if (!(rule.from as readonly OrderStatus[]).includes(current.status)) {
        return { ok: false, message: "この注文の今の状態では、その操作はできません（期限切れや取消になっていないか確かめてください）" };
      }

      // 5. 変える（中身は操作ごと）。同じトランザクション（tx）を渡す
      return change(tx, current);
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
}

// 承認：販売確定の量を足しても、出品した量を超えないか確かめてから、販売確定にする（不変条件1）
export function approveOrder(producerId: string, orderId: string) {
  return runFlow("approve", producerId, orderId, async (tx, order) => {
    const listing = await tx.listing.findUniqueOrThrow({ where: { id: order.listingId } });
    const used = (await usedAmounts(tx, [order.listingId])).get(order.listingId)!;
    if (used.confirmedG + order.quantityG > listing.totalG) return { ok: false, message: "在庫が足りないため、承認できません" };
    await tx.order.update({ where: { id: order.id }, data: { status: "confirmed" } });
    return { ok: true };
  });
}

// 見送り
export function declineOrder(producerId: string, orderId: string) {
  return runFlow("decline", producerId, orderId, async (tx, order) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "declined" } });
    return { ok: true };
  });
}
