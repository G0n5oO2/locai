// 生産者のホーム（第2版 4-3）
// 野菜ごとに、出品した量・確定した量・仮押さえの量・申し込み可能な量を、棒グラフと数字でひと目で分かるようにする
// お試し食材は、同じ野菜のカードの中に別の色の棒で出す
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { FarmBackdrop, FarmBanner } from "@/app/ui/farm-map";
import { quantityText } from "@/app/ui/order-amount";
import { expireOverdue, usedAmounts } from "@/lib/availability";
import { prisma } from "@/lib/prisma";
import { requireProducer } from "@/lib/session";

export default function ProducerHomePage() {
  return (
    <AuthShell title="ホーム" wide>
      {/* 上に横長の農園の絵、その下はうすい農園の背景（第2版 4-1） */}
      <FarmBackdrop />
      <FarmBanner />
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

  // 野菜ごとにまとめる（第2版）。同じ野菜の出品は量を足し合わせ、ふつうの出品とお試し食材は別の棒にする
  const groups = new Map<string, { vegetable: string; normal: Totals; trial: Totals }>();
  for (const l of listings) {
    const u = used.get(l.id)!;
    const g = groups.get(l.vegetable) ?? { vegetable: l.vegetable, normal: emptyTotals(), trial: emptyTotals() };
    const t = l.isTrial ? g.trial : g.normal;
    // 残りの量 ＝ 出品した量 − 確定した量 − 仮押さえの量（g の整数で計算する）
    const restG = Math.max(l.totalG - u.confirmedG - u.reservedG, 0);
    const accepting = l.status === "open" && l.acceptUntil > now;
    t.count += 1;
    t.totalG += l.totalG;
    t.confirmedG += u.confirmedG;
    t.reservedG += u.reservedG;
    // 受付中の出品の残りは「申し込み可能」、受付が終わった出品の残りは「受付終了の残り」として分ける
    if (accepting) t.availableG += restG;
    else t.closedRestG += restG;
    t.requestCount += u.requestCount;
    groups.set(l.vegetable, g);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/producer/listings/new" className="btn btn-earth md:w-fit md:px-8">
        新しく出品する
      </Link>
      {groups.size === 0 && <p className="text-muted">今、受付中の出品や返事待ちの申し込みはありません。</p>}
      {/* パソコンの幅では、カードを横に並べる */}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[...groups.values()].map((g) => (
          <li key={g.vegetable} className="flex flex-col gap-4 card p-4">
            {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
            <p className="text-lg font-bold">{g.vegetable}</p>
            {g.normal.count > 0 && <AmountBlock kind="normal" totals={g.normal} />}
            {g.trial.count > 0 && <AmountBlock kind="trial" totals={g.trial} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

type Totals = { count: number; totalG: number; confirmedG: number; reservedG: number; availableG: number; closedRestG: number; requestCount: number };
const emptyTotals = (): Totals => ({ count: 0, totalG: 0, confirmedG: 0, reservedG: 0, availableG: 0, closedRestG: 0, requestCount: 0 });

// ふつうの出品は緑・茶色、お試し食材は水色にして、ひと目で見分けられるようにする
const palette = {
  normal: { label: "出品", confirmed: "bg-leaf", reserved: "bg-earth", available: "bg-leaf-soft", link: "text-earth", href: "/producer/orders" },
  trial: { label: "お試し", confirmed: "bg-sky-600", reserved: "bg-sky-300", available: "bg-sky-100 dark:bg-sky-950", link: "text-sky-700 dark:text-sky-300", href: "/producer/trial" },
} as const;

function AmountBlock({ kind, totals: t }: { kind: keyof typeof palette; totals: Totals }) {
  const c = palette[kind];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${kind === "trial" ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200" : "bg-leaf-soft text-leaf"}`}>
          {c.label}
          {t.count > 1 && ` ${t.count}件`}
        </span>
        <span className="text-muted">合計 {quantityText(t.totalG, kind === "trial")}</span>
      </div>
      <AmountBar totalG={t.totalG} parts={[{ color: c.confirmed, grams: t.confirmedG }, { color: c.reserved, grams: t.reservedG }, { color: c.available, grams: t.availableG }]} />
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <Amount color={c.confirmed} label="確定" text={quantityText(t.confirmedG, kind === "trial")} />
        <Amount color={c.reserved} label="仮押さえ" text={quantityText(t.reservedG, kind === "trial")} />
        <Amount color={c.available} label="申し込み可能" text={quantityText(t.availableG, kind === "trial")} />
      </dl>
      {/* 受付が終わった出品の残りは、もう申し込めないので分けて書く */}
      {t.closedRestG > 0 && <p className="text-xs text-muted">受付が終わった出品の残り {quantityText(t.closedRestG, kind === "trial")}</p>}
      {t.requestCount > 0 && (
        <Link href={c.href} className={`text-sm font-bold underline ${c.link}`}>
          返事待ちの申し込み {t.requestCount}件を見る
        </Link>
      )}
    </div>
  );
}

// 1本の棒を、確定・仮押さえ・申し込み可能の色に分けたグラフ（残りの灰色は、受付が終わった出品の残り）
// 数字は下の Amount に書くので、読み上げでは飛ばす
function AmountBar({ totalG, parts }: { totalG: number; parts: { color: string; grams: number }[] }) {
  const percent = (g: number) => (totalG > 0 ? (g / totalG) * 100 : 0);
  return (
    <div aria-hidden className="flex h-4 overflow-hidden rounded-full bg-line">
      {parts.map((p) => (
        <div key={p.color} className={p.color} style={{ width: `${percent(p.grams)}%` }} />
      ))}
    </div>
  );
}

// 量は、ふつうの出品は kg、お試しは g で書く（quantityText）
function Amount({ color, label, text }: { color: string; label: string; text: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1 text-xs text-muted">
        <span aria-hidden className={`size-2.5 rounded-full ${color}`} />
        {label}
      </dt>
      <dd className="font-bold">{text}</dd>
    </div>
  );
}
