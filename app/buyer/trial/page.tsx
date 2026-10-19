// 飲食店のお試し（第2版 4-4）。まだ買ったことがない農家さんの野菜を、少しだけ試せる
// 上の項目で「お試しの希望（探して申し込む）」と「お試しの注文（申し込んだもの）」を切り替える
import Link from "next/link";
import { BuyerOrderList } from "@/app/buyer/orders/order-list";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { trialItemsFor } from "@/lib/trial-items";

export default function BuyerTrialPage(props: PageProps<"/buyer/trial">) {
  return (
    <AuthShell title="お試し" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Trial {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Trial({ searchParams }: PageProps<"/buyer/trial">) {
  const user = await requireBuyer();
  const { tab } = await searchParams;
  const current = tab === "orders" ? "orders" : "items";
  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="お試しの希望とお試しの注文の切り替え" className="card flex gap-2 rounded-full p-1 md:w-fit">
        {[
          { key: "items", label: "お試しの希望", href: "/buyer/trial" },
          { key: "orders", label: "お試しの注文", href: "/buyer/trial?tab=orders" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={current === t.key ? "page" : undefined}
            className={`flex-1 rounded-full px-6 py-2 text-center font-bold md:flex-none ${current === t.key ? "bg-leaf text-white" : "text-muted"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {current === "orders" ? <BuyerOrderList userId={user.id} trial /> : <TrialList userId={user.id} />}
    </div>
  );
}

// お試しできる野菜の一覧
async function TrialList({ userId }: { userId: string }) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/buyer/profile");
  const items = await trialItemsFor(userId, profile.prefecture, profile.city);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">まだ買ったことがない野菜を、少しだけ試せます。同じ農家さんでも、野菜がちがえば試せます。</p>
      {items.length === 0 && <p className="text-muted">今、お試しできる野菜はありません。</p>}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ item, profile: p }) => (
          <li key={item.id}>
            <Link href={`/buyer/trial/${item.id}`} className="flex h-full flex-col gap-1 card p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                {/* 食材名・農家さんの名前は利用者が入力したものなので、テキストとしてそのまま表示する */}
                <p className="text-lg font-bold">{item.vegetable}</p>
                <span className="rounded-full bg-earth-soft px-2 py-0.5 text-xs font-medium text-earth">{item.quality === "normal" ? "通常品" : "規格外"}</span>
              </div>
              <p className="text-muted">
                {item.producer.name}・{p.prefecture} {p.city}
              </p>
              {/* 値段は大きく、色を変えて目立たせる */}
              <p className="flex items-baseline gap-1">
                <span className="text-muted">{item.unitG}g あたり</span>
                <span className="text-2xl font-bold text-leaf">{item.unitPriceYen.toLocaleString()}円</span>
              </p>
              <span className="mt-auto font-bold text-leaf underline">詳しく見る・お試しを申し込む</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
