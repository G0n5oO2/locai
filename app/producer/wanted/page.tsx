// 近くの「探しています」の一覧（生産者だけが使える）。これに応えて出品できる
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { methodLabel } from "@/lib/burden";
import { formatDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";
import { nearWanted } from "@/lib/wanted";

export default function WantedPage() {
  return (
    <AuthShell title="近くの「探しています」" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <WantedList />
      </Suspense>
    </AuthShell>
  );
}

async function WantedList() {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");
  const wanted = await nearWanted(profile);
  const kindLabel = { specified: "", substitute: "（代わりの野菜も可）", any: "種類を問わない" } as const;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">畑（{profile.prefecture} {profile.city}）から70km以内のお店です。お店の名前や住所は表示されません。</p>
      {wanted.length === 0 && <p className="text-muted">今は、近くに「探しています」はありません。</p>}
      {/* パソコンの幅では、カードを横に並べる */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {wanted.map((w) => (
          <div key={w.id} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 text-sm">
            <p className="font-bold">
              {w.vegetable}
              {kindLabel[w.kind]}・{gramsToKgText(w.quantityG)}kg
            </p>
            {w.substitutes.length > 0 && <p>代わりにOK：{w.substitutes.join("、")}</p>}
            <p className="text-muted">
              使用日 {formatDate(new Date(w.useDate))}・{methodLabel[w.method]}・{w.area}
            </p>
            <Link href={`/producer/listings/new${w.vegetable ? `?vegetable=${encodeURIComponent(w.vegetable)}` : ""}`} className="mt-1 font-bold text-earth underline">
              これに応えて出品する
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
