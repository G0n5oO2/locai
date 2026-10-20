// 飲食店の注文の一覧（ふつうの注文の画面と、お試しの画面で使い回す）
// trial が true ならお試しの注文だけ、false ならふつうの注文だけを出す（第2版：お試しの注文は、お試しのタブで見る）
import Link from "next/link";
import { expireOverdue } from "@/lib/availability";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { unreadCounts } from "@/lib/messages";
import { orderStatusLabel } from "@/lib/order-status";
import { paymentLabel } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { OrderAmount, quantityText } from "@/app/ui/order-amount";
import { BuyerOrderButtons } from "./buyer-order-buttons";

export async function BuyerOrderList({ userId, trial }: { userId: string; trial: boolean }) {
  // 回答期限を過ぎた返事待ちは、期限切れにしてから表示する
  await expireOverdue(prisma);
  // 自分の注文だけを読む（他人の注文は見えない）
  const orders = await prisma.order.findMany({
    where: { buyerId: userId, isTrial: trial },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { vegetable: true, producer: { select: { name: true, profile: { select: { pickupPlace: true } } } } } } },
  });
  // メッセージの未読の数
  const unread = await unreadCounts(userId, orders.map((o) => ({ id: o.id, readAt: o.buyerReadAt })));

  return (
    <>
      {orders.length === 0 && <p className="text-muted">{trial ? "まだお試しの注文はありません。" : "まだ注文はありません。"}</p>}
      {/* パソコンの幅では、カードを横に並べる */}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-col gap-1 card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-bold">{o.listing.vegetable}</p>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${o.status === "confirmed" ? "bg-leaf text-white" : "bg-leaf-soft text-leaf"}`}>
                {orderStatusLabel[o.status]}
              </span>
            </div>
            <p className="text-sm text-muted">{o.listing.producer.name}</p>
            <p className="text-sm">
              {methodLabel[o.method]}・納品 {formatDate(o.deliveryDate)}
            </p>
            {/* 数量と金額（合計は大きく、色を変える） */}
            <OrderAmount isTrial={o.isTrial} quantityG={o.quantityG} unitG={o.unitG} unitPriceYen={o.unitPriceYen} itemYen={o.itemYen} shippingYen={o.shippingYen} totalYen={o.totalYen} />
            <p className="text-sm">支払方法：{o.paymentMethod ? paymentLabel[o.paymentMethod] : "メッセージで相談"}</p>
            <Link href={`/orders/${o.id}`} className="text-sm font-bold text-leaf underline">
              注文の詳細・メッセージ{(unread.get(o.id) ?? 0) > 0 && `（未読 ${unread.get(o.id)}件）`}
            </Link>
            {/* 農家さんからの条件変更の提案 */}
            {o.status === "change_pending" && o.proposedDeliveryDate && o.proposedQuantityG !== null && o.proposedTotalYen !== null && (
              <div className="rounded-xl bg-leaf-soft p-3 text-sm">
                <p className="font-bold">農家さんから、条件の変更の提案が届きました</p>
                <p>
                  納品日 {formatDate(o.deliveryDate)} → <strong>{formatDate(o.proposedDeliveryDate)}</strong>
                </p>
                <p>
                  数量 {quantityText(o.quantityG, o.isTrial)} → <strong>{quantityText(o.proposedQuantityG, o.isTrial)}</strong>
                </p>
                <p>
                  合計 {o.totalYen.toLocaleString()}円 → <strong>{o.proposedTotalYen.toLocaleString()}円</strong>
                </p>
                <p className="mt-1">
                  ※ 断った場合は、{o.confirmIfRefused ? `元の条件（${formatDate(o.deliveryDate)}・${quantityText(o.quantityG, o.isTrial)}）で届きます` : "この購入希望は見送りになります"}
                </p>
              </div>
            )}
            {(o.status === "pending" || o.status === "change_pending") && (
              <>
                <p className="text-xs text-muted">回答期限：{formatJstDateTime(o.answerUntil)}（過ぎると期限切れになります）</p>
                <BuyerOrderButtons
                  orderId={o.id}
                  canRespond={o.status === "change_pending"}
                  refuseLabel={o.confirmIfRefused ? "断る（元の条件で確定）" : "断る（見送り）"}
                />
              </>
            )}
            {/* 引き取りの場所は、販売確定したときだけ見せる（不変条件4） */}
            {o.status === "confirmed" && o.method === "pickup" && o.listing.producer.profile?.pickupPlace && (
              <p className="text-sm">引き取りの場所：{o.listing.producer.profile.pickupPlace}</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
