// お試し食材を登録する画面（第2版 4-3「お試し」。生産者だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireProducer } from "@/lib/session";
import { TrialForm } from "./trial-form";
import { Loading } from "@/app/ui/loading";

export default function NewTrialPage() {
  return (
    <AuthShell title="お試し食材を登録する">
      <Suspense fallback={<Loading />}>
        <NewTrial />
      </Suspense>
    </AuthShell>
  );
}

async function NewTrial() {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  // プロフィールがないと、送料や受け渡しの方法が分からないので登録できない
  if (!profile) redirect("/producer/profile");
  // 料金や場所を入れてある受け渡し方法だけを選べる
  const available = {
    delivery: deliveryBands(profile).length > 0,
    self: profile.selfDeliveryYen !== null,
    pickup: profile.pickupPlace !== null,
  };
  return <TrialForm available={available} />;
}
