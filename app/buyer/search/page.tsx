// 出品を探す画面（飲食店だけが使える）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { requireBuyer } from "@/lib/session";
import { SearchForm } from "./search-form";

export default function SearchPage() {
  return (
    <AuthShell title="仕入れ候補を探す">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Search />
      </Suspense>
    </AuthShell>
  );
}

async function Search() {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  // お店の地域が分からないと、近くの出品を探せない
  if (!profile) redirect("/buyer/profile");
  return <SearchForm area={`${profile.prefecture} ${profile.city}`} />;
}
