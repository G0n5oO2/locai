// 季節の野菜（旬の野菜）の紹介（第2版 4-4「ホーム」）
// 今月の旬の野菜を並べ、出品されている野菜には「出品あり」の印を付ける。選ぶと、AI の料理の案と「出品している農家を探す」が出る
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { featuredListings } from "@/lib/irregular";
import { prisma } from "@/lib/prisma";
import { seasonalInfo } from "@/lib/seasonal";
import { requireBuyer } from "@/lib/session";
import { SeasonalArt, VegIcon } from "../feature-art";
import { ListingCard } from "../listing-card";
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

  const { month, vegetables: all } = await seasonalInfo(profile.prefecture, profile.city);
  // 出品がある野菜を先に並べる（すぐ仕入れられるものから見られるように）
  const vegetables = [...all].sort((x, y) => (y.count > 0 ? 1 : 0) - (x.count > 0 ? 1 : 0));
  const selected = typeof veg === "string" && all.some((v) => v.name === veg) ? veg : null;
  // 選んだ野菜の、近くの出品
  const offers = selected ? await featuredListings(profile.prefecture, profile.city, { vegetableIncludes: selected }) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-leaf-soft p-5 text-center">
        <SeasonalArt />
        <p className="text-3xl font-bold">
          <span className="text-leaf">{month}月</span>の旬の野菜
        </p>
        <p className="text-sm text-muted">いちばんおいしい時期の野菜です。選ぶと、AI の料理の案と、出品している農家さんを探す入口が出ます。</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {vegetables.map(({ name, count }) => {
          const active = selected === name;
          return (
            <li key={name}>
              <Link
                href={`/buyer/home/seasonal?veg=${encodeURIComponent(name)}`}
                aria-current={active ? "true" : undefined}
                className={`flex h-full flex-col items-center gap-2 rounded-3xl p-4 text-center shadow-sm ring-1 transition-transform hover:-translate-y-0.5 ${
                  active ? "bg-leaf text-white ring-leaf" : count > 0 ? "bg-surface ring-leaf" : "bg-surface ring-line"
                }`}
              >
                <VegIcon name={name} />
                <span className="text-lg font-bold">{name}</span>
                {/* 出品があるかを、色で分かるようにする */}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active ? "bg-white text-leaf" : count > 0 ? "bg-leaf text-white" : "bg-line text-muted"
                  }`}
                >
                  {count > 0 ? `出品あり ${count}件` : "今は出品なし"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="flex flex-col gap-4 rounded-3xl bg-leaf-soft p-5 ring-1 ring-leaf">
          <p className="text-2xl font-bold">
            <span className="text-leaf">{selected}</span>で、どんな一品にしますか？
          </p>
          {/* 出品があれば、すぐ分かるように、ここにそのまま並べる。なければ、条件で探すボタンを出す */}
          {offers.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="font-bold">
                近くで出品されている{selected}（{offers.length}件）
              </h3>
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {offers.map((item) => (
                  <li key={item.listing.id}>
                    <ListingCard item={item} />
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">並び順は毎回ばらばらで、同じ農家さんが続かないようにしています。</p>
            </section>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">今、近くで{selected}の出品はありません。条件を入れて探すこともできます。</p>
              <Link href={`/buyer/search?vegetable=${encodeURIComponent(selected)}`} className="btn btn-leaf md:w-fit md:px-8">
                {selected}を出品している農家を探す →
              </Link>
            </div>
          )}
          <RecipePanel key={selected} vegetable={selected} />
        </div>
      )}
      <p className="text-xs text-muted">旬の野菜の一覧は、一般的な旬をもとにしたものです（確かめながら直していきます）。</p>
    </div>
  );
}
