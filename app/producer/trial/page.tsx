// 生産者のお試し（第2版 4-3）。「申し込み」と「お試し食材」を、上の項目で切り替える
import Link from "next/link";
import { Suspense } from "react";
import { closeTrialItem } from "@/app/actions/trial";
import { ProducerOrderCard } from "@/app/producer/orders/order-card";
import { AuthShell } from "@/app/ui/auth-shell";
import { expireOverdue, usedAmounts } from "@/lib/availability";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { unreadCounts } from "@/lib/messages";
import { checksFor } from "@/lib/order-check-facts";
import { prisma } from "@/lib/prisma";
import { requireProducer } from "@/lib/session";
import { Loading } from "@/app/ui/loading";

export default function ProducerTrialPage(props: PageProps<"/producer/trial">) {
  return (
    <AuthShell title="お試し" wide>
      <Suspense fallback={<Loading />}>
        <Trial {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Trial({ searchParams }: PageProps<"/producer/trial">) {
  const user = await requireProducer();
  const { tab } = await searchParams;
  const current = tab === "items" ? "items" : "requests";
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="申し込みとお試し食材の切り替え" className="card flex gap-2 rounded-full p-1 md:w-fit">
        {[
          { key: "requests", label: "申し込み", href: "/producer/trial" },
          { key: "items", label: "お試し食材", href: "/producer/trial?tab=items" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={current === t.key ? "page" : undefined}
            className={`flex-1 rounded-full px-6 py-2 text-center font-bold md:flex-none ${current === t.key ? "bg-earth text-white" : "text-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {current === "items" ? <TrialItems producerId={user.id} /> : <TrialRequests producerId={user.id} />}
    </div>
  );
}

// 届いたお試しの申し込み（返事待ち・条件変更の確認待ち・販売確定）。納品日の近い順
// 承認・見送り・条件の変更は、ふつうの申し込みと同じ流れ（第2版：新しい流れを作らない）
async function TrialRequests({ producerId }: { producerId: string }) {
  await expireOverdue(prisma);
  // 自分のお試し食材への申し込みだけを読む（他人の注文は見えない）
  const orders = await prisma.order.findMany({
    where: { isTrial: true, listing: { producerId }, status: { in: ["pending", "change_pending", "confirmed"] } },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    include: {
      listing: { select: { vegetable: true } },
      buyer: { select: { name: true, buyerProfile: { select: { prefecture: true, city: true, address: true } } } },
    },
  });
  const unread = await unreadCounts(producerId, orders.map((o) => ({ id: o.id, readAt: o.producerReadAt })));
  // 返事待ちの申し込みの確認ポイント（ふつうの申し込みと同じ）
  const checks = new Map<string, string[]>();
  for (const o of orders.filter((x) => x.status === "pending")) {
    const found = await checksFor(producerId, o.id);
    if (found) checks.set(o.id, found.checks);
  }
  const waiting = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="flex flex-col gap-3">
      {orders.length === 0 ? (
        <p className="text-muted">お試しの申し込みは、まだ届いていません。</p>
      ) : (
        <p className="text-sm text-muted">返事待ち {waiting}件。注文管理の「1日の出荷件数」には、お試しの申し込みも数えています。</p>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {orders.map((o) => (
          <ProducerOrderCard key={o.id} order={o} unread={unread.get(o.id) ?? 0} checks={checks.get(o.id) ?? []} />
        ))}
      </div>
    </div>
  );
}

// 自分のお試し食材の一覧
async function TrialItems({ producerId }: { producerId: string }) {
  const items = await prisma.listing.findMany({ where: { producerId, isTrial: true }, orderBy: { createdAt: "desc" } });
  await expireOverdue(prisma, items.map((i) => i.id));
  const used = await usedAmounts(prisma, items.map((i) => i.id));
  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/trial/new" className="btn btn-earth md:w-fit md:px-8">
        お試し食材を登録する
      </Link>
      {items.length === 0 && <p className="text-muted">まだお試し食材はありません。まだ買ったことがないお店に、少しだけ試してもらえます。</p>}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((i) => {
          const u = used.get(i.id)!;
          const accepting = i.status === "open" && i.acceptUntil > now;
          const restG = Math.max(i.totalG - u.confirmedG - u.reservedG, 0);
          return (
            <li key={i.id} className="flex flex-col gap-1 card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                {/* 食材名・説明は利用者が入力したものなので、テキストとしてそのまま表示する */}
                <p className="text-lg font-bold">{i.vegetable}</p>
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${accepting ? "bg-leaf-soft text-leaf" : "bg-line text-muted"}`}>{accepting ? "受付中" : "受付終了"}</span>
              </div>
              {/* 値段は大きく、色を変えて目立たせる */}
              <p className="flex items-baseline gap-1">
                <span className="text-muted">{i.unitG}g あたり</span>
                <span className="text-2xl font-bold text-earth">{i.unitPriceYen.toLocaleString()}円</span>
                <span className="ml-auto rounded-full bg-earth-soft px-2 py-0.5 text-xs font-medium text-earth">{i.quality === "normal" ? "通常品" : "規格外"}</span>
              </p>
              <p className="whitespace-pre-wrap text-muted">{i.note}</p>
              {/* 残りの量も大きめに出し、内訳は小さく添える */}
              <p className="mt-1">
                残り <span className="text-lg font-bold">{restG.toLocaleString()}g</span>
                <span className="text-muted"> ／ 出せる量 {i.totalG.toLocaleString()}g</span>
              </p>
              <p className="text-xs text-muted">
                確定 {u.confirmedG.toLocaleString()}g・仮押さえ {u.reservedG.toLocaleString()}g
              </p>
              <p className="text-muted">
                届けられる日 〜{formatDate(i.deliverTo)}／受付 {formatJstDateTime(i.acceptUntil)} まで／返事は申し込みから {i.trialAnswerDays}日以内
              </p>
              {accepting && (
                <form action={closeTrialItem} className="mt-2">
                  <input type="hidden" name="listingId" value={i.id} />
                  <button type="submit" className="w-full btn btn-sm btn-plain">
                    受付を終える（削除）
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
