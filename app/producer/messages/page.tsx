// メッセージ（第2版 4-3）。相手（お店・農家さん）ごとのやりとりの一覧
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { PartnerList } from "@/app/ui/message-list";
import { requireProducer } from "@/lib/session";

export default function MessagesPage() {
  return (
    <AuthShell title="メッセージ">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Threads />
      </Suspense>
    </AuthShell>
  );
}

async function Threads() {
  // ログインしていない人・立場が違う人は、ここで別の画面へ移動する
  const user = await requireProducer();
  return <PartnerList userId={user.id} side="producer" />;
}
