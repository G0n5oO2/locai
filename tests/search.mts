// 仕入れ候補の4つの並べ方のテスト（第2版 4-4、不変条件6）
// 実行：npm run test:search
// テスト専用の出品を作り、終わったら消す（表示された回数の記録も元に戻す）

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { searchListings, type Candidate } from "../lib/search";
import { jstDateText, parseDate } from "../lib/datetime";

const day = 24 * 60 * 60 * 1000;
const id = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

const producerA = await id("producer2@example.com");
const producerB = await id("producer3@example.com");
const buyer = await id("buyer1@example.com");
const buyerProfile = await prisma.buyerProfile.findUniqueOrThrow({ where: { userId: buyer } });
const exposureBefore = await prisma.producerExposure.findMany({ where: { producerId: { in: [producerA, producerB] } } });
const today = parseDate(jstDateText(new Date()))!;
const vegetable = `テスト検索野菜${randomUUID().slice(0, 6)}`;

// 農家さんA は3件（値段がちがう）、農家さんB は1件
const make = (producerId: string, unitPriceYen: number, fromDays: number) =>
  prisma.listing.create({
    data: {
      producerId, vegetable, totalG: 10000, unitG: 1000, minOrderG: 1000, unitPriceYen,
      quality: "normal", surplus: false, acceptUntil: new Date(Date.now() + day), answerUntil: new Date(Date.now() + 2 * day),
      deliverFrom: new Date(today.getTime() + fromDays * day), deliverTo: new Date(today.getTime() + 10 * day),
      offersDelivery: true, offersSelf: false, offersPickup: false,
    },
  });
const listings = [await make(producerA, 100, 5), await make(producerA, 200, 4), await make(producerA, 300, 3), await make(producerB, 400, 6)];
const nameOf = new Map([[producerA, "A"], [producerB, "B"]]);
const owner = new Map(listings.map((l) => [l.id, nameOf.get(l.producerId)!]));
const owners = (list: Candidate[]) => list.map((c) => owner.get(c.listingId)).join("");
const search = () =>
  searchListings({ buyerId: buyer, buyerPrefecture: buyerProfile.prefecture, buyerCity: buyerProfile.city, vegetable, quantityG: 1000, budgetYen: 100000, useDate: new Date(today.getTime() + 9 * day), method: "delivery" });

try {
  const r = await search();
  const ids = (list: Candidate[]) => list.map((c) => c.listingId).sort().join();
  check("4件とも候補に出る", r.random.length === 4, `${r.random.length}件`);
  check("ランダム・安い順・納品日が早い順は、中身が同じで並び順だけがちがう", ids(r.random) === ids(r.cheap) && ids(r.cheap) === ids(r.early));
  // A が3件、B が1件なので「A B A A」のように、続くのは最後だけになるはず
  const ok = (s: string) => s.slice(0, 3).split("").every((x, i, a) => i === 0 || x !== a[i - 1]);
  check("同じ農家さんが、避けられるところでは続かない", [r.random, r.cheap, r.early].every((l) => ok(owners(l))), `${owners(r.random)} / ${owners(r.cheap)} / ${owners(r.early)}`);
  check("安い順の一番上は、一番安い出品", r.cheap[0]?.listingId === listings[0].id);
  check("納品日が早い順の一番上は、一番早く届く出品", r.early[0]?.listingId === listings[2].id);
  check("お試しで買ったことがないうちは、「お試しを利用した農家」は空", r.trial.length === 0);

  // B からお試しで買ったことにする（申し込みを作り、お試しの印を付けて販売確定にする）
  const t = await placeOrder({ buyerId: buyer, listingId: listings[3].id, quantityG: 1000, method: "delivery", deliveryDate: listings[3].deliverFrom, useDate: listings[3].deliverFrom, showUseDate: false, requestKey: randomUUID() });
  if (!t.ok) throw new Error(t.message);
  await prisma.order.update({ where: { id: t.orderId }, data: { status: "confirmed", isTrial: true } }); // テストなので、お試しで買ったことにする
  const r2 = await search();
  check("お試しで買った農家さんの出品だけが「お試しを利用した農家」に出る", owners(r2.trial) === "B", owners(r2.trial));

  // 希望数量・予算・使用日は任意（第2版）。空にすると、その条件では絞らず、金額は出さない
  const open = await searchListings({ buyerId: buyer, buyerPrefecture: buyerProfile.prefecture, buyerCity: buyerProfile.city, vegetable, quantityG: null, budgetYen: null, useDate: null, method: "delivery" });
  check("希望数量・予算・使用日が空でも、4件とも候補に出る", open.random.length === 4, `${open.random.length}件`);
  check("希望数量が空のときは、合計を出さず、1kg あたりの値段を出す", open.random.every((c) => c.totalYen === null && c.quantityG === null && c.perKgYen > 0));
  check("希望数量が空のときの安い順は、1kg あたりの値段の順", open.cheap[0]?.listingId === listings[0].id);
  const noBudget = await searchListings({ buyerId: buyer, buyerPrefecture: buyerProfile.prefecture, buyerCity: buyerProfile.city, vegetable, quantityG: 1000, budgetYen: null, useDate: null, method: "delivery" });
  check("予算が空なら予算では絞らず、希望数量があれば合計は出す", noBudget.random.length === 4 && noBudget.random.every((c) => c.totalYen !== null));
  const tight = await searchListings({ buyerId: buyer, buyerPrefecture: buyerProfile.prefecture, buyerCity: buyerProfile.city, vegetable, quantityG: 1000, budgetYen: 1, useDate: null, method: "delivery" });
  check("予算を入れたときは、今までどおり予算で絞る", tight.random.length === 0);

  // ランダムは、毎回同じ順番にならない（20回探して、一番上が2種類以上ある）
  const tops = new Set<string>();
  for (let i = 0; i < 20; i++) tops.add((await search()).random[0].listingId);
  check("ランダムの一番上は、探すたびに変わる", tops.size >= 2, `${tops.size}種類`);
} finally {
  await prisma.listing.deleteMany({ where: { id: { in: listings.map((l) => l.id) } } });
  // 表示された回数を、テストの前に戻す
  for (const p of [producerA, producerB]) {
    const before = exposureBefore.find((e) => e.producerId === p);
    if (before) await prisma.producerExposure.update({ where: { producerId: p }, data: { count: before.count } });
    else await prisma.producerExposure.deleteMany({ where: { producerId: p } });
  }
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
