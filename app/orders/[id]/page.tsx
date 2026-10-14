// 注文の詳細とメッセージ（その注文のお店と農家さんだけが見られる）
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { MESSAGE_OPEN_STATUSES, partyOf } from "@/lib/messages";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireUser } from "@/lib/session";
import { MessageForm } from "./message-form";

export default function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  return (
    <AuthShell title="注文の詳細">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <OrderDetail {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function OrderDetail({ params }: PageProps<"/orders/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  // 当事者でなければ「見つからない」（他人の注文は、あることも教えない）
  const party = await partyOf(user.id, id);
  if (!party) notFound();
  const isBuyer = party.side === "buyer";

  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
    include: {
      listing: { select: { vegetable: true, producer: { select: { name: true, profile: { select: { pickupPlace: true } } } } } },
      buyer: { select: { name: true, buyerProfile: { select: { address: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
  });
  // 開いたら、メッセージを読んだことにする
  await prisma.order.update({ where: { id }, data: isBuyer ? { buyerReadAt: new Date() } : { producerReadAt: new Date() } });

  const canSend = (MESSAGE_OPEN_STATUSES as readonly string[]).includes(order.status);
  const confirmed = order.status === "confirmed";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold">{order.listing.vegetable}</p>
          <span className="rounded-full bg-leaf-soft px-3 py-0.5 text-xs font-medium text-leaf">{orderStatusLabel[order.status]}</span>
        </div>
        <p>相手：{isBuyer ? order.listing.producer.name : order.buyer.name}</p>
        <p>
          {gramsToKgText(order.quantityG)}kg・{methodLabel[order.method]}・納品 {formatDate(order.deliveryDate)}
          {order.isTrial && "・お試し"}
        </p>
        <p>
          商品代 {order.itemYen.toLocaleString()}円 ＋ 送料 {order.shippingYen.toLocaleString()}円 ＝ <strong>{order.totalYen.toLocaleString()}円</strong>
        </p>
        {/* 使用日は、お店本人か、お店が見せてよいとしたときだけ */}
        {(isBuyer || order.showUseDate) && <p className="text-muted">使用日：{formatDate(order.useDate)}</p>}
        {/* 届け先・引き取りの場所は、販売確定したときだけ相手に見せる（不変条件4） */}
        {confirmed && !isBuyer && order.method !== "pickup" && order.buyer.buyerProfile && <p>届け先：{order.buyer.buyerProfile.address}</p>}
        {confirmed && isBuyer && order.method === "pickup" && order.listing.producer.profile?.pickupPlace && (
          <p>引き取りの場所：{order.listing.producer.profile.pickupPlace}</p>
        )}
        {confirmed && <p className="mt-1 text-xs text-muted">支払いと配送の手配は、当事者どうしでアプリの外で行います。支払方法・支払期限・発送予定は、下のメッセージで確かめてください。</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">メッセージ</h2>
        {order.messages.length === 0 && <p className="text-sm text-muted">まだメッセージはありません。</p>}
        <ul className="flex flex-col gap-2">
          {order.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <li key={m.id} className={`flex max-w-[85%] flex-col gap-1 rounded-2xl p-3 text-sm ${mine ? "self-end bg-leaf-soft" : "self-start border border-line bg-surface"}`}>
                <span className="text-xs text-muted">
                  {mine ? "あなた" : m.sender.name}・{formatJstDateTime(m.createdAt)}
                </span>
                {/* 入力された文字は、テキストとしてそのまま表示する */}
                <span className="whitespace-pre-wrap">{m.body}</span>
              </li>
            );
          })}
        </ul>
        {canSend ? (
          <>
            <p className="text-xs text-muted">メッセージで話し合っても、量・金額・納品日は変わりません。変えるときは、農家さんの「条件変更の提案」を使います。</p>
            <MessageForm orderId={order.id} />
          </>
        ) : (
          <p className="text-sm text-muted">この注文は終わったので、メッセージは読むだけです。</p>
        )}
      </section>
    </div>
  );
}
