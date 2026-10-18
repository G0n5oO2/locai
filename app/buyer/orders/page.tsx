// 自分の注文（購入希望）の一覧（飲食店だけが使える）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { methodLabel } from "@/lib/burden";
import { formatDate, jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";
import { CloseWantedButton } from "./close-wanted-button";
import { BuyerOrderList } from "./order-list";

export default function BuyerOrdersPage() {
  return (
    <AuthShell title="自分の注文" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Orders />
      </Suspense>
    </AuthShell>
  );
}

async function Orders() {
  const user = await requireBuyer();
  // 自分の「探しています」（公開中で、使用日を過ぎていないもの）
  const wanted = await prisma.wantedRequest.findMany({
    where: { buyerId: user.id, closed: false, useDate: { gte: parseDate(jstDateText(new Date()))! } },
    orderBy: { createdAt: "desc" },
  });
  const kindLabel = { specified: "", substitute: "（代わりの野菜も可）", any: "種類を問わない" } as const;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/buyer/search" className="rounded-xl bg-leaf px-4 py-3 md:w-fit md:px-8 text-center font-bold text-white">
        仕入れ候補を探す
      </Link>
      {wanted.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">公開中の「探しています」</h2>
          {wanted.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface p-3 text-sm">
              <p>
                {w.vegetable}
                {kindLabel[w.kind]}
                {w.substitutes.length > 0 && `：${w.substitutes.join("、")}`}・{gramsToKgText(w.quantityG)}kg・使用日 {formatDate(w.useDate)}・{methodLabel[w.method]}
              </p>
              <CloseWantedButton wantedId={w.id} />
            </div>
          ))}
        </section>
      )}
      <BuyerOrderList userId={user.id} trial={false} />
    </div>
  );
}
