// メッセージ：ある相手との、注文ごとのやりとりの一覧（第2版 4-4）
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { ThreadList } from "@/app/ui/message-list";
import { requireBuyer } from "@/lib/session";

export default function PartnerMessagesPage(props: PageProps<"/buyer/messages/[partnerId]">) {
  return (
    <AuthShell title="メッセージ">
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Threads {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Threads({ params }: PageProps<"/buyer/messages/[partnerId]">) {
  // ログインしていない人・立場が違う人は、ここで別の画面へ移動する
  const user = await requireBuyer();
  const { partnerId } = await params;
  return <ThreadList userId={user.id} side="buyer" partnerId={partnerId} />;
}
