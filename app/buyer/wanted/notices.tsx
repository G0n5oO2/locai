// 農家さんからのお知らせ：「探しています」に合う売れ残りの出品（受付中のものだけ）
// マイページと、探していますのタブで使い回す
import Link from "next/link";
import { methodLabel } from "@/lib/burden";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";

export // 農家さんからのお知らせ：「探しています」に合う売れ残りの出品（受付中のものだけ）
async function BuyerNotices({ userId }: { userId: string }) {
  const notices = await prisma.listingNotice.findMany({
    where: { buyerId: userId, listing: { status: "open", acceptUntil: { gt: new Date() } } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { listing: { include: { producer: { select: { name: true, profile: { select: { prefecture: true, city: true } } } } } } },
  });
  if (notices.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">お知らせ</h2>
      {notices.map(({ id, listing: l }) => (
        <div key={id} className="flex flex-col gap-1 rounded-3xl border border-leaf bg-leaf-soft p-4 text-sm">
          <p className="font-bold">あなたの「探しています」に合う出品があります</p>
          <p>
            {l.vegetable}・{gramsToKgText(l.unitG)}kg あたり {l.unitPriceYen.toLocaleString()}円（{l.producer.name}・{l.producer.profile?.prefecture} {l.producer.profile?.city}）
          </p>
          <p className="text-muted">
            受け渡し：{[l.offersDelivery && methodLabel.delivery, l.offersSelf && methodLabel.self, l.offersPickup && methodLabel.pickup].filter(Boolean).join("／")}
          </p>
          <Link href={`/buyer/listings/${l.id}`} className="mt-1 btn btn-sm btn-leaf">
            出品を見る
          </Link>
        </div>
      ))}
    </section>
  );
}
