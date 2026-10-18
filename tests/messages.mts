// 注文ごとのメッセージのテスト（不変条件4：当事者だけ）
// 実行：npm run test:messages
// テスト専用の出品を作り、終わったら消す

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { cancelOrder } from "../lib/order-flow";
import { messageThreads, sendMessage, totalUnread } from "../lib/messages";
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
const otherBuyer = await id("buyer2@example.com");
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

try {
  const o = await newOrder();
  // 未読の合計（ナビゲーションバーの通知のしるし）。テストの前の数を覚えておき、増えた分を見る
  const base = { producer: await totalUnread(producer), buyer: await totalUnread(buyer), otherProducer: await totalUnread(otherProducer), otherBuyer: await totalUnread(otherBuyer) };
  check("お店は送れる", (await sendMessage(buyer, o, "こんにちは")).ok);
  check("お店が送ると、農家さんの未読が1つ増える", (await totalUnread(producer)) === base.producer + 1);
  check("自分が送ったものは、自分の未読に数えない", (await totalUnread(buyer)) === base.buyer);
  check("ほかの人の未読は増えない", (await totalUnread(otherProducer)) === base.otherProducer && (await totalUnread(otherBuyer)) === base.otherBuyer);
  check("農家さんは送れる", (await sendMessage(producer, o, "よろしくお願いします")).ok);
  check("返事をすると、農家さんの未読は読んだことになる", (await totalUnread(producer)) === base.producer);
  check("農家さんが送ると、お店の未読が1つ増える", (await totalUnread(buyer)) === base.buyer + 1);
  await prisma.order.update({ where: { id: o }, data: { buyerReadAt: new Date() } });
  check("お店が注文の詳細を開くと、未読が消える", (await totalUnread(buyer)) === base.buyer);
  const r1 = await sendMessage(otherBuyer, o, "のぞき見");
  check("ほかのお店は送れない", !r1.ok, r1.ok ? "" : r1.message);
  const r2 = await sendMessage(otherProducer, o, "のぞき見");
  check("ほかの農家さんは送れない", !r2.ok, r2.ok ? "" : r2.message);

  const ended = await newOrder();
  await cancelOrder(buyer, ended);
  const r3 = await sendMessage(buyer, ended, "取り消したあと");
  check("終わった注文には送れない", !r3.ok, r3.ok ? "" : r3.message);

  // メッセージの画面の一覧（第2版）
  const ids = async (userId: string, side: "buyer" | "producer") => (await messageThreads(userId, side)).map((t) => t.orderId);
  check("お店の一覧に、やりとりできる注文が出る", (await ids(buyer, "buyer")).includes(o));
  check("農家さんの一覧に、やりとりできる注文が出る", (await ids(producer, "producer")).includes(o));
  check("メッセージがない終わった注文は、一覧に出ない", !(await ids(buyer, "buyer")).includes(ended));
  check("ほかのお店・ほかの農家さんの一覧には出ない", !(await ids(otherBuyer, "buyer")).includes(o) && !(await ids(otherProducer, "producer")).includes(o));
  const top = (await messageThreads(producer, "producer")).find((t) => t.orderId === o);
  check("相手の名前は、農家さんから見るとお店の名前", top?.partnerName === (await prisma.user.findUniqueOrThrow({ where: { id: buyer } })).name);

  // 1分に5件まで（送った人ごとに数える。お店はもう1件送っているので、あと4件で上限）
  const results = [];
  for (let i = 0; i < 5; i++) results.push(await sendMessage(buyer, o, `連続 ${i}`));
  check("1分に5件を超えると送れない", results.slice(0, 4).every((r) => r.ok) && !results[4].ok);
} finally {
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
