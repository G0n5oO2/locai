// 新しく出品する画面（生産者だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
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
  const { vegetable } = await searchParams;

  return (
    <ListingForm
      wanted={wanted}
      initialVegetable={typeof vegetable === "string" ? vegetable.slice(0, 50) : undefined}
      limits={{ shipLimitDelivery: profile.shipLimitDelivery, shipLimitSelf: profile.shipLimitSelf, shipLimitPickup: profile.shipLimitPickup }}
      available={{
        delivery: deliveryBands(profile).length > 0,
        self: profile.selfDeliveryYen !== null,
        pickup: profile.pickupPlace !== null,
      }}
    />
  );
}
