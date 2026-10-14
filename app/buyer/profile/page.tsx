// 飲食店プロフィールの作成・編集の画面（飲食店だけが使える）
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { citiesOf, prefectures } from "@/lib/region";
import { requireBuyer } from "@/lib/session";
import { BuyerProfileForm } from "./buyer-profile-form";

export default function BuyerProfilePage() {
  return (
    <AuthShell title="お店のプロフィール">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <BuyerProfileEditor />
      </Suspense>
    </AuthShell>
  );
}

async function BuyerProfileEditor() {
  const user = await requireBuyer();
  // 自分のプロフィールだけを読む
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  const citiesByPrefecture = Object.fromEntries(prefectures.map((p) => [p, citiesOf(p)]));
  const initial = profile ? { prefecture: profile.prefecture, city: profile.city, address: profile.address } : {};
  return <BuyerProfileForm citiesByPrefecture={citiesByPrefecture} initial={initial} />;
}
