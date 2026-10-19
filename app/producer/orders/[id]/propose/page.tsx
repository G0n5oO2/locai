// 条件変更の提案の画面（生産者だけが使える）
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { usedAmounts } from "@/lib/availability";
import { methodLabel, type DeliveryMethod } from "@/lib/burden";
import { formatDate, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";
import { ProposeForm, type DateOption } from "./propose-form";

const day = 24 * 60 * 60 * 1000;

export default function ProposePage(props: PageProps<"/producer/orders/[id]/propose">) {
  return (
    <AuthShell title="条件の変更を提案する">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Propose {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Propose({ params }: PageProps<"/producer/orders/[id]/propose">) {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");
  const { id } = await params;

  // 自分の出品への注文だけ（他人の注文は「見つからない」）
  const order = await prisma.order.findUnique({ where: { id }, include: { listing: true, buyer: { select: { name: true } } } });
  if (!order || order.listing.producerId !== user.id) notFound();
  if (order.status !== "pending") {
    return <p>この申し込みは、いま「回答待ち」ではないので、提案できません。</p>;
  }

  const method = order.method as DeliveryMethod;
  const limit = { delivery: profile.shipLimitDelivery, self: profile.shipLimitSelf, pickup: profile.shipLimitPickup }[method];

  // ずらす先の日：使用日を見せているお店だけ。届けられる日の中で、使用日まで
  const dateOptions: DateOption[] = [];
  if (order.showUseDate) {
    const today = parseDate(jstDateText(new Date()))!;
    const from = order.listing.deliverFrom > today ? order.listing.deliverFrom : today;
    const to = order.listing.deliverTo < order.useDate ? order.listing.deliverTo : order.useDate;
    // 同じ受け渡し方法の、自分の注文（返事待ち・確定・提案中）
    const active = await prisma.order.findMany({
      where: { listing: { producerId: user.id }, method, status: { in: ["pending", "change_pending", "confirmed"] }, id: { not: order.id } },
      select: { deliveryDate: true, status: true, proposedDeliveryDate: true, dateChangeProposed: true },
    });
    for (let t = from.getTime(); t <= to.getTime(); t += day) {
      if (t === order.deliveryDate.getTime()) continue;
      // その日にもう決まっている件数と、その日に向けて返事待ちの提案（提案中）の件数
      const fixed = active.filter((o) => o.deliveryDate.getTime() === t && !(o.status === "change_pending" && o.dateChangeProposed)).length;
      const proposed = active.filter((o) => o.status === "change_pending" && o.dateChangeProposed && o.proposedDeliveryDate?.getTime() === t).length;
      const after = fixed + proposed + 1;
      dateOptions.push({
        value: new Date(t).toISOString().slice(0, 10),
        label: formatDate(new Date(t)),
        detail: `${methodLabel[method]} ${fixed}件${proposed > 0 ? `＋提案中${proposed}件` : ""} → ${after}件`,
        over: after > limit,
      });
    }
  }

  // 数量の上限：残りの量 ＋ この注文がいま押さえている量
  const used = (await usedAmounts(prisma, [order.listingId])).get(order.listingId)!;
  const maxG = order.listing.totalG - used.confirmedG - used.reservedG + Math.max(order.quantityG, order.proposedQuantityG ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-4 text-sm">
        <p className="font-bold">{order.buyer.name}</p>
        <p>
          {order.listing.vegetable} {gramsToKgText(order.quantityG)}kg・{methodLabel[method]}・納品 {formatDate(order.deliveryDate)}
        </p>
        {order.showUseDate && <p className="text-muted">お店の使用日：{formatDate(order.useDate)}</p>}
        <p className="text-muted">あなたの基準：{methodLabel[method]}は1回の出荷で{limit}件まで</p>
      </div>
      <ProposeForm
        orderId={order.id}
        currentDateLabel={formatDate(order.deliveryDate)}
        dateOptions={dateOptions}
        unitText={`${gramsToKgText(order.listing.unitG)}kg`}
        maxQuantityText={`${gramsToKgText(maxG)}kg`}
      />
    </div>
  );
}
