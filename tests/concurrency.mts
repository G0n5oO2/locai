// 同時に申し込まれても、売りすぎないかを確かめるテスト（不変条件1）
// 実行：npm run test:concurrency
// テスト専用の出品を作り、終わったら消す（ほかのデータには触らない）

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { jstDateText, parseDate } from "../lib/datetime";

const day = 24 * 60 * 60 * 1000;

async function userId(email: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  return u.id;
}

async function makeListing(producerId: string, totalG: number) {
  const today = parseDate(jstDateText(new Date()))!;
  return prisma.listing.create({
    data: {
      producerId,
      vegetable: "テスト用の野菜（自動で消えます）",
      totalG,
      unitG: 1000,
      minOrderG: 1000,
      unitPriceYen: 100,
      quality: "normal",
      surplus: false,
      acceptUntil: new Date(Date.now() + day),
      answerUntil: new Date(Date.now() + 2 * day),
      deliverFrom: new Date(today.getTime() + 3 * day),
      deliverTo: new Date(today.getTime() + 10 * day),
      offersDelivery: true,
      offersSelf: false,
      offersPickup: false,
    },
  });
}

function order(buyerId: string, listingId: string, quantityG: number, deliverFrom: Date) {
  return placeOrder({
    buyerId,
    listingId,
    quantityG,
    method: "delivery",
    deliveryDate: deliverFrom,
    useDate: new Date(deliverFrom.getTime() + day),
    showUseDate: true,
    requestKey: randomUUID(),
  });
}

let failed = false;
function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "OK" : "NG"}  ${name}：${detail}`);
  if (!ok) failed = true;
}

const producer = await userId("producer2@example.com");
const buyers = await Promise.all(["buyer1@example.com", "buyer2@example.com"].map(userId));
const created: string[] = [];

try {
  // テスト1：残り2kg に、2店が同時に2kg
  const a = await makeListing(producer, 2000);
  created.push(a.id);
  const r1 = await Promise.all(buyers.map((b) => order(b, a.id, 2000, a.deliverFrom)));
  const ok1 = r1.filter((r) => r.ok).length;
  check("残り2kg に同時に2kg × 2件", ok1 === 1, `通った ${ok1}件／断られた理由：${r1.filter((r) => !r.ok).map((r) => (r.ok ? "" : r.message)).join("、")}`);

  // テスト2：残り3kg に、同時に1kg × 5件
  const b = await makeListing(producer, 3000);
  created.push(b.id);
  const r2 = await Promise.all([0, 1, 0, 1, 0].map((i) => order(buyers[i], b.id, 1000, b.deliverFrom)));
  const ok2 = r2.filter((r) => r.ok).length;
  const sum = await prisma.order.aggregate({ where: { listingId: b.id }, _sum: { quantityG: true } });
  check("残り3kg に同時に1kg × 5件", ok2 === 3 && sum._sum.quantityG === 3000, `通った ${ok2}件・保存された量の合計 ${sum._sum.quantityG}g`);

  // テスト3：同じ目印で2回送っても、1件しかできない（連打対策）
  const c = await makeListing(producer, 5000);
  created.push(c.id);
  const key = randomUUID();
  const send = () => placeOrder({ buyerId: buyers[0], listingId: c.id, quantityG: 1000, method: "delivery", deliveryDate: c.deliverFrom, useDate: c.deliverFrom, showUseDate: false, requestKey: key });
  await Promise.all([send(), send(), send()]);
  const n3 = await prisma.order.count({ where: { listingId: c.id } });
  check("同じ申し込みを3回連打", n3 === 1, `保存された申し込み ${n3}件`);
} finally {
  // テスト用の出品を消す（申し込みも一緒に消える）
  await prisma.listing.deleteMany({ where: { id: { in: created } } });
  await prisma.$disconnect();
}

console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
