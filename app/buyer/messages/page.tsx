// メッセージ（第2版 4-4）。相手（お店・農家さん）ごとのやりとりの一覧
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { PartnerList } from "@/app/ui/message-list";
import { requireBuyer } from "@/lib/session";
import { Loading } from "@/app/ui/loading";

export default function MessagesPage() {
  return (
    <AuthShell title="メッセージ">
      <Suspense fallback={<Loading />}>
        <Threads />
      </Suspense>
    </AuthShell>
  );
}

async function Threads() {
  // ログインしていない人・立場が違う人は、ここで別の画面へ移動する
  const user = await requireBuyer();
  return <PartnerList userId={user.id} side="buyer" />;
}
