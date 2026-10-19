// 季節の野菜（旬の野菜）の紹介（第2版 4-4「ホーム」）
// 今月の旬の野菜を並べ、出品されている野菜には「出品あり」の印を付ける。選ぶと、AI の料理の案と「出品している農家を探す」が出る
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { expireOverdue } from "@/lib/availability";
import { seasonalByMonth } from "@/lib/data/seasonal";
import { jstDateText } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { findMunicipality, isNear } from "@/lib/region";
import { requireBuyer } from "@/lib/session";
import { SeasonalArt } from "../feature-art";
import { RecipePanel } from "./recipe-panel";

export default function SeasonalPage(props: PageProps<"/buyer/home/seasonal">) {
  return (
    <AuthShell title="季節の野菜（旬の野菜）" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Seasonal {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Seasonal({ searchParams }: PageProps<"/buyer/home/seasonal">) {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/buyer/profile");
  const { veg } = await searchParams;

  const month = Number(jstDateText(new Date()).slice(5, 7));
  const vegetables = seasonalByMonth[month] ?? [];
  const selected = typeof veg === "string" && vegetables.includes(veg) ? veg : null;

  // 近くで受付中のふつうの出品のうち、旬の野菜の名前を含むものを数える
  await expireOverdue(prisma);
  const shop = findMunicipality(profile.prefecture, profile.city);
  const listings = await prisma.listing.findMany({
    where: { isTrial: false, status: "open", acceptUntil: { gt: new Date() } },
    select: { vegetable: true, producer: { select: { profile: { select: { prefecture: true, city: true } } } } },
  });
  const near = listings.filter((l) => {
    const farm = l.producer.profile && findMunicipality(l.producer.profile.prefecture, l.producer.profile.city);
    return shop && farm && isNear(farm, shop);
  });
  const countOf = (name: string) => near.filter((l) => l.vegetable.includes(name)).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-leaf-soft p-5 text-center">
        <SeasonalArt />
        <p className="text-xl font-bold">{month}月の旬の野菜</p>
        <p className="text-sm text-muted">野菜を選ぶと、AI の料理の案と、出品している農家さんを探す入口が出ます。</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {vegetables.map((v) => {
          const n = countOf(v);
          return (
            <li key={v}>
              <Link
                href={`/buyer/home/seasonal?veg=${encodeURIComponent(v)}`}
                aria-current={selected === v ? "true" : undefined}
                className={`flex h-full flex-col items-center gap-1 rounded-2xl border p-3 text-center ${selected === v ? "border-leaf bg-leaf-soft" : "border-line bg-surface"}`}
              >
                <span className="font-bold">{v}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${n > 0 ? "bg-leaf text-white" : "bg-line text-muted"}`}>{n > 0 ? `出品あり ${n}件` : "今は出品なし"}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="flex flex-col gap-4 rounded-2xl border border-leaf p-4">
          <RecipePanel key={selected} vegetable={selected} />
          <Link href={`/buyer/search?vegetable=${encodeURIComponent(selected)}`} className="rounded-xl bg-leaf px-4 py-3 text-center font-bold text-white md:w-fit md:px-8">
            {selected}を出品している農家を探す
          </Link>
        </div>
      )}
      <p className="text-xs text-muted">旬の野菜の一覧は、一般的な旬をもとにしたものです（確かめながら直していきます）。</p>
    </div>
  );
}
