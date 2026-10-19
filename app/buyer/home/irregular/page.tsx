// 規格外の野菜の特集（第2版 4-4「ホーム」）
// 押すと購入希望の画面（詳しい内容つき）が開き、ふつうの購入希望と同じ流れで申し込む
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { irregularListings } from "@/lib/irregular";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";
import { IrregularArt } from "../feature-art";

export default function IrregularPage() {
  return (
    <AuthShell title="規格外の野菜の特集" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">形や大きさがふぞろいな「規格外」の野菜です。並び順は毎回ばらばらで、同じ農家さんが続かないようにしています。</p>
      {items.length === 0 && <p className="text-muted">今、近くで受付中の規格外の野菜はありません。</p>}
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ listing: l, area }) => {
          // 1kg あたりの値段は、比べるための参考（計算には使わない）
          const perKg = Math.round((l.unitPriceYen * 1000) / l.unitG);
          return (
            <li key={l.id}>
              <Link href={`/buyer/listings/${l.id}`} className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
                <div className="flex justify-center rounded-xl bg-earth-soft py-2">
                  <IrregularArt />
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
                  <p className="text-lg font-bold">{l.vegetable}</p>
                  <span className="rounded-full bg-earth-soft px-2 py-0.5 text-xs font-medium text-earth">規格外</span>
                </div>
                <p className="text-muted">
                  {l.producer.name}・{area}
                </p>
                {l.note && <p className="whitespace-pre-wrap">状態：{l.note}</p>}
                {/* 値段は大きく、色を変えて目立たせる */}
                <p className="flex items-baseline gap-1">
                  <span className="text-muted">{gramsToKgText(l.unitG)}kg あたり</span>
                  <span className="text-2xl font-bold text-leaf">{l.unitPriceYen.toLocaleString()}円</span>
                </p>
                <p className="text-xs text-muted">1kg あたり 約{perKg.toLocaleString()}円・最低 {gramsToKgText(l.minOrderG)}kg</p>
                <span className="mt-auto font-bold text-leaf underline">詳しく見る・希望する</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
