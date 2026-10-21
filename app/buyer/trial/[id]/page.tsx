// お試し食材の詳しい内容と、お試し希望の入力（第2版 4-4「お試し」）
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { ShippingInfo } from "@/app/ui/shipping-info";
import type { DeliveryMethod } from "@/lib/burden";
import { formatDate, formatJstDateTime, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { feesForForm, selfDeliveryAllowed } from "@/lib/pricing";
import { farmShopKm } from "@/lib/region";
import { requireBuyer } from "@/lib/session";
import { trialItemsFor } from "@/lib/trial-items";
import { TrialOrderForm } from "./trial-order-form";
import { Loading } from "@/app/ui/loading";

export default function TrialDetailPage(props: PageProps<"/buyer/trial/[id]">) {
  return (
    <AuthShell title="お試しを申し込む">
      <Suspense fallback={<Loading />}>
        <TrialDetail {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function TrialDetail({ params }: PageProps<"/buyer/trial/[id]">) {
  const user = await requireBuyer();
  const buyerProfile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!buyerProfile) redirect("/buyer/profile");
  const { id } = await params;
  // お試しの一覧に出るもの（受付中・近い・残りがある・まだ買ったことがない野菜）だけを開ける
  const found = (await trialItemsFor(user.id, buyerProfile.prefecture, buyerProfile.city, id))[0];
  if (!found) notFound();
  const { item, profile, restG } = found;

  // 届けてほしい日：返事の日数がたってから、収穫できる最後の日まで
  const today = parseDate(jstDateText(new Date()))!;
  const ready = new Date(today.getTime() + (item.trialAnswerDays ?? 1) * 86_400_000);
  const earliest = ready > item.deliverFrom ? ready : item.deliverFrom;
  // 畑からお店までの、だいたいの距離（市区町村の代表地点どうし）。宅配の距離の料金と、自分で配達できるかに使う
  const km = farmShopKm(profile, buyerProfile) ?? 0;
  // 自分で配達は、農家さんが決めた距離より遠いお店では、自動で選べなくする（第2版）
  const selfBlocked = item.offersSelf && !selfDeliveryAllowed(profile, km);
  const methods = (["delivery", "self", "pickup"] as DeliveryMethod[]).filter(
    (m) => ({ delivery: item.offersDelivery, self: item.offersSelf && !selfBlocked, pickup: item.offersPickup })[m],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 card p-4">
        <div className="flex items-center justify-between gap-2">
          {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
          <p className="text-lg font-bold">{item.vegetable}</p>
          <span className="rounded-full bg-earth-soft px-2 py-0.5 text-xs font-medium text-earth">{item.quality === "normal" ? "通常品" : "規格外"}</span>
        </div>
        <p className="text-sm text-muted">
          {item.producer.name}・{profile.prefecture} {profile.city}
        </p>
        <p className="flex items-baseline gap-1">
          <span className="text-sm text-muted">{item.unitG}g あたり</span>
          <span className="text-3xl font-bold text-leaf">{item.unitPriceYen.toLocaleString()}円</span>
        </p>
        <p className="text-sm whitespace-pre-wrap">{item.note}</p>
        <p className="text-sm text-muted">
          残り {restG.toLocaleString()}g／届けられる日 {formatDate(earliest)}〜{formatDate(item.deliverTo)}／受付 {formatJstDateTime(item.acceptUntil)} まで
        </p>
        <p className="text-sm text-muted">農家さんは、申し込みから {item.trialAnswerDays}日以内に返事をします。</p>
        <details className="text-sm">
          <summary className="cursor-pointer font-bold">農家さんのこと</summary>
          <p className="mt-2">品目：{profile.items}</p>
          <p className="mt-1 whitespace-pre-wrap">こだわり：{profile.commitment}</p>
        </details>
      </div>
      {/* 送料のきまり（距離と重さ）と、お店までの距離 */}
      <ShippingInfo profile={profile} km={km} selfBlocked={selfBlocked} offersDelivery={item.offersDelivery} />
      {/* 選べる受け取り方法がない（農家さんの配達の範囲の外で、ほかの方法がない）ときは、申し込めない */}
      {methods.length === 0 ? (
        <p className="card p-4 text-sm">このお店の場所には、この農家さんが届けられる方法がありません。</p>
      ) : (
        <TrialOrderForm
          listingId={item.id}
          // 画面を開くたびに新しい目印を作る（同じ画面から何回送っても1件にまとまる）
          requestKey={randomUUID()}
          price={{ unitG: item.unitG, unitPriceYen: item.unitPriceYen, minOrderG: item.minOrderG }}
          // 引き取りの場所は、販売確定するまで見せない（不変条件4）。引き取りできるかだけを伝える
          fees={feesForForm(profile)}
          km={km}
          methods={methods}
          restG={restG}
          earliest={earliest.toISOString().slice(0, 10)}
          latest={item.deliverTo.toISOString().slice(0, 10)}
          payments={profile.paymentMethods}
        />
      )}
    </div>
  );
}
