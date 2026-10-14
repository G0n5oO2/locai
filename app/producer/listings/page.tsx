// 自分の出品の一覧（生産者だけが使える）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";

export default function ListingsPage() {
  return (
    <AuthShell title="出品一覧">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Listings />
      </Suspense>
    </AuthShell>
  );
}

async function Listings() {
  const user = await requireProducer();
  // 自分の出品だけを読む（他人の出品は見えない）
  const listings = await prisma.listing.findMany({ where: { producerId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/listings/new" className="rounded-xl bg-earth px-4 py-3 text-center font-bold text-white">
        新しく出品する
      </Link>
      {listings.length === 0 && <p className="text-muted">まだ出品はありません。</p>}
      <ul className="flex flex-col gap-3">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
              <p className="text-lg font-bold">{l.vegetable}</p>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${l.status === "open" ? "bg-leaf-soft text-leaf" : "bg-line text-muted"}`}>
                {l.status === "open" ? "受付中" : "受付終了"}
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
          </li>
        ))}
      </ul>
    </div>
  );
}
