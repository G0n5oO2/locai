// 距離の料金・送料の要相談・自分で配達の距離のテスト（第2版）
// 実行：npm run test:distance
// テスト専用の出品と注文を作り、終わったら消す（農家さんのプロフィールも元に戻す）

import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { placeOrder } from "../lib/orders";
import { acceptProposal, approveOrder, proposeChange } from "../lib/order-flow";
import { quote } from "../lib/pricing";
import { farmShopKm } from "../lib/region";

const day = 24 * 60 * 60 * 1000;
const id = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

// ===== 金額の計算だけ（データベースを使わない） =====
const price = { unitG: 1000, unitPriceYen: 500, minOrderG: 1000 };
const base = {
  deliveryBand1MaxG: 5000, deliveryBand1Yen: 800, deliveryBand2MaxG: null, deliveryBand2Yen: null, deliveryBand3MaxG: null, deliveryBand3Yen: null,
  distanceFeeMaxKm: [] as number[], distanceFeeYen: [] as number[], selfDeliveryYen: 600, selfDeliveryMaxKm: null as number | null, pickupPlace: "",
};
const q1 = quote(price, base, 2000, "delivery", 120);
check("距離の料金の表がないときは、重さの料金だけ", !("error" in q1) && q1.shippingYen === 800 && !q1.shippingToBeDecided);
const withTable = { ...base, distanceFeeMaxKm: [50, 100], distanceFeeYen: [300, 600] };
const q2 = quote(price, withTable, 2000, "delivery", 80);
check("送料 ＝ 重さの料金 ＋ 距離の料金（80km は 100km までの行）", !("error" in q2) && q2.shippingYen === 1400 && q2.totalYen === 2400);
const q3 = quote(price, withTable, 2000, "delivery", 50);
check("ちょうど 50km は 50km までの行", !("error" in q3) && q3.shippingYen === 1100);
const q4 = quote(price, withTable, 2000, "delivery", 150);
check("表より遠いと、送料は要相談（合計は商品代だけ）", !("error" in q4) && q4.shippingToBeDecided && q4.shippingYen === 0 && q4.totalYen === 1000);
const q5 = quote(price, { ...base, selfDeliveryMaxKm: 30 }, 2000, "self", 31);
check("自分で配達は、決めた距離より遠いと選べない", "error" in q5);
const q6 = quote(price, { ...base, selfDeliveryMaxKm: 30 }, 2000, "self", 30);
check("自分で配達は、決めた距離ちょうどなら選べる", !("error" in q6) && q6.shippingYen === 600);
const q7 = quote(price, withTable, 2000, "pickup", 150);
check("引き取りは、遠くても選べて送料 0円", !("error" in q7) && q7.shippingYen === 0);

// ===== 申し込みと注文の流れ（データベースを使う） =====
const producer = await id("producer8@example.com"); // 泉佐野市
const farFarmer = await id("producer10@example.com"); // 南あわじ市（お店から 70km より遠い）
const buyer = await id("buyer1@example.com"); // 大阪市福島区
const before = await prisma.producerProfile.findUniqueOrThrow({ where: { userId: producer } });
const buyerProfile = await prisma.buyerProfile.findUniqueOrThrow({ where: { userId: buyer } });
const km = farmShopKm(before, buyerProfile)!;
const farKm = farmShopKm((await prisma.producerProfile.findUniqueOrThrow({ where: { userId: farFarmer } })), buyerProfile)!;
const vegetable = `テスト距離野菜${randomUUID().slice(0, 6)}`;
const make = (producerId: string) =>
  prisma.listing.create({
    data: {
      producerId, vegetable, totalG: 10000, unitG: 1000, minOrderG: 1000, unitPriceYen: 500,
      quality: "normal", surplus: false, acceptUntil: new Date(Date.now() + day), answerUntil: new Date(Date.now() + 2 * day),
      deliverFrom: new Date(Date.now() + day), deliverTo: new Date(Date.now() + 10 * day),
      offersDelivery: true, offersSelf: true, offersPickup: false,
    },
  });
const listing = await make(producer);
const farListing = await make(farFarmer);
const order = (listingId: string, method: "delivery" | "self", deliverFrom: Date) =>
  placeOrder({ buyerId: buyer, listingId, quantityG: 2000, method, deliveryDate: deliverFrom, useDate: deliverFrom, showUseDate: false, requestKey: randomUUID(), paymentMethod: null });

try {
  // お店より近い距離までしか表がない農家さん（表より遠いので、送料は要相談）。自分で配達は、お店より近い距離まで
  await prisma.producerProfile.update({
    where: { userId: producer },
    data: { distanceFeeMaxKm: [km - 1], distanceFeeYen: [300], selfDeliveryMaxKm: km - 1, selfDeliveryYen: 500, paymentMethods: [] },
  });

  const far = await order(farListing.id, "delivery", farListing.deliverFrom);
  check(`70km より遠い農家さんにも申し込める（約${farKm}km）`, far.ok, far.ok ? "" : far.message);

  const self = await order(listing.id, "self", listing.deliverFrom);
  check("配達の距離より遠いお店は、自分で配達を申し込めない", !self.ok);

  const r = await order(listing.id, "delivery", listing.deliverFrom);
  if (!r.ok) throw new Error(r.message);
  const o1 = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
  check("表より遠い宅配は、送料が要相談の注文になる", o1.shippingToBeDecided && o1.shippingYen === 0 && o1.totalYen === 1000);

  const approved = await approveOrder(producer, r.orderId);
  check("送料が要相談のままでは、承認（販売確定）できない", !approved.ok);

  const noFee = await proposeChange(producer, r.orderId, { newDeliveryDate: null, newQuantityG: null, confirmIfRefused: true });
  check("送料を入れないと、提案できない", !noFee.ok);

  const proposed = await proposeChange(producer, r.orderId, { newDeliveryDate: null, newQuantityG: null, confirmIfRefused: true, shippingYen: 1500 });
  const o2 = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
  check("送料を入れて提案すると、条件変更の確認待ちになる", proposed.ok && o2.status === "change_pending");
  check("提案の合計は、アプリが 商品代＋送料 で計算する", o2.proposedShippingYen === 1500 && o2.proposedTotalYen === 2500);
  check("送料が要相談の提案は、断られたら見送りだけ", o2.confirmIfRefused === false);

  const accepted = await acceptProposal(buyer, r.orderId);
  const o3 = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } });
  check("お店が同意すると、送料が決まって販売確定になる", accepted.ok && o3.status === "confirmed" && o3.shippingYen === 1500 && o3.totalYen === 2500 && !o3.shippingToBeDecided);
} finally {
  await prisma.order.deleteMany({ where: { listingId: { in: [listing.id, farListing.id] } } });
  await prisma.listing.deleteMany({ where: { id: { in: [listing.id, farListing.id] } } });
  await prisma.producerProfile.update({
    where: { userId: producer },
    data: { distanceFeeMaxKm: before.distanceFeeMaxKm, distanceFeeYen: before.distanceFeeYen, selfDeliveryMaxKm: before.selfDeliveryMaxKm, selfDeliveryYen: before.selfDeliveryYen, paymentMethods: before.paymentMethods },
  });
  await prisma.$disconnect();
}
if (failed) process.exit(1);
