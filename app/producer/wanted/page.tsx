// お店の「探しています」の一覧（生産者だけが使える）。これに応えて出品できる
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { findMunicipality } from "@/lib/region";
import { requireProducer } from "@/lib/session";
import { nearWanted } from "@/lib/wanted";
import { Loading } from "@/app/ui/loading";
import { WantedView } from "./wanted-view";

export default function WantedPage() {
  return (
    <AuthShell title="お店の「探しています」" wide>
      <Suspense fallback={<Loading />}>
        <WantedList />
      </Suspense>
    </AuthShell>
  );
}

async function WantedList() {
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");
  // 地図の丸の位置：お店の市区町村の代表地点（役所の場所）。一覧にない地域のものは、一覧だけに出す
  const wanted = (await nearWanted(profile)).flatMap((w) => {
    const [prefecture, city] = w.area.split(" ");
    const place = findMunicipality(prefecture, city);
    return place ? [{ ...w, lat: place.lat, lng: place.lng }] : [];
  });
  // 地図の真ん中は、畑の市区町村の代表地点
  const farm = findMunicipality(profile.prefecture, profile.city);
  const home = { lat: farm?.lat ?? 34.69, lng: farm?.lng ?? 135.5, label: `${profile.prefecture} ${profile.city}` };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">関西のお店の「探しています」です。お店の名前や住所は表示されません。</p>
      {/* 一覧と地図を切り替えて見る（第2版） */}
      <WantedView wanted={wanted} home={home} />
    </div>
  );
}
