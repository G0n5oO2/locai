// 自分の注文（購入希望）の一覧（飲食店だけが使える）
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { requireBuyer } from "@/lib/session";
import { BuyerOrderList } from "./order-list";

export default function BuyerOrdersPage() {
  return (
    <AuthShell title="自分の注文" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Orders />
      </Suspense>
    </AuthShell>
  );
}

async function Orders() {
  const user = await requireBuyer();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/buyer/search" className="btn btn-leaf md:w-fit md:px-8">
        仕入れ候補を探す
      </Link>
      {/* 「探しています」の公開・取り下げは、探していますのタブで行う（第2版） */}
      <BuyerOrderList userId={user.id} trial={false} />
    </div>
  );
}
