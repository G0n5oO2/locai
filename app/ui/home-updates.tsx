// ホームのお知らせ（第2版）。自分が当事者の注文だけを使う（不変条件4）。生産者・飲食店で使い回す
// - HomeNoticesFor：ログインしてホームを開いたときに、上から出す通知（新しいメッセージ・条件変更の提案・返事待ち・今日の納品）
// - DeliveryCalendarFor：納品の予定のカレンダー
import { methodLabel } from "@/lib/burden";
import { formatJstDateTime, jstDateText, parseDate } from "@/lib/datetime";
import { messagePartners } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { DeliveryCalendar } from "./delivery-calendar";
import { HomeNotices, type Notice } from "./home-notices";
import { quantityText } from "./order-amount";

type Side = "producer" | "buyer";
const mine = (userId: string, side: Side) => (side === "buyer" ? { buyerId: userId } : { listing: { producerId: userId } });

// fromLogin：ログインしたばかりのときだけ通知を出す
export async function HomeNoticesFor({ userId, side, fromLogin }: { userId: string; side: Side; fromLogin: boolean }) {
  if (!fromLogin) return null;
  const today = parseDate(jstDateText(new Date()))!;
  const [partners, todayCount, waiting] = await Promise.all([
    messagePartners(userId, side),
    // 今日が納品日の、販売確定した注文
    prisma.order.count({ where: { ...mine(userId, side), status: "confirmed", deliveryDate: today } }),
    // 返事が必要なもの：お店は「農家さんからの条件（納品日など）変更の提案」、農家さんは「返事待ちの申し込み」
    prisma.order.count({ where: { ...mine(userId, side), status: side === "buyer" ? "change_pending" : "pending" } }),
  ]);
  const unread = partners.reduce((sum, p) => sum + p.unread, 0);

  // 内容は出さず、何が何件あるかだけを出す
  const notices: Notice[] = [];
  if (todayCount > 0)
    notices.push({
      key: "today",
      text: `今日は納品日です（${todayCount}件）`,
      tone: "red",
      action: { label: "確認する", href: side === "buyer" ? "/buyer/orders?status=confirmed" : "/producer/orders" },
      dismissLabel: "閉じる",
    });
  if (waiting > 0)
    notices.push(
      side === "buyer"
        ? { key: "change", text: `農家さんから、納品日などの変更の提案が ${waiting}件届いています`, tone: "earth", action: { label: "確認する", href: "/buyer/orders?status=waiting" }, dismissLabel: "あとで" }
        : { key: "pending", text: `返事待ちの申し込みが ${waiting}件あります`, tone: "earth", action: { label: "確認する", href: "/producer/orders" }, dismissLabel: "あとで" },
    );
  if (unread > 0)
    notices.push({ key: "message", text: `新しいメッセージが ${unread}件あります`, tone: "leaf", action: { label: "返信する", href: `/${side}/messages` }, dismissLabel: "確認した" });

  return <HomeNotices notices={notices} fromLogin={fromLogin} />;
}

export async function DeliveryCalendarFor({ userId, side }: { userId: string; side: Side }) {
  const todayText = jstDateText(new Date());
  const [y, m] = todayText.split("-").map(Number);
  // カレンダーで見られる範囲：前の月のはじめ 〜 2か月先の月の終わり
  const from = new Date(Date.UTC(y, m - 2, 1));
  const to = new Date(Date.UTC(y, m + 2, 0));
  const orders = await prisma.order.findMany({
    where: { ...mine(userId, side), status: "confirmed", deliveryDate: { gte: from, lte: to } },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    include: { listing: { select: { vegetable: true, producer: { select: { name: true } } } }, buyer: { select: { name: true } } },
  });
  const deliveries = orders.map((o) => ({
    id: o.id,
    date: o.deliveryDate.toISOString().slice(0, 10),
    vegetable: o.listing.vegetable,
    quantity: quantityText(o.quantityG, o.isTrial),
    grams: o.quantityG,
    partner: side === "producer" ? o.buyer.name : o.listing.producer.name,
    method: methodLabel[o.method],
    methodKey: o.method,
  }));
  if (side === "buyer") {
    // お店だけ：返事待ちの注文の期限（農家さんの回答期限と、条件の変更の提案にお店が返事をする期限）。自分の注文だけを読む
    const waiting = await prisma.order.findMany({
      where: { buyerId: userId, status: { in: ["pending", "change_pending"] }, answerUntil: { gt: new Date() } },
      include: { listing: { select: { vegetable: true, producer: { select: { name: true } } } } },
    });
    const orderMarks = waiting.map((o) => ({
      orderId: o.id,
      date: jstDateText(o.answerUntil),
      kind: o.status === "change_pending" ? ("mine" as const) : ("farmer" as const),
      vegetable: o.listing.vegetable,
      partner: o.listing.producer.name,
      time: formatJstDateTime(o.answerUntil),
    }));
    return <DeliveryCalendar deliveries={deliveries} today={todayText} side={side} orderMarks={orderMarks} />;
  }

  // 農家さんだけ：1回の出荷の基準（負担の目安）と、受付中の出品の期限の印
  const profile = await prisma.producerProfile.findUnique({ where: { userId } });
  const limits = profile ? { delivery: profile.shipLimitDelivery, self: profile.shipLimitSelf, pickup: profile.shipLimitPickup } : undefined;
  const listings = await prisma.listing.findMany({
    where: { producerId: userId, status: "open", OR: [{ acceptUntil: { gte: from, lte: new Date(to.getTime() + 86_400_000) } }, { answerUntil: { gte: from, lte: new Date(to.getTime() + 86_400_000) } }] },
    select: { id: true, vegetable: true, acceptUntil: true, answerUntil: true },
  });
  const deadlines = listings.flatMap((l) => [
    { date: jstDateText(l.acceptUntil), kind: "accept" as const, vegetable: l.vegetable, time: formatJstDateTime(l.acceptUntil), listingId: l.id },
    { date: jstDateText(l.answerUntil), kind: "answer" as const, vegetable: l.vegetable, time: formatJstDateTime(l.answerUntil), listingId: l.id },
  ]);
  return <DeliveryCalendar deliveries={deliveries} today={todayText} side={side} limits={limits} deadlines={deadlines} />;
}
