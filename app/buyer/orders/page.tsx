// 自分の注文（購入希望）の一覧（飲食店だけが使える）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { expireOverdue } from "@/lib/availability";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";
import { BuyerOrderButtons } from "./buyer-order-buttons";

export default function BuyerOrdersPage() {
  return (
    <AuthShell title="自分の注文">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Orders />
      </Suspense>
    </AuthShell>
  );
}

async function Orders() {
  const user = await requireBuyer();
  // 回答期限を過ぎた返事待ちは、期限切れにしてから表示する
  await expireOverdue(prisma);
  // 自分の注文だけを読む（他人の注文は見えない）
  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { vegetable: true, producer: { select: { name: true, profile: { select: { pickupPlace: true } } } } } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/buyer/search" className="rounded-xl bg-leaf px-4 py-3 text-center font-bold text-white">
        仕入れ候補を探す
      </Link>
      {orders.length === 0 && <p className="text-muted">まだ注文はありません。</p>}
      <ul className="flex flex-col gap-3">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-bold">{o.listing.vegetable}</p>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${o.status === "confirmed" ? "bg-leaf text-white" : "bg-leaf-soft text-leaf"}`}>
                {orderStatusLabel[o.status]}
              </span>
            </div>
            <p className="text-sm text-muted">{o.listing.producer.name}</p>
            <p className="text-sm">
              {gramsToKgText(o.quantityG)}kg・{methodLabel[o.method]}・納品 {formatDate(o.deliveryDate)}
            </p>
            <p className="text-sm">
              商品代 {o.itemYen.toLocaleString()}円 ＋ 送料 {o.shippingYen.toLocaleString()}円 ＝ <strong>{o.totalYen.toLocaleString()}円</strong>
            </p>
            {/* 農家さんからの条件変更の提案 */}
            {o.status === "change_pending" && o.proposedDeliveryDate && o.proposedQuantityG !== null && o.proposedTotalYen !== null && (
              <div className="rounded-xl bg-leaf-soft p-3 text-sm">
                <p className="font-bold">農家さんから、条件の変更の提案が届きました</p>
                <p>
                  納品日 {formatDate(o.deliveryDate)} → <strong>{formatDate(o.proposedDeliveryDate)}</strong>
                </p>
                <p>
                  数量 {gramsToKgText(o.quantityG)}kg → <strong>{gramsToKgText(o.proposedQuantityG)}kg</strong>
                </p>
                <p>
                  合計 {o.totalYen.toLocaleString()}円 → <strong>{o.proposedTotalYen.toLocaleString()}円</strong>
                </p>
                <p className="mt-1">
                  ※ 断った場合は、{o.confirmIfRefused ? `元の条件（${formatDate(o.deliveryDate)}・${gramsToKgText(o.quantityG)}kg）で届きます` : "この購入希望は見送りになります"}
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
    </div>
  );
}
