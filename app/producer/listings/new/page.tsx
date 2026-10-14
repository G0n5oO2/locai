// 新しく出品する画面（生産者だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { expireOverdue, usedAmounts } from "@/lib/availability";
import { gramsToKgText } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";
import { nearWanted } from "@/lib/wanted";
import { ListingForm } from "./listing-form";

export default function NewListingPage(props: PageProps<"/producer/listings/new">) {
  return (
    <AuthShell title="新しく出品する">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <NewListing {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function NewListing({ searchParams }: PageProps<"/producer/listings/new">) {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  // プロフィールがないと、地域や送料が分からないので出品できない
  if (!profile) redirect("/producer/profile");

  // 畑から 70km 以内の「探しています」
  const wanted = await nearWanted(profile);
  const { vegetable, from } = await searchParams;

  // 再出品：自分の出品だけを元にする。総量は残りの量にする
  let initial: Record<string, string> | undefined;
  let fromListingId: string | undefined;
  if (typeof from === "string") {
    const old = await prisma.listing.findUnique({ where: { id: from } });
    if (old && old.producerId === user.id) {
      await expireOverdue(prisma, [old.id]);
      const u = (await usedAmounts(prisma, [old.id])).get(old.id)!;
      fromListingId = old.id;
      initial = {
        vegetable: old.vegetable,
        total: gramsToKgText(Math.max(old.totalG - u.confirmedG - u.reservedG, 0)),
        unit: gramsToKgText(old.unitG),
        minOrder: gramsToKgText(old.minOrderG),
        unitPrice: String(old.unitPriceYen),
        quality: old.quality,
        surplus: old.surplus ? "on" : "",
        note: old.note,
      };
    }
  }

  return (
    <ListingForm
      wanted={wanted}
      initialVegetable={typeof vegetable === "string" ? vegetable.slice(0, 50) : undefined}
      initial={initial}
      fromListingId={fromListingId}
      limits={{ shipLimitDelivery: profile.shipLimitDelivery, shipLimitSelf: profile.shipLimitSelf, shipLimitPickup: profile.shipLimitPickup }}
      available={{
        delivery: deliveryBands(profile).length > 0,
        self: profile.selfDeliveryYen !== null,
        pickup: profile.pickupPlace !== null,
      }}
    />
  );
}
