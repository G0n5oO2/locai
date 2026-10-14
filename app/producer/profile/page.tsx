// 生産者プロフィールの作成・編集の画面（生産者だけが使える）
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { citiesOf, prefectures } from "@/lib/region";
import { requireProducer } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export default function ProducerProfilePage() {
  return (
    <AuthShell title="生産者プロフィール">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <ProfileEditor />
      </Suspense>
    </AuthShell>
  );
}

async function ProfileEditor() {
  const user = await requireProducer();
  // 自分のプロフィールだけを読む
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });

  const citiesByPrefecture = Object.fromEntries(prefectures.map((p) => [p, citiesOf(p)]));
  // 初回は、出荷件数を10件、お試しの量を0.5kg にしておく
  const initial = profile
    ? {
        prefecture: profile.prefecture,
        city: profile.city,
        items: profile.items,
        commitment: profile.commitment,
        shipLimitDelivery: String(profile.shipLimitDelivery),
        shipLimitSelf: String(profile.shipLimitSelf),
        shipLimitPickup: String(profile.shipLimitPickup),
        trialAmount: gramsToKgText(profile.trialAmountG),
      }
    : { shipLimitDelivery: "10", shipLimitSelf: "10", shipLimitPickup: "10", trialAmount: "0.5" };

  return <ProfileForm citiesByPrefecture={citiesByPrefecture} initial={initial} />;
}
