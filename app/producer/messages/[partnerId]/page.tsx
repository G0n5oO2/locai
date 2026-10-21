// メッセージ：ある相手との、注文ごとのやりとりの一覧（第2版 4-3）
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { ThreadList } from "@/app/ui/message-list";
import { requireProducer } from "@/lib/session";
import { Loading } from "@/app/ui/loading";

export default function PartnerMessagesPage(props: PageProps<"/producer/messages/[partnerId]">) {
  return (
    <AuthShell title="メッセージ">
      <Suspense fallback={<Loading />}>
        <Threads {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function Threads({ params }: PageProps<"/producer/messages/[partnerId]">) {
  // ログインしていない人・立場が違う人は、ここで別の画面へ移動する
  const user = await requireProducer();
  const { partnerId } = await params;
  return <ThreadList userId={user.id} side="producer" partnerId={partnerId} />;
}
