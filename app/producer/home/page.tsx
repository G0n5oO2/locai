// 生産者のホーム（第2版 4-3）
// 出品ごとに、出品した量・確定した量・仮押さえの量・申し込み可能な量を、棒グラフと数字でひと目で分かるようにする
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { expireOverdue, usedAmounts } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";

export default function ProducerHomePage() {
  return (
    <AuthShell title="ホーム" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Amounts />
      </Suspense>
    </AuthShell>
  );
}

async function Amounts() {
  const user = await requireProducer();
  // 回答期限を過ぎた返事待ちは、期限切れにして仮押さえを外してから数える
  const mine = await prisma.listing.findMany({ where: { producerId: user.id }, select: { id: true } });
  await expireOverdue(prisma, mine.map((l) => l.id));

  const now = new Date();
  // 出すのは、受付中の出品と、返事待ちの申し込みが残っている出品（自分の出品だけ）
  const listings = await prisma.listing.findMany({
    where: {
      producerId: user.id,
      OR: [{ status: "open", acceptUntil: { gt: now } }, { orders: { some: { status: { in: ["pending", "change_pending"] } } } }],
    },
    orderBy: { acceptUntil: "asc" },
  });
  const used = await usedAmounts(prisma, listings.map((l) => l.id));

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/listings/new" className="rounded-xl bg-earth px-4 py-3 text-center font-bold text-white md:w-fit md:px-8">
        新しく出品する
      </Link>
      {listings.length === 0 && <p className="text-muted">今、受付中の出品や返事待ちの申し込みはありません。</p>}
      {/* パソコンの幅では、カードを横に並べる */}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => {
          const u = used.get(l.id)!;
          const accepting = l.status === "open" && l.acceptUntil > now;
          // 残りの量 ＝ 出品した量 − 確定した量 − 仮押さえの量（g の整数で計算する）
          const restG = Math.max(l.totalG - u.confirmedG - u.reservedG, 0);
          return (
            <li key={l.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
                <p className="text-lg font-bold">{l.vegetable}</p>
                <p className="text-sm text-muted">出品 {gramsToKgText(l.totalG)}kg</p>
              </div>
              <AmountBar totalG={l.totalG} confirmedG={u.confirmedG} reservedG={u.reservedG} />
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <Amount color="bg-leaf" label="確定" grams={u.confirmedG} />
                <Amount color="bg-earth" label="仮押さえ" grams={u.reservedG} />
                {/* 受付が終わった出品は、もう申し込めないので「残り」と書く */}
                <Amount color="bg-line" label={accepting ? "申し込み可能" : "残り（受付終了）"} grams={restG} />
              </dl>
              {u.requestCount > 0 && (
                <Link href="/producer/orders" className="text-sm font-bold text-earth underline">
                  返事待ちの申し込み {u.requestCount}件を見る
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// 1本の棒を、確定・仮押さえ・残りの色に分けたグラフ（数字は下の Amount に書くので、読み上げでは飛ばす）
function AmountBar({ totalG, confirmedG, reservedG }: { totalG: number; confirmedG: number; reservedG: number }) {
  const percent = (g: number) => (totalG > 0 ? (g / totalG) * 100 : 0);
  return (
    <div aria-hidden className="flex h-4 overflow-hidden rounded-full bg-line">
      <div className="bg-leaf" style={{ width: `${percent(confirmedG)}%` }} />
      <div className="bg-earth" style={{ width: `${percent(reservedG)}%` }} />
    </div>
  );
}

function Amount({ color, label, grams }: { color: string; label: string; grams: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1 text-xs text-muted">
        <span aria-hidden className={`size-2.5 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className="font-bold">{gramsToKgText(grams)}kg</dd>
    </div>
  );
}
