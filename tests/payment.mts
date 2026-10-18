// 支払方法のテスト（第2版）
// 実行：npm run test:payment
// テスト専用の出品を作り、農家さんの設定を一時的に変える。終わったら元に戻して消す

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import type { PaymentMethodKey } from "../lib/payment";
import { jstDateText, parseDate } from "../lib/datetime";

const day = 24 * 60 * 60 * 1000;
const id = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

const producer = await id("producer2@example.com");
const buyer = await id("buyer1@example.com");
const original = await prisma.producerProfile.findUniqueOrThrow({ where: { userId: producer }, select: { paymentMethods: true, pickupPlace: true } });
const today = parseDate(jstDateText(new Date()))!;
const listing = await prisma.listing.create({
  data: {
    producerId: producer, vegetable: "テスト用の野菜（自動で消えます）", totalG: 10000, unitG: 1000, minOrderG: 1000, unitPriceYen: 100,
    quality: "normal", surplus: false, acceptUntil: new Date(Date.now() + day), answerUntil: new Date(Date.now() + 2 * day),
    deliverFrom: new Date(today.getTime() + 3 * day), deliverTo: new Date(today.getTime() + 10 * day),
    offersDelivery: true, offersSelf: false, offersPickup: true,
  },
});
// 農家さんの設定を変える（引き取りの場所は、引き取りで申し込めるようにするため）
const setPayments = (paymentMethods: PaymentMethodKey[]) =>
  prisma.producerProfile.update({ where: { userId: producer }, data: { paymentMethods, pickupPlace: original.pickupPlace ?? "テスト用の場所" } });
const order = (method: "delivery" | "pickup", paymentMethod: PaymentMethodKey | null) =>
  placeOrder({ buyerId: buyer, listingId: listing.id, quantityG: 1000, method, deliveryDate: listing.deliverFrom, useDate: listing.deliverFrom, showUseDate: false, requestKey: randomUUID(), paymentMethod });
const saved = async (r: Awaited<ReturnType<typeof order>>) => (r.ok ? (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).paymentMethod : "失敗");

try {
  // 農家さんがまだ設定していない：選ばずに申し込める（メッセージで相談）
  await setPayments([]);
  const r1 = await order("delivery", null);
  check("設定していない農家さんには、選ばずに申し込める", r1.ok && (await saved(r1)) === null);
  const r2 = await order("delivery", "cash");
  check("設定していない農家さんに送られた支払方法は、保存しない", r2.ok && (await saved(r2)) === null);

  // 農家さんが「現金・代金引換」を受け付ける
  await setPayments(["cash", "cod"]);
  const r3 = await order("delivery", null);
  check("設定している農家さんには、選ばないと申し込めない", !r3.ok, r3.ok ? "" : r3.message);
  const r4 = await order("delivery", "transfer");
  check("受け付けていない支払方法では申し込めない", !r4.ok, r4.ok ? "" : r4.message);
  const r5 = await order("pickup", "cod");
  check("代金引換は、引き取りでは選べない", !r5.ok, r5.ok ? "" : r5.message);
  const r6 = await order("delivery", "cod");
  check("代金引換は、宅配なら選べて保存される", r6.ok && (await saved(r6)) === "cod");
  const r7 = await order("pickup", "cash");
  check("現金は、引き取りで選べて保存される", r7.ok && (await saved(r7)) === "cash");
} finally {
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.producerProfile.update({ where: { userId: producer }, data: original });
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
