// 注文の詳細とメッセージ（その注文のお店と農家さんだけが見られる）
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { OrderAmount } from "@/app/ui/order-amount";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import { MESSAGE_OPEN_STATUSES, partyOf } from "@/lib/messages";
import { orderStatusLabel } from "@/lib/order-status";
import { paymentLabel } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { MessageForm } from "./message-form";
import { Loading } from "@/app/ui/loading";

export default function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  return (
    <AuthShell title="注文の詳細">
      <Suspense fallback={<Loading />}>
        <OrderDetail {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function OrderDetail({ params }: PageProps<"/orders/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  // 当事者でなければ「見つからない」（他人の注文は、あることも教えない）
  const party = await partyOf(user.id, id);
  if (!party) notFound();
  const isBuyer = party.side === "buyer";

  const order = await prisma.order.findUniqueOrThrow({
    where: { id },
    include: {
      listing: { select: { vegetable: true, producer: { select: { name: true, profile: { select: { pickupPlace: true } } } } } },
      buyer: { select: { name: true, buyerProfile: { select: { address: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } },
    },
  });
  // 開いたら、メッセージを読んだことにする
  await prisma.order.update({ where: { id }, data: isBuyer ? { buyerReadAt: new Date() } : { producerReadAt: new Date() } });

  const canSend = (MESSAGE_OPEN_STATUSES as readonly string[]).includes(order.status);
  const confirmed = order.status === "confirmed";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 card p-4 text-sm">
        {/* いちばん上：野菜（大きく）と、お試し・状態のラベル */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xl font-bold">{order.listing.vegetable}</p>
          {order.isTrial && <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">お試し</span>}
          <span className="rounded-full bg-leaf-soft px-3 py-0.5 text-xs font-bold text-leaf">{orderStatusLabel[order.status]}</span>
        </div>
        <p className="text-base">
          <span className="text-xs text-muted">相手　</span>
          <strong>{isBuyer ? order.listing.producer.name : order.buyer.name}</strong>
        </p>
        {/* 数量と金額（合計は大きく、色を変える） */}
        <OrderAmount isTrial={order.isTrial} quantityG={order.quantityG} unitG={order.unitG} unitPriceYen={order.unitPriceYen} itemYen={order.itemYen} shippingYen={order.shippingYen} totalYen={order.totalYen} shippingToBeDecided={order.shippingToBeDecided} />
        {/* こまかい情報（見出しは小さくうすく、中身ははっきり） */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl bg-background p-3">
          <div>
            <dt className="text-xs text-muted">受け渡し</dt>
            <dd className="font-bold">{methodLabel[order.method]}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">納品日</dt>
            <dd className="font-bold">{formatDate(order.deliveryDate)}</dd>
          </div>
          <div>
            {/* 支払方法（第2版）。選ばれていないときは、メッセージで相談 */}
            <dt className="text-xs text-muted">支払方法</dt>
            <dd className="font-bold">{order.paymentMethod ? paymentLabel[order.paymentMethod] : "メッセージで相談"}</dd>
          </div>
          {/* 使用日は、お店本人か、お店が見せてよいとしたときだけ */}
          {(isBuyer || order.showUseDate) && (
            <div>
              <dt className="text-xs text-muted">使用日</dt>
              <dd className="font-bold">{formatDate(order.useDate)}</dd>
            </div>
          )}
          {/* 届け先・引き取りの場所は、販売確定したときだけ相手に見せる（不変条件4） */}
          {confirmed && !isBuyer && order.method !== "pickup" && order.buyer.buyerProfile && (
            <div className="col-span-2">
              <dt className="text-xs text-muted">届け先</dt>
              <dd className="font-bold">{order.buyer.buyerProfile.address}</dd>
            </div>
          )}
          {confirmed && isBuyer && order.method === "pickup" && order.listing.producer.profile?.pickupPlace && (
            <div className="col-span-2">
              <dt className="text-xs text-muted">引き取りの場所</dt>
              <dd className="font-bold">{order.listing.producer.profile.pickupPlace}</dd>
            </div>
          )}
        </dl>
        {confirmed && <p className="mt-1 text-xs text-muted">支払いと配送の手配は、当事者どうしでアプリの外で行います。支払期限・発送予定（支払方法が決まっていなければ支払方法も）は、下のメッセージで確かめてください。</p>}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="section-title">メッセージ</h2>
        {order.messages.length === 0 && <p className="text-sm text-muted">まだメッセージはありません。</p>}
        <ul className="flex flex-col gap-2">
          {order.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <li key={m.id} className={`flex max-w-[85%] flex-col gap-1 rounded-3xl p-3 text-sm ${mine ? "self-end bg-leaf-soft" : "self-start border border-line bg-surface"}`}>
                <span className="text-xs text-muted">
                  {mine ? "あなた" : m.sender.name}・{formatJstDateTime(m.createdAt)}
                </span>
                {/* 入力された文字は、テキストとしてそのまま表示する */}
                <span className="whitespace-pre-wrap">{m.body}</span>
              </li>
            );
          })}
        </ul>
        {canSend ? (
          <>
            <p className="text-xs text-muted">メッセージで話し合っても、量・金額・納品日は変わりません。変えるときは、農家さんの「条件変更の提案」を使います。</p>
            <MessageForm orderId={order.id} />
          </>
        ) : (
          <p className="text-sm text-muted">この注文は終わったので、メッセージは読むだけです。</p>
        )}
      </section>
    </div>
  );
}
