// 出品を探す画面（飲食店だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { findMunicipality } from "@/lib/region";
import { requireBuyer } from "@/lib/session";
import { SearchForm } from "./search-form";
import { SearchTabs } from "./search-tabs";
import { Loading } from "@/app/ui/loading";

export default function SearchPage(props: PageProps<"/buyer/search">) {
  return (
    <AuthShell title="仕入れ候補を探す" wide>
      <Suspense fallback={<Loading />}>
        <Search {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Search({ searchParams }: PageProps<"/buyer/search">) {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  // お店の地域が分からないと、近くの出品を探せない
  if (!profile) redirect("/buyer/profile");
  // 季節の野菜の画面などから来たときは、食材を入れた状態で開く
  const { vegetable } = await searchParams;
  const area = `${profile.prefecture} ${profile.city}`;
  // 地図の真ん中は、お店の市区町村の代表地点（見つからなければ大阪市あたり）
  const place = findMunicipality(profile.prefecture, profile.city);
  const home = { lat: place?.lat ?? 34.69, lng: place?.lng ?? 135.5, label: area };
  return (
    <SearchTabs home={home}>
      <SearchForm area={area} initialVegetable={typeof vegetable === "string" ? vegetable.slice(0, 50) : undefined} />
    </SearchTabs>
  );
}
