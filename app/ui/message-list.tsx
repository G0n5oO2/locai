// メッセージの画面の中身（生産者・飲食店で共通。第2版 4-3・4-4「メッセージ」）
// 最初は相手（お店・農家さん）ごとにまとめて並べ、押すとその相手との注文ごとの一覧になる
import Link from "next/link";
import { notFound } from "next/navigation";
import { expireOverdue } from "@/lib/availability";
import { formatJstDateTime } from "@/lib/datetime";
import { messagePartners, messageThreads } from "@/lib/messages";
import { orderStatusLabel } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

type Side = "buyer" | "producer";
const cardClass = "flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4";

// 相手ごとの一覧（メッセージの画面の最初）
export async function PartnerList({ userId, side }: { userId: string; side: Side }) {
  // 回答期限を過ぎた返事待ちは、期限切れにしてから表示する
  await expireOverdue(prisma);
  const partners = await messagePartners(userId, side);
  if (partners.length === 0) return <p className="text-muted">メッセージを送れる注文は、まだありません。</p>;

  return (
    <ul className="flex flex-col gap-3">
      {partners.map((p) => (
        <li key={p.partnerId}>
          <Link href={`/${side}/messages/${p.partnerId}`} className={cardClass}>
            <div className="flex items-center justify-between gap-2">
              {/* 名前・メッセージは利用者が入力したものなので、テキストとしてそのまま表示する */}
              <p className="font-bold">{p.partnerName}</p>
              <UnreadBadge count={p.unread} />
            </div>
            <p className="text-sm text-muted">注文 {p.orderCount}件</p>
            <LastMessage message={p.lastMessage} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ある相手との、注文ごとの一覧（押すと注文の詳細が開き、そこで読む・送る）
export async function ThreadList({ userId, side, partnerId }: { userId: string; side: Side; partnerId: string }) {
  await expireOverdue(prisma);
  // 自分が当事者の注文の中から、その相手との注文だけを取り出す（他人の注文は混ざらない：不変条件4）
  const threads = (await messageThreads(userId, side)).filter((t) => t.partnerId === partnerId);
  // やりとりがない相手の画面は「見つからない」にする（相手がいるかどうかも教えない）
  if (threads.length === 0) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{threads[0].partnerName} とのやりとり</h2>
      <ul className="flex flex-col gap-3">
        {threads.map((t) => (
          <li key={t.orderId}>
            <Link href={`/orders/${t.orderId}`} className={cardClass}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">
                  {t.vegetable}・{orderStatusLabel[t.status]}
                </p>
                <UnreadBadge count={t.unread} />
              </div>
              <LastMessage message={t.lastMessage} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href={`/${side}/messages`} className="font-bold text-leaf underline">
        メッセージの一覧に戻る
      </Link>
    </div>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return <span className="flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs leading-6 font-bold text-white">未読 {count}</span>;
}

function LastMessage({ message }: { message: { body: string; createdAt: Date } | null }) {
  if (!message) return <p className="text-sm text-muted">まだメッセージはありません。押すと送れます。</p>;
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      {/* 長いメッセージは1行で切って、最後を「…」にする */}
      <p className="truncate">{message.body}</p>
      <p className="shrink-0 text-xs text-muted">{formatJstDateTime(message.createdAt)}</p>
    </div>
  );
}
