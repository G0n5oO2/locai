// 自分の出品の一覧（生産者だけが使える）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { ListingTabs } from "../listing-tabs";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { expireOverdue, usedAmounts } from "@/lib/availability";
import { requireProducer } from "@/lib/session";
import { matchingBuyerIds, nearWanted } from "@/lib/wanted";
import { LeftoverPanel } from "./leftover-panel";
import { Loading } from "@/app/ui/loading";

export default function ListingsPage(props: PageProps<"/producer/listings">) {
  return (
    <AuthShell title="出品一覧" wide>
      <ListingTabs current="listings" />
      <Suspense fallback={<Loading />}>
        <Listings {...props} />
      </Suspense>
    </AuthShell>
  );
}

// 出品の状態ごとの切り替え（第2版：受付中・受付期限切れ・受付終了が混ざらないように分ける）
const groups = [
  { key: "open", label: "受付中" },
  { key: "expired", label: "受付期限切れ" },
  { key: "closed", label: "受付終了" },
] as const;
type GroupKey = (typeof groups)[number]["key"];

async function Listings({ searchParams }: PageProps<"/producer/listings">) {
  const user = await requireProducer();
  const { status } = await searchParams;
  const current: GroupKey = groups.some((g) => g.key === status) ? (status as GroupKey) : "open";
  // 自分の出品だけを読む（他人の出品は見えない）
  const listings = await prisma.listing.findMany({
    where: { producerId: user.id, isTrial: false }, // お試し食材は、お試しのタブで見る
    orderBy: { createdAt: "desc" },
    include: { notices: { select: { buyerId: true } } },
  });

  // 売れ残りのパネルのための材料（残りの量・「探しています」・まだ知らせていないお店の数）
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  await expireOverdue(prisma, listings.map((l) => l.id));
  const used = await usedAmounts(prisma, listings.map((l) => l.id));
  const wanted = profile ? await nearWanted(profile) : [];
  const now = new Date();
  const panels = new Map<string, { remainingG: number; expired: boolean; newCount: number }>();
  for (const l of listings) {
    const u = used.get(l.id)!;
    const remainingG = l.totalG - u.confirmedG - u.reservedG;
    const expired = l.acceptUntil <= now;
    // 受付中のまま期限を過ぎて残っている出品（売れ残り）と、一度知らせた出品にだけパネルを出す
    if (l.status !== "open" || remainingG < l.minOrderG || !profile || (!expired && l.notices.length === 0)) continue;
    const notified = new Set(l.notices.map((n) => n.buyerId));
    const matched = await matchingBuyerIds(profile, l.vegetable);
    panels.set(l.id, { remainingG, expired, newCount: matched.filter((id) => !notified.has(id)).length });
  }

  // どの切り替えに入る出品か
  const groupOf = (l: (typeof listings)[number]): GroupKey => (l.status === "closed" ? "closed" : l.acceptUntil > now ? "open" : "expired");
  const shown = listings.filter((l) => groupOf(l) === current);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/listings/new" className="btn btn-earth md:w-fit md:px-8">
        新しく出品する
      </Link>
      {/* 状態の切り替え（スマホでは、横にスクロールできる） */}
      <nav aria-label="出品の状態の切り替え" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {groups.map((g) => {
          const count = listings.filter((l) => groupOf(l) === g.key).length;
          const active = current === g.key;
          return (
              <Link
                key={g.key}
                href={g.key === "open" ? "/producer/listings" : `/producer/listings?status=${g.key}`}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-earth text-white" : "card text-muted"}`}
              >
                {g.label}
                <span className={`rounded-full px-2 text-xs ${active ? "bg-white/25" : "bg-earth-soft text-earth"}`}>{count}</span>
              </Link>
          );
        })}
      </nav>
      {shown.length === 0 && (
        <p className="text-muted">{current === "open" ? "受付中の出品はありません。" : current === "expired" ? "受付期限が過ぎた出品はありません。" : "受付を終えた出品はありません。"}</p>
      )}
      {/* パソコンの幅では、カードを横に並べる */}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {shown.map((l) => {
          const u = used.get(l.id)!;
          const restG = Math.max(l.totalG - u.confirmedG - u.reservedG, 0);
          const group = groupOf(l);
          return (
          <li key={l.id} className="flex flex-col gap-3 card p-4">
            {/* いちばん上：食材名（大きく）と、状態・品の状態のラベル */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
              <p className="mr-auto text-xl font-bold">{l.vegetable}</p>
              <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${group === "open" ? "bg-leaf text-white" : group === "expired" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-line text-muted"}`}>
                {groups.find((g) => g.key === group)!.label}
              </span>
              <span className="rounded-full bg-earth-soft px-3 py-0.5 text-xs font-bold text-earth">{l.quality === "normal" ? "通常品" : "規格外"}</span>
              {l.surplus && <span className="rounded-full bg-earth-soft px-3 py-0.5 text-xs font-bold text-earth">余剰品</span>}
            </div>
            {/* 値段（大きく、色を変える）と、残りの量 */}
            <div className="flex items-end justify-between gap-3">
              <p className="flex items-baseline gap-1">
                <span className="text-sm text-muted">{gramsToKgText(l.unitG)}kg あたり</span>
                <span className="text-3xl font-bold text-earth">{l.unitPriceYen.toLocaleString()}円</span>
              </p>
              <p className="text-right">
                <span className="block text-xs text-muted">残り</span>
                <span className="text-xl font-bold">{gramsToKgText(restG)}kg</span>
                <span className="text-xs text-muted"> ／ {gramsToKgText(l.totalG)}kg</span>
              </p>
            </div>
            {/* こまかい情報（見出しは小さくうすく、中身ははっきり） */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-background p-3 text-sm">
              <div>
                <dt className="text-xs text-muted">最低注文量</dt>
                <dd className="font-bold">{gramsToKgText(l.minOrderG)}kg</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">確定／仮押さえ</dt>
                <dd className="font-bold">
                  {gramsToKgText(u.confirmedG)}kg／{gramsToKgText(u.reservedG)}kg
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">受付期限</dt>
                <dd className="font-bold">{formatJstDateTime(l.acceptUntil)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">回答期限</dt>
                <dd className="font-bold">{formatJstDateTime(l.answerUntil)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted">納品できる日</dt>
                <dd className="font-bold">
                  {formatDate(l.deliverFrom)}〜{formatDate(l.deliverTo)}
                </dd>
              </div>
            </dl>
            {panels.has(l.id) && (
              <LeftoverPanel
                listingId={l.id}
                vegetable={l.vegetable}
                remainingG={panels.get(l.id)!.remainingG}
                expired={panels.get(l.id)!.expired}
                wanted={wanted}
                notifiedCount={l.notices.length}
                newCount={panels.get(l.id)!.newCount}
              />
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
