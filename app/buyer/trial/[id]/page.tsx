// お試し食材の詳しい内容と、お試し希望の入力（第2版 4-4「お試し」）
import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import type { DeliveryMethod } from "@/lib/burden";
import { formatDate, formatJstDateTime, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { trialItemsFor } from "@/lib/trial-items";
import { TrialOrderForm } from "./trial-order-form";

export default function TrialDetailPage(props: PageProps<"/buyer/trial/[id]">) {
  return (
    <AuthShell title="お試しを申し込む">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
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
  const methods = (["delivery", "self", "pickup"] as DeliveryMethod[]).filter(
    (m) => ({ delivery: item.offersDelivery, self: item.offersSelf, pickup: item.offersPickup })[m],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
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
      <TrialOrderForm
        listingId={item.id}
        // 画面を開くたびに新しい目印を作る（同じ画面から何回送っても1件にまとまる）
        requestKey={randomUUID()}
        price={{ unitG: item.unitG, unitPriceYen: item.unitPriceYen, minOrderG: item.minOrderG }}
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
        restG={restG}
        earliest={earliest.toISOString().slice(0, 10)}
        latest={item.deliverTo.toISOString().slice(0, 10)}
        payments={profile.paymentMethods}
      />
    </div>
  );
}
