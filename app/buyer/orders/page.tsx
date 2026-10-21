// 自分の注文（購入希望）の一覧（飲食店だけが使える）
// 上のタブで、状態ごとに切り替える（第2版：すべて／返事待ち／販売確定／見送り／取消／期限切れ）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { Loading } from "@/app/ui/loading";
import { expireOverdue } from "@/lib/availability";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { BuyerOrderList } from "./order-list";

export default function BuyerOrdersPage(props: PageProps<"/buyer/orders">) {
  return (
    <AuthShell title="自分の注文" wide>
      <Suspense fallback={<Loading />}>
        <Orders {...props} />
      </Suspense>
    </AuthShell>
  );
}

// 状態の切り替え（返事待ちには、条件変更の確認待ちも入れる）
const tabs: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "すべて" },
  { key: "waiting", label: "返事待ち", statuses: ["pending", "change_pending"] },
  { key: "confirmed", label: "販売確定", statuses: ["confirmed"] },
  { key: "declined", label: "見送り", statuses: ["declined"] },
  { key: "cancelled", label: "取消", statuses: ["cancelled"] },
  { key: "expired", label: "期限切れ", statuses: ["expired"] },
];

async function Orders({ searchParams }: PageProps<"/buyer/orders">) {
  const user = await requireBuyer();
  const { status } = await searchParams;
  const current = tabs.find((t) => t.key === status) ?? tabs[0];
  // 状態ごとの件数（自分のふつうの注文だけ。お試しの注文は、お試しのタブで見る）
  await expireOverdue(prisma);
  const counts = await prisma.order.groupBy({ by: ["status"], where: { buyerId: user.id, isTrial: false }, _count: true });
  const countOf = (t: (typeof tabs)[number]) => counts.filter((c) => !t.statuses || t.statuses.includes(c.status)).reduce((sum, c) => sum + c._count, 0);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/buyer/search" className="btn btn-leaf md:w-fit md:px-8">
        仕入れ候補を探す
      </Link>
      {/* 状態の切り替え：下に線が出るタブ（スマホでは、横にスクロールできる） */}
      <nav aria-label="注文の状態の切り替え" className="-mx-4 flex overflow-x-auto border-b border-line px-4">
        {tabs.map((t) => {
          const active = t.key === current.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/buyer/orders" : `/buyer/orders?status=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-4 px-4 py-3 text-sm font-bold ${
                active ? "border-leaf text-leaf" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span className={`text-xs ${active ? "text-leaf" : "text-muted"}`}>{countOf(t)}</span>
            </Link>
          );
        })}
      </nav>
      {/* 「探しています」の公開・取り下げは、探していますのタブで行う（第2版） */}
      <BuyerOrderList userId={user.id} trial={false} statuses={current.statuses} emptyText={`「${current.label}」の注文はありません。`} />
    </div>
  );
}
