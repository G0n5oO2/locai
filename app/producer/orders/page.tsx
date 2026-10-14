// 申し込みの一覧（生産者だけが使える）
// 納品日ごとにまとめて、その日の件数を受け渡し方法ごとの基準と比べる（docs/04_producer_design.md 2章）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { expireOverdue } from "@/lib/availability";
import { methodLabel, type DeliveryMethod } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";
import { OrderButtons } from "./order-buttons";

export default function ProducerOrdersPage() {
  return (
    <AuthShell title="申し込みの一覧">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <ProducerOrders />
      </Suspense>
    </AuthShell>
  );
}

async function ProducerOrders() {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");

  // 回答期限を過ぎた返事待ちは、期限切れにしてから表示する
  await expireOverdue(prisma);

  // 自分の出品への注文だけを読む（他人の注文は見えない）
  const orders = await prisma.order.findMany({
    where: { listing: { producerId: user.id }, status: { in: ["pending", "change_pending", "confirmed"] } },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    include: {
      listing: { select: { vegetable: true } },
      buyer: { select: { name: true, buyerProfile: { select: { prefecture: true, city: true, address: true } } } },
    },
  });

  // 受付中の出品ごとの集計（販売可能／購入希望／全件承認した場合の残量）
  const listings = await prisma.listing.findMany({
    where: { producerId: user.id, status: "open" },
    orderBy: { createdAt: "desc" },
    include: { orders: { where: { status: { in: ["pending", "change_pending", "confirmed"] } }, select: { status: true, quantityG: true } } },
  });

  // 納品日ごとにまとめる
  const days = new Map<string, typeof orders>();
  for (const o of orders) {
    const key = o.deliveryDate.toISOString().slice(0, 10);
    days.set(key, [...(days.get(key) ?? []), o]);
  }
  const limitOf: Record<DeliveryMethod, number> = {
    delivery: profile.shipLimitDelivery,
    self: profile.shipLimitSelf,
    pickup: profile.shipLimitPickup,
  };

  return (
    <div className="flex flex-col gap-6">
      {listings.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">受付中の出品</h2>
          {listings.map((l) => {
            const requested = l.orders.filter((o) => o.status !== "confirmed");
            const requestedG = requested.reduce((sum, o) => sum + o.quantityG, 0);
            const confirmedG = l.orders.filter((o) => o.status === "confirmed").reduce((sum, o) => sum + o.quantityG, 0);
            return (
              <div key={l.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                <p className="font-bold">{l.vegetable}</p>
                <p>
                  販売可能 {gramsToKgText(l.totalG)}kg／購入希望 {gramsToKgText(requestedG)}kg・{requested.length}件／販売確定 {gramsToKgText(confirmedG)}kg
                </p>
                <p className="text-muted">全件承認した場合の残量 {gramsToKgText(l.totalG - confirmedG - requestedG)}kg</p>
              </div>
            );
          })}
        </section>
      )}

      {days.size === 0 && <p className="text-muted">返事待ち・販売確定の申し込みは、まだありません。</p>}

      {[...days.entries()].map(([day, list]) => {
        // その日の件数を、受け渡し方法ごとに数えて、基準と比べる
        const counts = (["delivery", "self", "pickup"] as DeliveryMethod[])
          .map((m) => ({ method: m, count: list.filter((o) => o.method === m).length }))
          .filter((c) => c.count > 0);
        return (
          <section key={day} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold">{formatDate(new Date(day))} の納品</h2>
              {counts.map(({ method, count }) => {
                const over = count - limitOf[method];
                return (
                  <p key={method} className={`text-sm ${over > 0 ? "font-bold text-red-700 dark:text-red-400" : "text-muted"}`}>
                    {methodLabel[method]} {count}件（あなたの基準：{limitOf[method]}件まで）{over > 0 && ` → ${over}件超えています`}
                  </p>
                );
              })}
            </div>
            {list.map((o) => (
              <article key={o.id} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  {/* お店の名前は、申し込んだ相手にだけ見える */}
                  <p className="font-bold">{o.buyer.name}</p>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${o.status === "confirmed" ? "bg-earth text-white" : "bg-earth-soft text-earth"}`}>
                    {orderStatusLabel[o.status]}
                  </span>
                </div>
                <p>
                  {o.listing.vegetable} {gramsToKgText(o.quantityG)}kg・{methodLabel[o.method]}
                  {o.isTrial && "・お試し"}
                </p>
                <p>
                  商品代 {o.itemYen.toLocaleString()}円／送料・配達料 {o.shippingYen.toLocaleString()}円
                </p>
                {/* 使用日は、お店が見せてよいとしたときだけ */}
                {o.showUseDate && <p className="text-muted">お店の使用日：{formatDate(o.useDate)}</p>}
                {o.buyer.buyerProfile && <p className="text-muted">お店の地域：{o.buyer.buyerProfile.prefecture} {o.buyer.buyerProfile.city}</p>}
                {/* 届け先の住所は、販売確定した注文にだけ見せる（不変条件4） */}
                {o.status === "confirmed" && o.method !== "pickup" && o.buyer.buyerProfile && (
                  <p>届け先：{o.buyer.buyerProfile.address}</p>
                )}
                {o.status === "pending" && (
                  <>
                    <p className="text-muted">回答期限：{formatJstDateTime(o.answerUntil)}</p>
                    <OrderButtons orderId={o.id} />
                  </>
                )}
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
