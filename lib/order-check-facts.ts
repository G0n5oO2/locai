// 注文の確認ポイントと、AI に渡す事実をそろえる（生産者本人の注文だけ）
import "server-only";
import { methodLabel } from "./burden";
import { jstDateText, parseDate } from "./datetime";
import type { SummaryFacts } from "./ai-order-summary";
import { orderChecks } from "./order-checks";
import { prisma } from "./prisma";
import { gramsToKgText } from "./quantity";

const day = 24 * 60 * 60 * 1000;

// 1つの注文の確認ポイント（自分の出品への注文でなければ null）
export async function checksFor(producerId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      listing: { select: { producerId: true, vegetable: true, quality: true, producer: { select: { profile: true } } } },
      buyer: { select: { buyerProfile: { select: { prefecture: true, city: true } } } },
    },
  });
  const profile = order?.listing.producer.profile;
  if (!order || order.listing.producerId !== producerId || !profile) return null;
  const sameDayCount = await prisma.order.count({
    where: { listing: { producerId }, method: order.method, deliveryDate: order.deliveryDate, status: { in: ["pending", "change_pending", "confirmed"] } },
  });
  const limit = { delivery: profile.shipLimitDelivery, self: profile.shipLimitSelf, pickup: profile.shipLimitPickup }[order.method];
  const checks = orderChecks({
    method: order.method,
    deliveryDate: order.deliveryDate,
    useDate: order.useDate,
    showUseDate: order.showUseDate,
    isTrial: order.isTrial,
    quality: order.listing.quality,
    farm: profile,
    shop: order.buyer.buyerProfile,
    sameDayCount,
    limit,
  });
  return { order, checks };
}

// AI に渡す事実：店名・住所・地域の名前は入れない
export async function summaryFactsFor(producerId: string, orderId: string): Promise<SummaryFacts | null> {
  const found = await checksFor(producerId, orderId);
  if (!found) return null;
  const { order, checks } = found;
  const today = parseDate(jstDateText(new Date()))!;
  return {
    食材: order.listing.vegetable,
    数量: `${gramsToKgText(order.quantityG)}kg`,
    受け取り方法: methodLabel[order.method],
    納品日まで: `${Math.round((order.deliveryDate.getTime() - today.getTime()) / day)}日`,
    確認ポイント: checks,
  };
}
