// 飲食店の「探しています」（第2版 4-4）
// 上から：農家さんからのお知らせ／公開中の「探しています」（取り下げられる）／新しく「探しています」を出す
// 伝わるのは、地域・食材・希望数量・使用日・受け取り方法だけ。お店の名前・住所・予算は伝わらない（不変条件4）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CloseWantedButton } from "@/app/buyer/orders/close-wanted-button";
import { PublishWanted } from "@/app/buyer/search/publish-wanted";
import { AuthShell } from "@/app/ui/auth-shell";
import { methodLabel } from "@/lib/burden";
import { formatDate, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";
import { BuyerNotices } from "./notices";
import { Loading } from "@/app/ui/loading";

export default function WantedPage() {
  return (
    <AuthShell title="探しています" wide>
      <Suspense fallback={<Loading />}>
        <Wanted />
      </Suspense>
    </AuthShell>
  );
}

const kindLabel = { specified: "この野菜だけ", substitute: "代わりの野菜でもよい", any: "種類を問わない" } as const;

async function Wanted() {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/buyer/profile");
  // 自分の「探しています」（公開中で、使用日を過ぎていないもの）
  const wanted = await prisma.wantedRequest.findMany({
    where: { buyerId: user.id, closed: false, useDate: { gte: parseDate(jstDateText(new Date()))! } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">ほしい野菜を「探しています」として出すと、近くの農家さんに、地域と条件だけが伝わります。合う出品があると、農家さんからお知らせが届きます。</p>

      <BuyerNotices userId={user.id} />

      <section className="flex flex-col gap-3">
        <h2 className="section-title">公開中の「探しています」（{wanted.length}件）</h2>
        {wanted.length === 0 && <p className="text-sm text-muted">今、公開中の「探しています」はありません。</p>}
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {wanted.map((w) => (
            <li key={w.id} className="flex flex-col gap-3 card p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
                <p className="mr-auto text-xl font-bold">{w.kind === "any" ? "種類を問わない" : w.vegetable}</p>
                <span className="rounded-full bg-leaf-soft px-3 py-0.5 text-xs font-bold text-leaf">{kindLabel[w.kind]}</span>
              </div>
              {w.substitutes.length > 0 && (
                <p>
                  <span className="text-xs text-muted">代わりにOK　</span>
                  <strong>{w.substitutes.join("、")}</strong>
                </p>
              )}
              <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-background p-3">
                <div>
                  <dt className="text-xs text-muted">希望数量</dt>
                  <dd className="text-lg font-bold">{gramsToKgText(w.quantityG)}kg</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">使用日</dt>
                  <dd className="font-bold">{formatDate(w.useDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">受け取り</dt>
                  <dd className="font-bold">{methodLabel[w.method]}</dd>
                </div>
              </dl>
              <div className="self-end">
                <CloseWantedButton wantedId={w.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex w-full flex-col gap-3">
        <h2 className="section-title">新しく出す</h2>
        <PublishWanted editable />
      </section>
    </div>
  );
}
