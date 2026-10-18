// 注文ごとのメッセージ（見られるのは、その注文のお店と農家さんだけ：不変条件4）
import "server-only";
import { prisma } from "./prisma";

// 送れる状態（回答待ち〜販売確定）。終わった注文は読むだけ
export const MESSAGE_OPEN_STATUSES = ["pending", "change_pending", "confirmed"] as const;

// 連続して送れるのは、1分に5件まで（仕様書 5章3）
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

// その注文の当事者か調べる。当事者なら、どちら側か（buyer / producer）を返す
export async function partyOf(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { listing: { select: { producerId: true } } } });
  if (!order) return null;
  if (order.buyerId === userId) return { side: "buyer" as const, order };
  if (order.listing.producerId === userId) return { side: "producer" as const, order };
  return null;
}

export async function sendMessage(userId: string, orderId: string, body: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const party = await partyOf(userId, orderId);
  if (!party) return { ok: false, message: "注文が見つかりません" };
  if (!(MESSAGE_OPEN_STATUSES as readonly string[]).includes(party.order.status)) return { ok: false, message: "終わった注文には、メッセージを送れません" };

  const recent = await prisma.orderMessage.count({ where: { senderId: userId, createdAt: { gt: new Date(Date.now() - RATE_WINDOW_MS) } } });
  if (recent >= RATE_LIMIT) return { ok: false, message: "続けて送りすぎています。少し待ってから送ってください" };

  await prisma.$transaction([
    prisma.orderMessage.create({ data: { orderId, senderId: userId, body } }),
    // 自分が送ったメッセージは、読んだことにする
    prisma.order.update({ where: { id: orderId }, data: party.side === "buyer" ? { buyerReadAt: new Date() } : { producerReadAt: new Date() } }),
  ]);
  return { ok: true };
}

// 未読の数（相手から届いた、最後に読んだ時刻より新しいメッセージ）
export async function unreadCounts(userId: string, orders: { id: string; readAt: Date | null }[]) {
  const counts = new Map<string, number>();
  await Promise.all(
    orders.map(async (o) => {
      const n = await prisma.orderMessage.count({
        where: { orderId: o.id, senderId: { not: userId }, ...(o.readAt ? { createdAt: { gt: o.readAt } } : {}) },
      });
      counts.set(o.id, n);
    }),
  );
  return counts;
}

// 自分あての未読メッセージの合計（ナビゲーションバーの通知のしるしに使う）
// 自分が当事者の注文（お店として申し込んだ注文・農家として受けた注文）だけを数える（不変条件4）
export async function totalUnread(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n
    FROM order_message m
    JOIN "order" o ON o.id = m."orderId"
    JOIN listing l ON l.id = o."listingId"
    WHERE m."senderId" <> ${userId}
      AND (
        (o."buyerId" = ${userId} AND (o."buyerReadAt" IS NULL OR m."createdAt" > o."buyerReadAt"))
        OR (l."producerId" = ${userId} AND (o."producerReadAt" IS NULL OR m."createdAt" > o."producerReadAt"))
      )`;
  return rows[0]?.n ?? 0;
}

// メッセージの画面に出す、注文ごとのやりとりの一覧（第2版 4-3・4-4「メッセージ」）
// 出すのは、自分が当事者の注文のうち、やりとりできる注文すべてと、メッセージがある終わった注文（不変条件4）
export async function messageThreads(userId: string, side: "buyer" | "producer") {
  const mine = side === "buyer" ? { buyerId: userId } : { listing: { producerId: userId } };
  const orders = await prisma.order.findMany({
    where: { ...mine, OR: [{ status: { in: [...MESSAGE_OPEN_STATUSES] } }, { messages: { some: {} } }] },
    include: {
      listing: { select: { vegetable: true, producer: { select: { name: true } } } },
      buyer: { select: { name: true } },
      // 最後のメッセージ（書き出しと日時を出すため）
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } },
    },
  });
  const unread = await unreadCounts(userId, orders.map((o) => ({ id: o.id, readAt: side === "buyer" ? o.buyerReadAt : o.producerReadAt })));
  return orders
    .map((o) => ({
      orderId: o.id,
      // 相手の名前（お店から見たら農家さん、農家さんから見たらお店）
      partnerName: side === "buyer" ? o.listing.producer.name : o.buyer.name,
      vegetable: o.listing.vegetable,
      status: o.status,
      lastMessage: o.messages[0] ?? null,
      unread: unread.get(o.id) ?? 0,
      // 並べる順番：最後にメッセージが来た日時（まだなければ、申し込んだ日時）
      sortAt: (o.messages[0]?.createdAt ?? o.createdAt).getTime(),
    }))
    .sort((a, b) => b.sortAt - a.sortAt);
}
