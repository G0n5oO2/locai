// マイページ（ログインした人だけが見られる）
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { deliveryBands } from "@/lib/fees";
import { methodLabel } from "@/lib/burden";
import { paymentLabel } from "@/lib/payment";
import { requireUser } from "@/lib/session";

const roleLabel = { producer: "生産者", buyer: "飲食店" } as const;

export default function MyPage() {
  return (
    <AuthShell title="マイページ">
      {/* ログイン中の人の情報はアクセスのたびに読むので、読み込み中の表示を用意しておく */}
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Profile />
      </Suspense>
    </AuthShell>
  );
}

async function Profile() {
  // ログインしていなければ、ここでログイン画面へ移動する
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 card p-5">
        <p className={`w-fit rounded-full px-3 py-0.5 text-sm font-medium ${user.role === "producer" ? "bg-earth-soft text-earth" : "bg-leaf-soft text-leaf"}`}>
          {roleLabel[user.role]}
        </p>
        {/* 名前は利用者が入力したものなので、テキストとしてそのまま表示する */}
        <p className="text-xl font-bold">{user.name} さん</p>
      </div>
      {user.role === "producer" && <ProducerProfileSummary userId={user.id} />}
      {user.role === "buyer" && <BuyerProfileSummary userId={user.id} />}
      <form action={signOut}>
        <button type="submit" className="w-full btn btn-plain">
          ログアウト
        </button>
      </form>
    </div>
  );
}

// 生産者プロフィールのまとめ（まだ作っていなければ、作る画面への入口を出す）
async function ProducerProfileSummary({ userId }: { userId: string }) {
  const profile = await prisma.producerProfile.findUnique({ where: { userId } });
  if (!profile) {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-earth bg-earth-soft p-5">
        <p className="font-bold">はじめに、生産者プロフィールを作りましょう</p>
        <p className="text-sm text-muted">畑の地域やこだわりは、お店があなたを知る手がかりになります。</p>
        <Link href="/producer/profile" className="btn btn-earth">
          プロフィールを作る
        </Link>
      </div>
    );
  }
  return (
    <>
    <Link href="/producer/orders" className="btn btn-earth">
      申し込みの一覧
    </Link>
    <Link href="/producer/listings" className="btn btn-outline-earth">
      出品一覧・新しく出品する
    </Link>
    <Link href="/producer/wanted" className="btn btn-outline-earth">
      近くの「探しています」
    </Link>
    <div className="flex flex-col gap-3 card p-5">
      <p className="font-bold">生産者プロフィール</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">畑の地域</dt>
        <dd>{profile.prefecture} {profile.city}</dd>
        <dt className="text-muted">品目</dt>
        <dd>{profile.items}</dd>
        <dt className="text-muted">こだわり</dt>
        <dd className="whitespace-pre-wrap">{profile.commitment}</dd>
        <dt className="text-muted">1回の出荷</dt>
        <dd>宅配 {profile.shipLimitDelivery}件・配達 {profile.shipLimitSelf}件・引き取り {profile.shipLimitPickup}件まで</dd>
        <dt className="text-muted">宅配の送料</dt>
        <dd>
          {deliveryBands(profile).length === 0
            ? "宅配しない"
            : deliveryBands(profile).map((b) => `${gramsToKgText(b.maxG)}kg まで ${b.yen.toLocaleString()}円`).join("、")}
        </dd>
        <dt className="text-muted">配達料</dt>
        <dd>{profile.selfDeliveryYen === null ? "配達しない" : `${profile.selfDeliveryYen.toLocaleString()}円（1件あたり）`}</dd>
        <dt className="text-muted">引き取り</dt>
        <dd>{profile.pickupPlace === null ? "引き取りなし" : profile.pickupPlace}</dd>
        <dt className="text-muted">支払方法</dt>
        <dd>{profile.paymentMethods.length === 0 ? "まだ設定していません（お店とはメッセージで相談）" : profile.paymentMethods.map((m) => paymentLabel[m]).join("、")}</dd>
      </dl>
      <Link href="/producer/profile" className="btn btn-plain">
        プロフィールを編集する
      </Link>
    </div>
    </>
  );
}

// 飲食店プロフィールのまとめ（まだ作っていなければ、作る画面への入口を出す）
async function BuyerProfileSummary({ userId }: { userId: string }) {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-leaf bg-leaf-soft p-5">
        <p className="font-bold">はじめに、お店のプロフィールを作りましょう</p>
        <p className="text-sm text-muted">お店の地域から、近くの農家さんの出品を探せるようになります。</p>
        <Link href="/buyer/profile" className="btn btn-leaf">
          プロフィールを作る
        </Link>
      </div>
    );
  }
  return (
    <>
    <Link href="/buyer/search" className="btn btn-leaf">
      仕入れ候補を探す
    </Link>
    <Link href="/buyer/orders" className="btn btn-outline-leaf">
      自分の注文
    </Link>
    <BuyerNotices userId={userId} />
    <div className="flex flex-col gap-3 card p-5">
      <p className="font-bold">お店のプロフィール</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">お店の地域</dt>
        <dd>{profile.prefecture} {profile.city}</dd>
        <dt className="text-muted">届け先</dt>
        <dd>{profile.address}</dd>
      </dl>
      <Link href="/buyer/profile" className="btn btn-plain">
        プロフィールを編集する
      </Link>
    </div>
    </>
  );
}

// 農家さんからのお知らせ：「探しています」に合う売れ残りの出品（受付中のものだけ）
async function BuyerNotices({ userId }: { userId: string }) {
  const notices = await prisma.listingNotice.findMany({
    where: { buyerId: userId, listing: { status: "open", acceptUntil: { gt: new Date() } } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { listing: { include: { producer: { select: { name: true, profile: { select: { prefecture: true, city: true } } } } } } },
  });
  if (notices.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="section-title">お知らせ</h2>
      {notices.map(({ id, listing: l }) => (
        <div key={id} className="flex flex-col gap-1 rounded-3xl border border-leaf bg-leaf-soft p-4 text-sm">
          <p className="font-bold">あなたの「探しています」に合う出品があります</p>
          <p>
            {l.vegetable}・{gramsToKgText(l.unitG)}kg あたり {l.unitPriceYen.toLocaleString()}円（{l.producer.name}・{l.producer.profile?.prefecture} {l.producer.profile?.city}）
          </p>
          <p className="text-muted">
            受け渡し：{[l.offersDelivery && methodLabel.delivery, l.offersSelf && methodLabel.self, l.offersPickup && methodLabel.pickup].filter(Boolean).join("／")}
          </p>
          <Link href={`/buyer/listings/${l.id}`} className="mt-1 btn btn-sm btn-leaf">
            出品を見る
          </Link>
        </div>
      ))}
    </section>
  );
}
