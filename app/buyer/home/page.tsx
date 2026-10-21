// 飲食店のホーム（第2版 4-4）。季節の野菜と、規格外の野菜の特集を大きく出す
// 数字の手がかり（出品ありの種類・近くの件数・1kg あたり○円から）も出して、見てみたくなるようにする
// （農園マップは保留中）
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { FarmBackdrop, FarmBanner } from "@/app/ui/farm-map";
import { DeliveryCalendarFor, HomeNoticesFor } from "@/app/ui/home-updates";
import { irregularListings } from "@/lib/irregular";
import { prisma } from "@/lib/prisma";
import { seasonalInfo } from "@/lib/seasonal";
import { requireBuyer } from "@/lib/session";
import { IrregularArt, SeasonalArt } from "./feature-art";
import { Loading } from "@/app/ui/loading";

export default function BuyerHomePage(props: PageProps<"/buyer/home">) {
  return (
    <AuthShell title="ホーム" wide>
      {/* 上に横長の農園の絵、その下はうすい農園の背景（第2版 4-1） */}
      <FarmBackdrop />
      <FarmBanner />
      <Suspense fallback={<Loading />}>
        <Features {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Features({ searchParams }: PageProps<"/buyer/home">) {
  // ログインしたばかり（welcome=1）なら、上から通知を出す
  const { welcome } = await searchParams;
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/buyer/profile");
  const [seasonal, irregular] = await Promise.all([seasonalInfo(profile.prefecture, profile.city), irregularListings(profile.prefecture, profile.city)]);
  const listedKinds = seasonal.vegetables.filter((v) => v.count > 0).length;
  // 規格外の 1kg あたりの一番安い値段（比べるための目安。計算には使わない）
  const cheapestPerKg = irregular.length > 0 ? Math.min(...irregular.map((i) => Math.round((i.listing.unitPriceYen * 1000) / i.listing.unitG))) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* ホームを開いたときに、上から出てくる通知（新しいメッセージ・条件変更の提案・今日の納品） */}
      <HomeNoticesFor userId={user.id} side="buyer" fromLogin={welcome === "1"} />
      <div className="grid gap-5 md:grid-cols-2">
        {/* 季節の野菜の特集 */}
        <Link href="/buyer/home/seasonal" className="group flex flex-col gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-leaf-soft to-surface p-6 shadow-sm ring-1 ring-line">
          <span className="w-fit rounded-full bg-leaf px-3 py-1 text-xs font-bold text-white">今月の特集</span>
          <div className="flex justify-center transition-transform group-hover:scale-105">
            <SeasonalArt />
          </div>
          <p className="text-3xl font-bold leading-tight">
            <span className="text-leaf">{seasonal.month}月</span>の旬の野菜
          </p>
          <p className="leading-7 text-muted">いちばんおいしい時期の野菜を、献立に。料理の案も AI が出します。</p>
          <ul className="flex flex-wrap gap-2">
            {seasonal.vegetables.slice(0, 5).map((v) => (
              <li key={v.name} className={`rounded-full px-3 py-1 text-sm font-bold ${v.count > 0 ? "bg-leaf text-white" : "bg-surface text-foreground ring-1 ring-line"}`}>
                {v.name}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            近くで出品あり：<strong className="text-xl text-leaf">{listedKinds}種類</strong>
          </p>
          <span className="mt-auto btn btn-leaf">旬の野菜を見る →</span>
        </Link>

        {/* 規格外の野菜の特集 */}
        <Link href="/buyer/home/irregular" className="group flex flex-col gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-earth-soft to-surface p-6 shadow-sm ring-1 ring-line">
          <span className="w-fit rounded-full bg-earth px-3 py-1 text-xs font-bold text-white">手ごろに仕入れる</span>
          <div className="flex justify-center transition-transform group-hover:scale-105">
            <IrregularArt />
          </div>
          <p className="text-3xl font-bold leading-tight">
            <span className="text-earth">規格外</span>の野菜
          </p>
          <p className="leading-7 text-muted">形や大きさがふぞろいなだけで、味はそのまま。煮物やスープ、ソースにぴったりです。</p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <p>
              近くに <strong className="text-xl text-earth">{irregular.length}件</strong>
            </p>
            {cheapestPerKg !== null && (
              <p>
                1kg あたり <strong className="text-xl text-earth">{cheapestPerKg.toLocaleString()}円</strong> から
              </p>
            )}
          </div>
          <span className="mt-auto btn btn-earth">規格外の野菜を見る →</span>
        </Link>
      </div>
      {/* 納品の予定のカレンダー（特集の下） */}
      <DeliveryCalendarFor userId={user.id} side="buyer" />
    </div>
  );
}
