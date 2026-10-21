// 規格外の野菜の特集（第2版 4-4「ホーム」）
// 押すと購入希望の画面（詳しい内容つき）が開き、ふつうの購入希望と同じ流れで申し込む
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { irregularListings } from "@/lib/irregular";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { IrregularArt } from "../feature-art";
import { ListingCard } from "../listing-card";
import { Loading } from "@/app/ui/loading";

export default function IrregularPage() {
  return (
    <AuthShell title="規格外の野菜の特集" wide>
      <Suspense fallback={<Loading />}>
        <IrregularList />
      </Suspense>
    </AuthShell>
  );
}

async function IrregularList() {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/buyer/profile");
  const items = await irregularListings(profile.prefecture, profile.city);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-linear-to-br from-earth-soft to-surface p-5 text-center ring-1 ring-line">
        <IrregularArt />
        <p className="text-3xl font-bold">
          <span className="text-earth">規格外</span>の野菜
        </p>
        <p className="text-sm leading-6 text-muted">形や大きさがふぞろいなだけで、味はそのまま。煮物・スープ・ソースなど、形を気にしない料理にぴったりです。</p>
        <p className="text-xs text-muted">並び順は毎回ばらばらで、同じ農家さんが続かないようにしています。</p>
      </div>
      {items.length === 0 && <p className="text-muted">今、近くで受付中の規格外の野菜はありません。</p>}
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
          <li key={item.listing.id}>
            <ListingCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
