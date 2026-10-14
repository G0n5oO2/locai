// 購入希望を受け付ける処理（不変条件1：売りすぎない）
// 「出品に鍵をかける → 残りを調べる → 保存する」を1つのトランザクションで行う
import "server-only";
import { Prisma } from "./generated/prisma/client";
import { expireOverdue, usedAmounts } from "./availability";
import type { DeliveryMethod } from "./burden";
import { jstDateText, parseDate } from "./datetime";
import { prisma } from "./prisma";
import { quote } from "./pricing";
import { gramsToKgText } from "./quantity";
import { findMunicipality, isNear } from "./region";

export type PlaceOrderInput = {
  buyerId: string;
  listingId: string;
  quantityG: number;
  method: DeliveryMethod;
  deliveryDate: Date;
  useDate: Date;
  showUseDate: boolean;
  requestKey: string;
};

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; message: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // 同じ目印の申し込みがもうあれば、二重に作らない（送信ボタンの連打対策）
  const existing = await prisma.order.findUnique({ where: { requestKey: input.requestKey } });
  if (existing) {
    return existing.buyerId === input.buyerId ? { ok: true, orderId: existing.id } : { ok: false, message: "申し込みを受け付けられませんでした" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. 出品に鍵をかける。ほかの申し込みは、この処理が終わるまで待つ
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM listing WHERE id = ${input.listingId} FOR UPDATE`;
      if (locked.length === 0) return fail("出品が見つかりません");

      const listing = await tx.listing.findUniqueOrThrow({
        where: { id: input.listingId },
        include: { producer: { select: { profile: true } } },
      });
      const profile = listing.producer.profile;
      const buyer = await tx.buyerProfile.findUnique({ where: { userId: input.buyerId } });
      const now = new Date();
      const today = parseDate(jstDateText(now))!;

      // 2. 申し込める出品・条件かを確かめる
      if (listing.status !== "open" || listing.acceptUntil <= now) return fail("この出品は、受付が終わりました");
      if (!profile || !buyer) return fail("プロフィールが見つかりません");
      const farm = findMunicipality(profile.prefecture, profile.city);
      const shop = findMunicipality(buyer.prefecture, buyer.city);
      if (!farm || !shop || !isNear(farm, shop)) return fail("お店の地域が、この農家さんの対応地域の外です");
      const offered = { delivery: listing.offersDelivery, self: listing.offersSelf, pickup: listing.offersPickup }[input.method];
      if (!offered) return fail("この受け取り方法には対応していません");
      if (input.quantityG < listing.minOrderG) return fail(`最低注文量は ${gramsToKgText(listing.minOrderG)}kg です`);
      if (input.quantityG % listing.unitG !== 0) return fail(`${gramsToKgText(listing.unitG)}kg 単位で申し込んでください`);
      if (input.useDate < today) return fail("使用日は、今日以降にしてください");
      const earliest = listing.deliverFrom > today ? listing.deliverFrom : today;
      if (input.deliveryDate < earliest || input.deliveryDate > listing.deliverTo) return fail("納品日は、届けられる日の中から選んでください");
      if (input.deliveryDate > input.useDate) return fail("納品日は、使用日までの日にしてください");

      // 3. 残りの量を調べる（回答期限を過ぎた返事待ちは、先に期限切れにして解除する）
      await expireOverdue(tx, [listing.id]);
      const used = (await usedAmounts(tx, [listing.id])).get(listing.id)!;
      const availableG = listing.totalG - used.confirmedG - used.reservedG;
      if (input.quantityG > availableG) return fail(`残りが足りません（いま申し込めるのは ${gramsToKgText(Math.max(availableG, 0))}kg までです）`);

      // 4. 金額はアプリが計算する（画面から送られた金額は使わない）
      const q = quote(listing, profile, input.quantityG, input.method);
      if ("error" in q) return fail(q.error);

      // 5. 保存する。回答期限は出品の回答期限を写す
      const order = await tx.order.create({
        data: {
          listingId: listing.id,
          buyerId: input.buyerId,
          quantityG: input.quantityG,
          method: input.method,
          deliveryDate: input.deliveryDate,
          useDate: input.useDate,
          showUseDate: input.showUseDate,
          unitG: listing.unitG,
          unitPriceYen: listing.unitPriceYen,
          itemYen: q.itemYen,
          shippingYen: q.shippingYen,
          totalYen: q.totalYen,
          answerUntil: listing.answerUntil,
          requestKey: input.requestKey,
        },
      });
      return { ok: true as const, orderId: order.id };
    }, {
      // 鍵の順番待ちで時間がかかることがあるので、待てる時間を長めにする
      maxWait: 10_000, // 処理を始めるまでに待てる時間
      timeout: 15_000, // 処理全体にかけられる時間
    });
  } catch (error) {
    // ほぼ同時の連打で、同じ目印の申し込みが先に保存されていた場合
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const order = await prisma.order.findUnique({ where: { requestKey: input.requestKey } });
      if (order && order.buyerId === input.buyerId) return { ok: true, orderId: order.id };
    }
    throw error;
  }
}

function fail(message: string): PlaceOrderResult {
  return { ok: false, message };
}
