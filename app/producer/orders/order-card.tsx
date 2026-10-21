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

// 見やすくするため、大事なもの（お店の名前・野菜と量・合計）は大きく・色を変え、こまかい情報は小さな見出しつきで並べる
export function ProducerOrderCard({ order, unread, checks }: { order: ProducerOrder; unread: number; checks: string[] }) {
  const statusColor =
    order.status === "confirmed" ? "bg-earth text-white" : order.status === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-earth-soft text-earth";
  return (
    <article className="flex flex-col gap-3 card p-4 text-sm">
      {/* いちばん上：お店の名前（大きく）と、状態のラベル */}
      <div className="flex flex-wrap items-center gap-2">
        {/* お店の名前は、申し込んだ相手にだけ見える */}
        <p className="mr-auto text-lg font-bold">{order.buyer.name}</p>
        {order.isTrial && <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">お試し</span>}
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusColor}`}>{orderStatusLabel[order.status]}</span>
      </div>
      {/* 野菜と量（大きく）・合計（大きく、色を変える） */}
      <div className="flex items-end justify-between gap-3">
        <p>
          <span className="block text-xs text-muted">{order.listing.vegetable}</span>
          <span className="text-2xl font-bold">{quantityText(order.quantityG, order.isTrial)}</span>
        </p>
        <p className="text-right">
          <span className="block text-xs text-muted">
            商品代 {order.itemYen.toLocaleString()}円＋送料 {order.shippingToBeDecided ? "要相談" : `${order.shippingYen.toLocaleString()}円`}
          </span>
          <span className="text-2xl font-bold text-earth">{order.totalYen.toLocaleString()}円</span>
        </p>
      </div>
      {/* こまかい情報（見出しは小さくうすく、中身ははっきり） */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-background p-3">
        <div>
          <dt className="text-xs text-muted">受け渡し</dt>
          <dd className="font-bold">{methodLabel[order.method]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">納品日</dt>
          <dd className="font-bold">{formatDate(order.deliveryDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">支払方法</dt>
          <dd className="font-bold">{order.paymentMethod ? paymentLabel[order.paymentMethod] : "メッセージで相談"}</dd>
        </div>
        {/* 使用日は、お店が見せてよいとしたときだけ */}
        {order.showUseDate && (
          <div>
            <dt className="text-xs text-muted">お店の使用日</dt>
            <dd className="font-bold">{formatDate(order.useDate)}</dd>
          </div>
        )}
        {order.buyer.buyerProfile && (
          <div className="col-span-2">
            <dt className="text-xs text-muted">お店の地域</dt>
            <dd className="font-bold">
              {order.buyer.buyerProfile.prefecture} {order.buyer.buyerProfile.city}
            </dd>
          </div>
        )}
        {/* 届け先の住所は、販売確定した注文にだけ見せる（不変条件4） */}
        {order.status === "confirmed" && order.method !== "pickup" && order.buyer.buyerProfile && (
          <div className="col-span-2">
            <dt className="text-xs text-muted">届け先</dt>
            <dd className="font-bold">{order.buyer.buyerProfile.address}</dd>
          </div>
        )}
      </dl>
      {order.status === "pending" && (
        <>
          <p className="font-bold text-amber-800 dark:text-amber-200">回答期限：{formatJstDateTime(order.answerUntil)}</p>
          <OrderChecks orderId={order.id} checks={checks} />
          {order.shippingToBeDecided ? (
            // 送料が要相談：承認の前に、送料を決めて提案する（送料が決まらないまま販売確定にしない）
            <>
              <p className="rounded-xl bg-amber-50 p-2 font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">お店が送料の表より遠いので、送料が要相談です。送料を決めて、お店に提案してください。</p>
              <Link href={`/producer/orders/${order.id}/propose`} className="btn btn-sm btn-earth">
                送料を決めて提案する
              </Link>
              <OrderButtons orderId={order.id} declineOnly />
            </>
          ) : (
            <>
              <OrderButtons orderId={order.id} />
              <Link href={`/producer/orders/${order.id}/propose`} className="text-center font-bold text-earth underline">
                条件の変更を提案する
              </Link>
            </>
          )}
        </>
      )}
      {order.status === "change_pending" && order.proposedDeliveryDate && order.proposedQuantityG !== null && (
        <div className="flex flex-col gap-1 rounded-2xl bg-earth-soft p-3">
          <p className="font-bold">提案中（お店の返事待ち）</p>
          <p>
            納品日 {formatDate(order.deliveryDate)} → <strong>{formatDate(order.proposedDeliveryDate)}</strong>
          </p>
          <p>
            数量 {quantityText(order.quantityG, order.isTrial)} → <strong>{quantityText(order.proposedQuantityG, order.isTrial)}</strong>
          </p>
          {order.shippingToBeDecided && order.proposedShippingYen !== null && (
            <p>
              送料 要相談 → <strong>{order.proposedShippingYen.toLocaleString()}円</strong>（合計 {order.proposedTotalYen?.toLocaleString()}円）
            </p>
          )}
          <p className="text-xs text-muted">断られたら：{order.confirmIfRefused ? "元の条件で販売確定" : "見送り"}／回答期限：{formatJstDateTime(order.answerUntil)}</p>
        </div>
      )}
      <Link href={`/orders/${order.id}`} className="btn btn-sm btn-outline-earth">
        注文の詳細・メッセージ{unread > 0 && `（未読 ${unread}件）`}
      </Link>
    </article>
  );
}
