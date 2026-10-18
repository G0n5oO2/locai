// メッセージ（第2版 4-4）。注文ごとのやりとりの一覧
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { MessageList } from "@/app/ui/message-list";
import { requireBuyer } from "@/lib/session";

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
  const user = await requireBuyer();
  return <MessageList userId={user.id} side="buyer" />;
}
