// 売上のまとめのテスト（第2版 4-3「注文管理」）
// 実行：npm run test:sales
// テスト専用の出品と注文を作り、終わったら消す

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { salesSummary } from "../lib/sales";
import { jstDateText, parseDate } from "../lib/datetime";

const day = 24 * 60 * 60 * 1000;
const id = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

const producer = await id("producer3@example.com");
const other = await id("producer2@example.com");
const buyer = await id("buyer1@example.com");
const today = parseDate(jstDateText(new Date()))!;
const thisMonth = jstDateText(new Date()).slice(0, 7);
// 2か月前の15日（月の初めや終わりをまたがないように、真ん中の日にする）
const [y, m] = thisMonth.split("-").map(Number);
const twoMonthsAgo = new Date(Date.UTC(y, m - 1 - 2, 15));
const sevenMonthsAgo = new Date(Date.UTC(y, m - 1 - 7, 15));
const thisMonthDay = new Date(`${thisMonth}-15T00:00:00Z`);

const makeListing = (producerId: string, vegetable: string) =>
  prisma.listing.create({
    data: {
      producerId, vegetable, totalG: 100000, unitG: 1000, minOrderG: 1000, unitPriceYen: 500,
      quality: "normal", surplus: false, acceptUntil: new Date(Date.now() + day), answerUntil: new Date(Date.now() + 2 * day),
      deliverFrom: today, deliverTo: new Date(today.getTime() + 10 * day), offersDelivery: true, offersSelf: false, offersPickup: false,
    },
  });
// テストなので、注文を直接作る（金額は 1kg 500円で計算した値を入れる）
const makeOrder = (listingId: string, kg: number, deliveryDate: Date, status: "confirmed" | "pending") =>
  prisma.order.create({
    data: {
      listingId, buyerId: buyer, quantityG: kg * 1000, method: "delivery", deliveryDate, useDate: deliveryDate, showUseDate: false,
      unitG: 1000, unitPriceYen: 500, itemYen: kg * 500, shippingYen: 800, totalYen: kg * 500 + 800,
      status, answerUntil: new Date(Date.now() + day), requestKey: randomUUID(),
    },
  });

const a = await makeListing(producer, "テスト売上なす");
const b = await makeListing(producer, "テスト売上きゅうり");
const c = await makeListing(other, "テスト売上ほかの農家");
try {
  const before = await salesSummary(producer);
  await makeOrder(a.id, 2, thisMonthDay, "confirmed"); // 今月 なす 2kg 1,000円
  await makeOrder(a.id, 3, twoMonthsAgo, "confirmed"); // 2か月前 なす 3kg 1,500円
  await makeOrder(b.id, 4, thisMonthDay, "confirmed"); // 今月 きゅうり 4kg 2,000円
  await makeOrder(b.id, 9, thisMonthDay, "pending"); // 返事待ちは数えない
  await makeOrder(a.id, 5, sevenMonthsAgo, "confirmed"); // 7か月前は表の外
  await makeOrder(c.id, 6, thisMonthDay, "confirmed"); // ほかの農家さんの注文は数えない
  const after = await salesSummary(producer);

  const diff = (i: number) => after.months[i].yen - before.months[i].yen;
  check("月別は6か月分、今月が一番上", after.months.length === 6 && after.months[0].month === thisMonth);
  check("今月の売上：販売確定の商品代だけ（送料・返事待ち・ほかの農家さんは入らない）", diff(0) === 3000, `${diff(0)}円`);
  check("2か月前の売上", diff(2) === 1500, `${diff(2)}円`);
  check("売れていない月も 0円 として増えない", diff(1) === 0 && diff(3) === 0);
  const veg = after.vegetables.filter((v) => v.vegetable.startsWith("テスト売上"));
  check("野菜別：6か月の中の量と売上（7か月前は入らない）", veg.length === 2 && veg[0].vegetable === "テスト売上なす" && veg[0].quantityG === 5000 && veg[0].yen === 2500, JSON.stringify(veg));
  check("野菜別は売れ筋（販売数量が多い）順", veg[0].quantityG >= veg[1].quantityG);
  check("ほかの農家さんの野菜は出ない", !after.vegetables.some((v) => v.vegetable === "テスト売上ほかの農家"));
} finally {
  await prisma.listing.deleteMany({ where: { id: { in: [a.id, b.id, c.id] } } });
  await prisma.$disconnect();
}
console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
