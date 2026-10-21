// 地図で探すのテスト（第2版）
// 実行：npm run test:map
// テスト専用の出品を作り、終わったら消す（表示された回数の記録も元に戻す）

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { mapListings } from "../lib/map-search";

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
const exposureBefore = await prisma.producerExposure.findMany({ where: { producerId: { in: [producerA, producerB] } } });
const vegetable = `テスト地図野菜${randomUUID().slice(0, 6)}`;

const make = (producerId: string, extra: { totalG?: number; isTrial?: boolean; acceptDays?: number } = {}) =>
  prisma.listing.create({
    data: {
      producerId, vegetable, totalG: extra.totalG ?? 10000, unitG: 1000, minOrderG: 1000, unitPriceYen: 300,
      quality: "normal", surplus: false, isTrial: extra.isTrial ?? false,
      acceptUntil: new Date(Date.now() + (extra.acceptDays ?? 1) * day), answerUntil: new Date(Date.now() + 2 * day),
      deliverFrom: new Date(Date.now() + day), deliverTo: new Date(Date.now() + 10 * day),
      offersDelivery: true, offersSelf: false, offersPickup: true,
    },
  });
const a1 = await make(producerA);
const a2 = await make(producerA);
const b1 = await make(producerB);
const tooSmall = await make(producerB, { totalG: 500 }); // 残りが最低注文量に届かない
const trial = await make(producerB, { isTrial: true }); // お試し食材
const closed = await make(producerB, { acceptDays: -1 }); // 受付期限を過ぎた
const all = [a1, a2, b1, tooSmall, trial, closed];

try {
  const list = await mapListings(buyer, vegetable);
  const ids = new Set(list.map((l) => l.listingId));
  check("受付中のふつうの出品は出る", ids.has(a1.id) && ids.has(a2.id) && ids.has(b1.id));
  check("残りが最低注文量に届かない出品は出ない", !ids.has(tooSmall.id));
  check("お試し食材は出ない", !ids.has(trial.id));
  check("受付期限を過ぎた出品は出ない", !ids.has(closed.id));
  check("農家さんの ID は画面に渡さない", list.every((l) => !("producerId" in l)));
  check("場所は市区町村の代表地点", list.every((l) => typeof l.lat === "number" && l.area.includes(" ")));
  check("申し込める量はアプリが計算する", list.find((l) => l.listingId === a1.id)?.availableG === 10000);
  // 同じ農家さんが続かない（避けられるのに A・A・B と並ぶことはない。B が先頭なら、残りは A だけなので B・A・A になる）
  const orders = new Set<string>();
  for (let n = 0; n < 20; n++) orders.add((await mapListings(buyer, vegetable)).map((l) => (l.listingId === b1.id ? "B" : "A")).join(""));
  check("同じ農家さんの出品が続けて並ばない", !orders.has("AAB"), [...orders].join("・"));
  // 食材で絞る
  check("食材の名前で絞れる", (await mapListings(buyer, `${vegetable}ちがう`)).length === 0);
} finally {
  await prisma.listing.deleteMany({ where: { id: { in: all.map((l) => l.id) } } });
  // 表示された回数の記録を元に戻す
  for (const p of [producerA, producerB]) {
    const before = exposureBefore.find((e) => e.producerId === p);
    if (before) await prisma.producerExposure.update({ where: { producerId: p }, data: { count: before.count } });
    else await prisma.producerExposure.deleteMany({ where: { producerId: p } });
  }
  await prisma.$disconnect();
}
if (failed) process.exit(1);
