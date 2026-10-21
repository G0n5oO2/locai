// 注文の状態の変え方（不変条件3：決めた流れ以外は起こさない）
// docs/04_producer_design.md 4章の状態遷移の表を、そのままプログラムの表にしたもの
// 表にない動きは、ここで必ず断る
import "server-only";
import type { Order, OrderStatus } from "./generated/prisma/client";
import { expireOverdue, usedAmounts } from "./availability";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { quote } from "./pricing";
import { gramsToKgText } from "./quantity";
import { farmShopKm } from "./region";

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
    // 送料が要相談の注文は、送料が決まらないまま販売確定にしない（不変条件2）。送料を入れて提案してもらう
    if (order.shippingToBeDecided) return { ok: false, message: "送料が要相談の注文です。送料を入れて、お店に提案してください" };
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

// ===== 条件変更の提案（docs/04_producer_design.md 2章） =====

export type ProposalInput = {
  newDeliveryDate: Date | null; // 納品日を変えないときは null
  newQuantityG: number | null; // 数量を変えないときは null
  confirmIfRefused: boolean; // 断られたら元の条件で確定するか（false なら見送り）
  shippingYen?: number | null; // 送料が要相談の注文で、農家さんが決めた送料（円の整数）。それ以外の注文では null
};

// 送料が要相談のときに、農家さんが入れられる送料の範囲（円）
export const MAX_DECIDED_SHIPPING_YEN = 100_000;

// 生産者が、納品日や数量の変更を提案する（回答待ち → 条件変更の確認待ち）
export function proposeChange(producerId: string, orderId: string, input: ProposalInput) {
  return runFlow("propose", producerId, orderId, async (tx, order) => {
    const listing = await tx.listing.findUniqueOrThrow({ where: { id: order.listingId }, include: { producer: { select: { profile: true } } } });
    const profile = listing.producer.profile;
    if (!profile) return { ok: false, message: "プロフィールが見つかりません" };

    const dateChanged = input.newDeliveryDate !== null && input.newDeliveryDate.getTime() !== order.deliveryDate.getTime();
    const quantityChanged = input.newQuantityG !== null && input.newQuantityG !== order.quantityG;
    // 送料が要相談の注文は、送料を決めることが提案になる（納品日・数量は変えなくてよい）
    if (order.shippingToBeDecided) {
      const y = input.shippingYen ?? null;
      if (y === null || !Number.isInteger(y) || y < 0 || y > MAX_DECIDED_SHIPPING_YEN) return { ok: false, message: `送料を 0〜${MAX_DECIDED_SHIPPING_YEN.toLocaleString()}円の整数で入れてください` };
    } else if (!dateChanged && !quantityChanged) return { ok: false, message: "納品日か数量のどちらかを変えてください" };

    const newDate = dateChanged ? input.newDeliveryDate! : order.deliveryDate;
    const newQuantityG = quantityChanged ? input.newQuantityG! : order.quantityG;

    if (dateChanged) {
      // 使用日を見せていないお店には、日付の提案はしない（設計メモ2章：候補から外すだけ）
      if (!order.showUseDate) return { ok: false, message: "このお店は使用日を見せていないので、納品日の変更は提案できません" };
      const today = parseDate(jstDateText(new Date()))!;
      const earliest = listing.deliverFrom > today ? listing.deliverFrom : today;
      if (newDate < earliest || newDate > listing.deliverTo) return { ok: false, message: "納品日は、届けられる日の中から選んでください" };
      // 使用日より後の日には、ずらさない
      if (newDate > order.useDate) return { ok: false, message: "お店の使用日より後の日には、ずらせません" };
    }

    if (quantityChanged) {
      if (newQuantityG <= 0 || newQuantityG % listing.unitG !== 0) return { ok: false, message: `数量は ${gramsToKgText(listing.unitG)}kg 単位にしてください` };
      // 変更後の量も、残りの量の中に収める（この注文がいま押さえている量は使ってよい）
      const used = (await usedAmounts(tx, [listing.id])).get(listing.id)!;
      const ownReserved = Math.max(order.quantityG, order.proposedQuantityG ?? 0);
      const availableG = listing.totalG - used.confirmedG - used.reservedG + ownReserved;
      if (newQuantityG > availableG) return { ok: false, message: `数量が残りの量を超えています（${gramsToKgText(availableG)}kg まで）` };
    }

    // 金額はアプリが計算し直す（不変条件2）
    const buyer = await tx.buyerProfile.findUnique({ where: { userId: order.buyerId } });
    const km = buyer && farmShopKm(profile, buyer);
    if (km === null || km === undefined) return { ok: false, message: "お店の地域が見つかりません" };
    const q = quote(listing, profile, newQuantityG, order.method, km);
    if ("error" in q) return { ok: false, message: q.error };
    // 送料が要相談の注文：送料は農家さんが決めた金額、合計はアプリが足し算する
    const shippingYen = order.shippingToBeDecided ? input.shippingYen! : q.shippingYen;
    if (!order.shippingToBeDecided && q.shippingToBeDecided) return { ok: false, message: "送料が決まらないため、提案できません" };

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "change_pending",
        proposedDeliveryDate: newDate,
        proposedQuantityG: newQuantityG,
        proposedItemYen: q.itemYen,
        proposedShippingYen: shippingYen,
        proposedTotalYen: q.itemYen + shippingYen,
        // 数量を変えるとき・送料が要相談のときは、断られたら見送りだけ（出せない量や、決まっていない送料を約束しないため）
        confirmIfRefused: quantityChanged || order.shippingToBeDecided ? false : input.confirmIfRefused,
        dateChangeProposed: dateChanged,
      },
    });
    return { ok: true };
  });
}

// 販売確定にしても、出品した量を超えないか（不変条件1）
async function fitsStock(tx: Tx, listingId: string, quantityG: number) {
  const listing = await tx.listing.findUniqueOrThrow({ where: { id: listingId } });
  const used = (await usedAmounts(tx, [listingId])).get(listingId)!;
  return used.confirmedG + quantityG <= listing.totalG;
}

// お店が提案に同意する（条件変更の確認待ち → 販売確定：変更後の条件）
export function acceptProposal(buyerId: string, orderId: string) {
  return runFlow("accept", buyerId, orderId, async (tx, order) => {
    if (order.proposedDeliveryDate === null || order.proposedQuantityG === null || order.proposedTotalYen === null) {
      return { ok: false, message: "提案の内容が見つかりません" };
    }
    if (!(await fitsStock(tx, order.listingId, order.proposedQuantityG))) return { ok: false, message: "在庫が足りないため、同意できません" };
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "confirmed",
        deliveryDate: order.proposedDeliveryDate,
        quantityG: order.proposedQuantityG,
        itemYen: order.proposedItemYen!,
        shippingYen: order.proposedShippingYen!,
        totalYen: order.proposedTotalYen,
        // 送料が決まった（要相談でなくなった）
        shippingToBeDecided: false,
      },
    });
    return { ok: true };
  });
}

// お店が提案を断る（→ 生産者が先に選んでいたとおり、元の条件で販売確定 または 見送り）
export function refuseProposal(buyerId: string, orderId: string) {
  return runFlow("refuse", buyerId, orderId, async (tx, order) => {
    if (order.confirmIfRefused) {
      if (!(await fitsStock(tx, order.listingId, order.quantityG))) return { ok: false, message: "在庫が足りないため、元の条件で確定できません" };
      await tx.order.update({ where: { id: order.id }, data: { status: "confirmed" } });
    } else {
      await tx.order.update({ where: { id: order.id }, data: { status: "declined" } });
    }
    return { ok: true };
  });
}

// お店が取り消す（回答待ち／条件変更の確認待ち → 取消）
export function cancelOrder(buyerId: string, orderId: string) {
  return runFlow("cancel", buyerId, orderId, async (tx, order) => {
    await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
    return { ok: true };
  });
}

// お店ごとの「納品日をずらす提案をされた回数」
export async function dateShiftCounts(buyerIds: string[]) {
  const rows = await prisma.order.groupBy({ by: ["buyerId"], where: { buyerId: { in: buyerIds }, dateChangeProposed: true }, _count: { _all: true } });
  return new Map(rows.map((r) => [r.buyerId, r._count._all]));
}
