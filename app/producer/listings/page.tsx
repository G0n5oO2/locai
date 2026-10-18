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

export default function ListingsPage() {
  return (
    <AuthShell title="出品一覧" wide>
      <ListingTabs current="listings" />
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Listings />
      </Suspense>
    </AuthShell>
  );
}

async function Listings() {
  const user = await requireProducer();
  // 自分の出品だけを読む（他人の出品は見えない）
  const listings = await prisma.listing.findMany({
    where: { producerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { notices: { select: { buyerId: true } } },
  });

  // 売れ残りのパネルのための材料（残りの量・近くの「探しています」・まだ知らせていないお店の数）
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

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/listings/new" className="rounded-xl bg-earth px-4 py-3 md:w-fit md:px-8 text-center font-bold text-white">
        新しく出品する
      </Link>
      {listings.length === 0 && <p className="text-muted">まだ出品はありません。</p>}
      {/* パソコンの幅では、カードを横に並べる */}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
              <p className="text-lg font-bold">{l.vegetable}</p>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${l.status === "open" && l.acceptUntil > now ? "bg-leaf-soft text-leaf" : "bg-line text-muted"}`}>
                {l.status === "closed" ? "受付終了" : l.acceptUntil > now ? "受付中" : "受付期限切れ"}
              </span>
            </div>
            <p className="text-sm">
              {gramsToKgText(l.totalG)}kg・{gramsToKgText(l.unitG)}kg あたり {l.unitPriceYen.toLocaleString()}円・最低 {gramsToKgText(l.minOrderG)}kg
            </p>
            <p className="text-sm text-muted">
              {l.quality === "normal" ? "通常品" : "規格外"}
              {l.surplus && "・余剰品"}
            </p>
            <p className="text-sm text-muted">
              受付 {formatJstDateTime(l.acceptUntil)} まで／回答 {formatJstDateTime(l.answerUntil)} まで
            </p>
            <p className="text-sm text-muted">
              納品 {formatDate(l.deliverFrom)}〜{formatDate(l.deliverTo)}
            </p>
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
        ))}
      </ul>
    </div>
  );
}
