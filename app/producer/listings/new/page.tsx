// 新しく出品する画面（生産者だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireProducer } from "@/lib/session";
import { ListingForm } from "./listing-form";

export default function NewListingPage() {
  return (
    <AuthShell title="新しく出品する">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <NewListing />
      </Suspense>
    </AuthShell>
  );
}

async function NewListing() {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  // プロフィールがないと、地域や送料が分からないので出品できない
  if (!profile) redirect("/producer/profile");

  return (
    <ListingForm
      limits={{ shipLimitDelivery: profile.shipLimitDelivery, shipLimitSelf: profile.shipLimitSelf, shipLimitPickup: profile.shipLimitPickup }}
      available={{
        delivery: deliveryBands(profile).length > 0,
        self: profile.selfDeliveryYen !== null,
        pickup: profile.pickupPlace !== null,
      }}
    />
  );
}
