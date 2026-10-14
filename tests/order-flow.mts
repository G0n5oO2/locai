// 注文の状態の変え方のテスト（不変条件3・4）
// 実行：npm run test:flow
// テスト専用の出品を作り、終わったら消す

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { approveOrder, declineOrder } from "../lib/order-flow";
import { jstDateText, parseDate } from "../lib/datetime";

const day = 24 * 60 * 60 * 1000;
const id = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;

let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

const producer = await id("producer2@example.com");
const otherProducer = await id("producer3@example.com");
const buyer = await id("buyer1@example.com");
const today = parseDate(jstDateText(new Date()))!;
const listing = await prisma.listing.create({
  data: {
    producerId: producer, vegetable: "テスト用の野菜（自動で消えます）", totalG: 10000, unitG: 1000, minOrderG: 1000, unitPriceYen: 100,
    quality: "normal", surplus: false, acceptUntil: new Date(Date.now() + day), answerUntil: new Date(Date.now() + 2 * day),
    deliverFrom: new Date(today.getTime() + 3 * day), deliverTo: new Date(today.getTime() + 10 * day),
    offersDelivery: true, offersSelf: false, offersPickup: false,
  },
});
const newOrder = async () => {
  const r = await placeOrder({ buyerId: buyer, listingId: listing.id, quantityG: 1000, method: "delivery", deliveryDate: listing.deliverFrom, useDate: listing.deliverFrom, showUseDate: false, requestKey: randomUUID() });
  if (!r.ok) throw new Error(r.message);
  return r.orderId;
};
const statusOf = async (orderId: string) => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;

try {
  const o1 = await newOrder();
  const r1 = await approveOrder(otherProducer, o1);
  check("別の農家さんは承認できない", !r1.ok && (await statusOf(o1)) === "pending", r1.ok ? "" : r1.message);

  const r2 = await approveOrder(producer, o1);
  check("本人は承認できる → 販売確定", r2.ok && (await statusOf(o1)) === "confirmed");

  const r3 = await declineOrder(producer, o1);
  check("販売確定のあとに見送りはできない", !r3.ok && (await statusOf(o1)) === "confirmed", r3.ok ? "" : r3.message);

  const o2 = await newOrder();
  // 回答期限を過去にずらして、期限切れの場面を作る
  await prisma.order.update({ where: { id: o2 }, data: { answerUntil: new Date(Date.now() - 1000) } });
  const r4 = await approveOrder(producer, o2);
  check("回答期限を過ぎた注文は承認できず、期限切れになる", !r4.ok && (await statusOf(o2)) === "expired", r4.ok ? "" : r4.message);

  const o3 = await newOrder();
  const r5 = await declineOrder(producer, o3);
  check("見送り → 見送り", r5.ok && (await statusOf(o3)) === "declined");
} finally {
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
