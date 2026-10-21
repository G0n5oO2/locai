// 購入希望を送る画面（飲食店だけが使える）
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { ShippingInfo } from "@/app/ui/shipping-info";
import type { DeliveryMethod } from "@/lib/burden";
import { formatJstDateTime, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { feesForForm, selfDeliveryAllowed } from "@/lib/pricing";
import { farmShopKm } from "@/lib/region";
import { requireBuyer } from "@/lib/session";
import { PriceBox, QualityTags } from "@/app/ui/price-box";
import { OrderForm } from "./order-form";
import { Loading } from "@/app/ui/loading";

export default function OrderPage(props: PageProps<"/buyer/listings/[id]">) {
  return (
    <AuthShell title="購入希望を送る">
      <Suspense fallback={<Loading />}>
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
  // 畑からお店までの、だいたいの距離（市区町村の代表地点どうし）。宅配の距離の料金と、自分で配達できるかに使う
  const km = farmShopKm(profile, buyerProfile) ?? 0;
  // 自分で配達は、農家さんが決めた距離より遠いお店では、自動で選べなくする（第2版）
  const selfBlocked = listing.offersSelf && !selfDeliveryAllowed(profile, km);
  const methods = (["delivery", "self", "pickup"] as DeliveryMethod[]).filter(
    (m) => ({ delivery: listing.offersDelivery, self: listing.offersSelf && !selfBlocked, pickup: listing.offersPickup })[m],
  );


  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 card p-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
            <p className="text-xl font-bold">{listing.vegetable}</p>
            <QualityTags quality={listing.quality} surplus={listing.surplus} />
          </div>
          <p className="text-sm text-muted">
            {listing.producer.name}・{profile.prefecture} {profile.city}
          </p>
        </div>
        {/* 値段は大きく、茶色の囲みで目立たせる */}
        <PriceBox unitG={listing.unitG} unitPriceYen={listing.unitPriceYen} />
        {/* 品の状態の説明（規格外のときは特に大事）。利用者が入力した文字は、テキストとしてそのまま表示する */}
        {listing.note && <p className="text-sm whitespace-pre-wrap">状態：{listing.note}</p>}
        <p className="text-sm text-muted">
          受付 {formatJstDateTime(listing.acceptUntil)} まで／農家さんの回答 {formatJstDateTime(listing.answerUntil)} まで
        </p>
      </div>
      {/* 送料のきまり（距離と重さ）と、お店までの距離 */}
      <ShippingInfo profile={profile} km={km} selfBlocked={selfBlocked} offersDelivery={listing.offersDelivery} />
      {/* 選べる受け取り方法がない（農家さんの配達の範囲の外で、ほかの方法がない）ときは、申し込めない */}
      {methods.length === 0 ? (
        <p className="card p-4 text-sm">このお店の場所には、この農家さんが届けられる方法がありません。</p>
      ) : (
        <OrderForm
          listingId={listing.id}
          // 画面を開くたびに新しい目印を作る（同じ画面から何回送っても1件にまとまる）
          requestKey={randomUUID()}
          price={{ unitG: listing.unitG, unitPriceYen: listing.unitPriceYen, minOrderG: listing.minOrderG }}
          // 引き取りの場所は、販売確定するまで見せない（不変条件4）。引き取りできるかだけを伝える
          fees={feesForForm(profile)}
          km={km}
          methods={methods}
          earliest={earliest.toISOString().slice(0, 10)}
          latest={listing.deliverTo.toISOString().slice(0, 10)}
          initial={{ quantity: text("quantity"), method: text("method"), useDate: text("useDate") }}
          payments={profile.paymentMethods}
        />
      )}
    </div>
  );
}
