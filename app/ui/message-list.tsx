// メッセージの画面の中身（生産者・飲食店で共通。第2版 4-3・4-4「メッセージ」）
// 注文ごとのやりとりを、最後にメッセージが来た順に並べる。押すと注文の詳細（メッセージを読む・送る画面）が開く
import Link from "next/link";
import { expireOverdue } from "@/lib/availability";
import { formatJstDateTime } from "@/lib/datetime";
import { messageThreads } from "@/lib/messages";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export async function MessageList({ userId, side }: { userId: string; side: "buyer" | "producer" }) {
  // 回答期限を過ぎた返事待ちは、期限切れにしてから表示する
  await expireOverdue(prisma);
  const threads = await messageThreads(userId, side);
  if (threads.length === 0) return <p className="text-muted">メッセージを送れる注文は、まだありません。</p>;

  return (
    <ul className="flex flex-col gap-3">
      {threads.map((t) => (
        <li key={t.orderId}>
          <Link href={`/orders/${t.orderId}`} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              {/* 名前・野菜・メッセージは利用者が入力したものなので、テキストとしてそのまま表示する */}
              <p className="font-bold">{t.partnerName}</p>
              {t.unread > 0 && (
                <span className="flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs leading-6 font-bold text-white">
                  未読 {t.unread}
                </span>
              )}
            </div>
            <p className="text-sm text-muted">
              {t.vegetable}・{orderStatusLabel[t.status]}
            </p>
            {t.lastMessage ? (
              <div className="flex items-baseline justify-between gap-2 text-sm">
                {/* 長いメッセージは1行で切って、最後を「…」にする */}
                <p className="truncate">{t.lastMessage.body}</p>
                <p className="shrink-0 text-xs text-muted">{formatJstDateTime(t.lastMessage.createdAt)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">まだメッセージはありません。押すと送れます。</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
