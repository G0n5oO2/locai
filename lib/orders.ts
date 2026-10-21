// 購入希望を受け付ける処理（不変条件1：売りすぎない）
// 「出品に鍵をかける → 残りを調べる → 保存する」を1つのトランザクションで行う
import "server-only";
import { Prisma } from "./generated/prisma/client";
import { expireOverdue, usedAmounts } from "./availability";
import type { DeliveryMethod } from "./burden";
import { jstDateText, parseDate } from "./datetime";
import { paymentFits, type PaymentMethodKey } from "./payment";
import { prisma } from "./prisma";
import { quote } from "./pricing";
import { gramsToKgText } from "./quantity";
import { farmShopKm } from "./region";
import { trialAnswerUntil } from "./trial";

export type PlaceOrderInput = {
  buyerId: string;
  listingId: string;
  quantityG: number;
  method: DeliveryMethod;
  deliveryDate: Date;
  useDate: Date;
  showUseDate: boolean;
  requestKey: string;
  // お店が選んだ支払方法（農家さんが設定していないときは null。第2版）
  paymentMethod?: PaymentMethodKey | null;
};

// お試し食材を申し込めるか（第2版）：この農家さんから、この野菜を買ったこと（販売確定）がなく、
// 同じ野菜の返事待ちのお試しもない。一度でも買ったことがあれば、その農家さんの野菜の状態は分かっているため
export async function canTrialItem(db: Pick<typeof prisma, "order">, buyerId: string, producerId: string, vegetable: string): Promise<boolean> {
  const blocking = await db.order.count({
    where: {
      buyerId,
      listing: { producerId, vegetable },
      OR: [{ status: "confirmed" }, { isTrial: true, status: { in: ["pending", "change_pending"] } }],
    },
  });
  return blocking === 0;
}

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
      // 畑からお店までの距離（市区町村の代表地点どうし）。70km 以内に絞る決まりは外した（第2版）。送料と、自分で配達できるかに使う
      const km = farmShopKm(profile, buyer);
      if (km === null) return fail("お店か畑の地域が見つかりません");
      const offered = { delivery: listing.offersDelivery, self: listing.offersSelf, pickup: listing.offersPickup }[input.method];
      if (!offered) return fail("この受け取り方法には対応していません");
      // 支払方法：農家さんが受け付ける方法の中から選んでいるか。代金引換は宅配のときだけ（第2版）
      // 農家さんがまだ設定していないときは、選ばずに申し込める（メッセージで相談）
      let paymentMethod: PaymentMethodKey | null = null;
      if (profile.paymentMethods.length > 0) {
        if (!input.paymentMethod || !profile.paymentMethods.includes(input.paymentMethod)) return fail("支払方法を、農家さんが受け付ける方法の中から選んでください");
        if (!paymentFits(input.paymentMethod, input.method)) return fail("代金引換は、宅配のときだけ選べます");
        paymentMethod = input.paymentMethod;
      }
      // お試し食材（第2版）：まだ買ったことがない野菜だけ。量は 100g ずつ
      if (listing.isTrial) {
        // 同じ野菜のお試しと同時にならないよう、農家さんにも鍵をかける
        await tx.$queryRaw`SELECT id FROM "user" WHERE id = ${listing.producerId} FOR UPDATE`;
        if (!(await canTrialItem(tx, input.buyerId, listing.producerId, listing.vegetable))) return fail("この野菜は、お試しで申し込めません（買ったことがあるか、返事待ちのお試しがあります）");
        if (input.quantityG < listing.minOrderG) return fail(`${listing.minOrderG}g から申し込めます`);
        if (input.quantityG % listing.unitG !== 0) return fail(`${listing.unitG}g 単位で申し込んでください`);
      } else if (input.quantityG < listing.minOrderG) return fail(`最低注文量は ${gramsToKgText(listing.minOrderG)}kg です`);
      if (input.quantityG % listing.unitG !== 0) return fail(`${gramsToKgText(listing.unitG)}kg 単位で申し込んでください`);
      if (input.useDate < today) return fail("使用日は、今日以降にしてください");
      // お試し食材は、返事の日数がたってから届ける（返事を待たずに届けることにならないように）
      const answerReady = listing.isTrial && listing.trialAnswerDays ? new Date(today.getTime() + listing.trialAnswerDays * 86_400_000) : today;
      const earliestBase = listing.deliverFrom > today ? listing.deliverFrom : today;
      const earliest = answerReady > earliestBase ? answerReady : earliestBase;
      if (input.deliveryDate < earliest || input.deliveryDate > listing.deliverTo) return fail("納品日は、届けられる日の中から選んでください");
      if (input.deliveryDate > input.useDate) return fail("納品日は、使用日までの日にしてください");

      // 3. 残りの量を調べる（回答期限を過ぎた返事待ちは、先に期限切れにして解除する）
      await expireOverdue(tx, [listing.id]);
      const used = (await usedAmounts(tx, [listing.id])).get(listing.id)!;
      const availableG = listing.totalG - used.confirmedG - used.reservedG;
      if (input.quantityG > availableG) return fail(`残りが足りません（いま申し込めるのは ${gramsToKgText(Math.max(availableG, 0))}kg までです）`);

      // 4. 金額はアプリが計算する（画面から送られた金額は使わない）
      const q = quote(listing, profile, input.quantityG, input.method, km);
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
          // 送料が要相談か（距離の料金の表より遠いお店の宅配。農家さんが送料を入れて、お店がもう一度同意する）
          shippingToBeDecided: q.shippingToBeDecided,
          // 回答期限：ふつうは出品の回答期限。お試し食材は、申し込みから○日（第2版）
          answerUntil: listing.isTrial && listing.trialAnswerDays ? trialAnswerUntil(now, listing.trialAnswerDays, listing.answerUntil) : listing.answerUntil,
          requestKey: input.requestKey,
          isTrial: listing.isTrial, // お試し食材への申し込みなら、お試しの印を付ける
          paymentMethod,
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
