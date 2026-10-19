// 購入希望を送る画面（飲食店だけが使える）
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import type { DeliveryMethod } from "@/lib/burden";
import { formatJstDateTime, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";
import { OrderForm } from "./order-form";

export default function OrderPage(props: PageProps<"/buyer/listings/[id]">) {
  return (
    <AuthShell title="購入希望を送る">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Order {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Order({ params, searchParams }: PageProps<"/buyer/listings/[id]">) {
  const user = await requireBuyer();
  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!buyerProfile) redirect("/buyer/profile");

  const { id } = await params;
  const query = await searchParams;
  const text = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");

  // 受付中の出品だけを出す
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { producer: { select: { name: true, profile: true } } },
  });
  // お試し食材は、お試しの画面から申し込む
  if (!listing || listing.isTrial || listing.status !== "open" || listing.acceptUntil <= new Date() || !listing.producer.profile) notFound();
  const profile = listing.producer.profile;

  const today = parseDate(jstDateText(new Date()))!;
  const earliest = listing.deliverFrom > today ? listing.deliverFrom : today;
  const methods = (["delivery", "self", "pickup"] as DeliveryMethod[]).filter(
    (m) => ({ delivery: listing.offersDelivery, self: listing.offersSelf, pickup: listing.offersPickup })[m],
  );


  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
        {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
        <p className="text-lg font-bold">{listing.vegetable}</p>
        <p className="text-sm text-muted">
          {listing.producer.name}・{profile.prefecture} {profile.city}
        </p>
        <p className="text-sm">
          {gramsToKgText(listing.unitG)}kg あたり {listing.unitPriceYen.toLocaleString()}円・{listing.quality === "normal" ? "通常品" : "規格外"}
          {listing.surplus && "・余剰品"}
        </p>
        {/* 品の状態の説明（規格外のときは特に大事）。利用者が入力した文字は、テキストとしてそのまま表示する */}
        {listing.note && <p className="text-sm whitespace-pre-wrap">状態：{listing.note}</p>}
        <p className="text-sm text-muted">
          受付 {formatJstDateTime(listing.acceptUntil)} まで／農家さんの回答 {formatJstDateTime(listing.answerUntil)} まで
        </p>
      </div>
      <OrderForm
        listingId={listing.id}
        // 画面を開くたびに新しい目印を作る（同じ画面から何回送っても1件にまとまる）
        requestKey={randomUUID()}
        price={{ unitG: listing.unitG, unitPriceYen: listing.unitPriceYen, minOrderG: listing.minOrderG }}
        fees={{
          deliveryBand1MaxG: profile.deliveryBand1MaxG,
          deliveryBand1Yen: profile.deliveryBand1Yen,
          deliveryBand2MaxG: profile.deliveryBand2MaxG,
          deliveryBand2Yen: profile.deliveryBand2Yen,
          deliveryBand3MaxG: profile.deliveryBand3MaxG,
          deliveryBand3Yen: profile.deliveryBand3Yen,
          selfDeliveryYen: profile.selfDeliveryYen,
          // 引き取りの場所は、販売確定するまで見せない（不変条件4）。引き取りできるかだけを伝える
          pickupPlace: profile.pickupPlace === null ? null : "",
        }}
        methods={methods}
        earliest={earliest.toISOString().slice(0, 10)}
        latest={listing.deliverTo.toISOString().slice(0, 10)}
        initial={{ quantity: text("quantity"), method: text("method"), useDate: text("useDate") }}
        payments={profile.paymentMethods}
      />
    </div>
  );
}
