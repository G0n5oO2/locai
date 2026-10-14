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
    include: { listing: { select: { vegetable: true, producer: { select: { name: true } } } } },
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
            {(o.status === "pending" || o.status === "change_pending") && (
              <p className="text-xs text-muted">農家さんの回答期限：{formatJstDateTime(o.answerUntil)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
