// 生産者が見る申し込みのカード（注文管理と、お試しのタブの「申し込み」で使い回す）
import Link from "next/link";
import { quantityText } from "@/app/ui/order-amount";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import type { Prisma } from "@/lib/generated/prisma/client";
import { orderStatusLabel } from "@/lib/order-status";
import { paymentLabel } from "@/lib/payment";
import { OrderButtons } from "./order-buttons";
import { OrderChecks } from "./order-checks";

// カードに必要な注文の中身（品目と、お店の名前・地域・届け先）
export type ProducerOrder = Prisma.OrderGetPayload<{
  include: {
    listing: { select: { vegetable: true } };
    buyer: { select: { name: true; buyerProfile: { select: { prefecture: true; city: true; address: true } } } };
  };
}>;

export function ProducerOrderCard({ order, unread, checks }: { order: ProducerOrder; unread: number; checks: string[] }) {
  return (
    <article className="flex flex-col gap-2 card p-4 text-sm">
      <div className="flex items-center justify-between gap-2">
        {/* お店の名前は、申し込んだ相手にだけ見える */}
        <p className="font-bold">{order.buyer.name}</p>
        <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${order.status === "confirmed" ? "bg-earth text-white" : "bg-earth-soft text-earth"}`}>
          {orderStatusLabel[order.status]}
        </span>
      </div>
      <p>
        {order.listing.vegetable} {quantityText(order.quantityG, order.isTrial)}・{methodLabel[order.method]}
        {order.isTrial && "・お試し"}
      </p>
      <p>
        商品代 {order.itemYen.toLocaleString()}円／送料・配達料 {order.shippingYen.toLocaleString()}円
      </p>
      <p>支払方法：{order.paymentMethod ? paymentLabel[order.paymentMethod] : "メッセージで相談"}</p>
      <Link href={`/orders/${order.id}`} className="font-bold text-earth underline">
        注文の詳細・メッセージ{unread > 0 && `（未読 ${unread}件）`}
      </Link>
      {/* 使用日は、お店が見せてよいとしたときだけ */}
      {order.showUseDate && <p className="text-muted">お店の使用日：{formatDate(order.useDate)}</p>}
      {order.buyer.buyerProfile && <p className="text-muted">お店の地域：{order.buyer.buyerProfile.prefecture} {order.buyer.buyerProfile.city}</p>}
      {/* 届け先の住所は、販売確定した注文にだけ見せる（不変条件4） */}
      {order.status === "confirmed" && order.method !== "pickup" && order.buyer.buyerProfile && (
        <p>届け先：{order.buyer.buyerProfile.address}</p>
      )}
      {order.status === "pending" && (
        <>
          <p className="text-muted">回答期限：{formatJstDateTime(order.answerUntil)}</p>
          <OrderChecks orderId={order.id} checks={checks} />
          <OrderButtons orderId={order.id} />
          <Link href={`/producer/orders/${order.id}/propose`} className="text-center font-bold text-earth underline">
            条件の変更を提案する
          </Link>
        </>
      )}
      {order.status === "change_pending" && order.proposedDeliveryDate && order.proposedQuantityG !== null && (
        <div className="rounded-xl bg-earth-soft p-3">
          <p className="font-bold">提案中（お店の返事待ち）</p>
          <p>
            納品日 {formatDate(order.deliveryDate)} → {formatDate(order.proposedDeliveryDate)}／数量 {quantityText(order.quantityG, order.isTrial)} → {quantityText(order.proposedQuantityG, order.isTrial)}
          </p>
          <p>断られたら：{order.confirmIfRefused ? "元の条件で販売確定" : "見送り"}</p>
          <p className="text-muted">回答期限：{formatJstDateTime(order.answerUntil)}</p>
        </div>
      )}
    </article>
  );
}
