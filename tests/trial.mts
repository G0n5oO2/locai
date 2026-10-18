// お試し食材のテスト（第2版 4-3・4-4「お試し」）
// 実行：npm run test:trial
// テスト専用のお試し食材を作り、終わったら消す

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { searchListings } from "../lib/search";
import { trialItemsFor } from "../lib/trial-items";
import { trialSchedule } from "../lib/trial";
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
const shop = await prisma.buyerProfile.findUniqueOrThrow({ where: { userId: buyer } });
const exposureBefore = await prisma.producerExposure.findUnique({ where: { producerId: producer } });
const todayText = jstDateText(new Date());
const today = parseDate(todayText)!;
const suffix = randomUUID().slice(0, 6);
const lastDay = new Date(today.getTime() + 10 * day).toISOString().slice(0, 10);

// お試し食材を作る（登録の画面と同じ決め方で期限を入れる。返事は2日以内）
const makeItem = (vegetable: string) =>
  prisma.listing.create({
    data: {
      producerId: producer, isTrial: true, trialAnswerDays: 2, vegetable, note: "テスト", totalG: 1000, unitG: 100, minOrderG: 100, unitPriceYen: 80,
      quality: "normal", surplus: false, ...trialSchedule(lastDay, 2, todayText)!, offersDelivery: true, offersSelf: false, offersPickup: false,
    },
  });
const nasu = await makeItem(`テストお試しなす${suffix}`);
const kabu = await makeItem(`テストお試しかぶ${suffix}`);
const order = (listingId: string, quantityG: number, inDays: number) =>
  placeOrder({ buyerId: buyer, listingId, quantityG, method: "delivery", deliveryDate: new Date(today.getTime() + inDays * day), useDate: new Date(today.getTime() + inDays * day), showUseDate: false, requestKey: randomUUID() });
const visible = async () => (await trialItemsFor(buyer, shop.prefecture, shop.city)).map((x) => x.item.id);

try {
  check("まだ買ったことがない野菜は、お試しの一覧に出る", (await visible()).includes(nasu.id));
  const search = await searchListings({ buyerId: buyer, buyerPrefecture: shop.prefecture, buyerCity: shop.city, vegetable: `テストお試し`, quantityG: 1000, budgetYen: 100000, useDate: new Date(today.getTime() + 9 * day), method: "delivery" });
  check("お試し食材は、ふつうの仕入れ候補には出ない", search.random.length === 0);

  const r1 = await order(nasu.id, 150, 3);
  check("100g 単位でない量は申し込めない", !r1.ok, r1.ok ? "" : r1.message);
  const r2 = await order(nasu.id, 300, 1);
  check("返事の日数より前の日には届けてもらえない", !r2.ok, r2.ok ? "" : r2.message);

  const before = Date.now();
  const r3 = await order(nasu.id, 300, 3);
  check("お試しを申し込める", r3.ok, r3.ok ? "" : r3.message);
  if (r3.ok) {
    const o = await prisma.order.findUniqueOrThrow({ where: { id: r3.orderId } });
    const hours = (o.answerUntil.getTime() - before) / 3_600_000;
    check("お試しの印が付き、金額は 100g あたり 80円 × 3 ＝ 240円", o.isTrial && o.itemYen === 240);
    check("回答期限は、申し込みから2日", hours > 47.9 && hours < 48.1, `${hours.toFixed(2)}時間`);
  }
  const r4 = await order(nasu.id, 100, 3);
  check("同じ野菜の返事待ちのお試しがあるあいだは、もう1つ送れない", !r4.ok, r4.ok ? "" : r4.message);
  check("返事待ちのあいだは、その野菜はお試しの一覧に出ない", !(await visible()).includes(nasu.id));
  check("同じ農家さんでも、ちがう野菜はお試しできる", (await visible()).includes(kabu.id));

  // なすが販売確定したら、もうなすはお試しできない（買ったことがある）
  if (r3.ok) await prisma.order.update({ where: { id: r3.orderId }, data: { status: "confirmed" } });
  const r5 = await order(nasu.id, 100, 3);
  check("買ったことがある野菜は、お試しできない", !r5.ok, r5.ok ? "" : r5.message);
  const r6 = await order(kabu.id, 100, 3);
  check("ちがう野菜（かぶ）は、お試しできる", r6.ok, r6.ok ? "" : r6.message);
} finally {
  await prisma.listing.deleteMany({ where: { id: { in: [nasu.id, kabu.id] } } });
  if (exposureBefore) await prisma.producerExposure.update({ where: { producerId: producer }, data: { count: exposureBefore.count } });
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
