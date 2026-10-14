// マイページ（ログインした人だけが見られる）
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { AuthShell } from "@/app/ui/auth-shell";
import { prisma } from "@/lib/prisma";
import { gramsToKgText } from "@/lib/quantity";
import { deliveryBands } from "@/lib/fees";
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
      <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-5">
        <p className={`w-fit rounded-full px-3 py-0.5 text-sm font-medium ${user.role === "producer" ? "bg-earth-soft text-earth" : "bg-leaf-soft text-leaf"}`}>
          {roleLabel[user.role]}
        </p>
        {/* 名前は利用者が入力したものなので、テキストとしてそのまま表示する */}
        <p className="text-xl font-bold">{user.name} さん</p>
      </div>
      {user.role === "producer" && <ProducerProfileSummary userId={user.id} />}
      {user.role === "buyer" && <BuyerProfileSummary userId={user.id} />}
      <form action={signOut}>
        <button type="submit" className="w-full rounded-xl border border-line px-4 py-3 font-bold">
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
      <div className="flex flex-col gap-3 rounded-2xl border border-earth bg-earth-soft p-5">
        <p className="font-bold">はじめに、生産者プロフィールを作りましょう</p>
        <p className="text-sm text-muted">畑の地域やこだわりは、お店があなたを知る手がかりになります。</p>
        <Link href="/producer/profile" className="rounded-xl bg-earth px-4 py-3 text-center font-bold text-white">
          プロフィールを作る
        </Link>
      </div>
    );
  }
  return (
    <>
    <Link href="/producer/orders" className="rounded-xl bg-earth px-4 py-3 text-center font-bold text-white">
      申し込みの一覧
    </Link>
    <Link href="/producer/listings" className="rounded-xl border border-earth px-4 py-3 text-center font-bold text-earth">
      出品一覧・新しく出品する
    </Link>
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
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
        <dt className="text-muted">お試しの量</dt>
        <dd>{gramsToKgText(profile.trialAmountG)}kg</dd>
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
      </dl>
      <Link href="/producer/profile" className="rounded-xl border border-line px-4 py-3 text-center font-bold">
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
      <div className="flex flex-col gap-3 rounded-2xl border border-leaf bg-leaf-soft p-5">
        <p className="font-bold">はじめに、お店のプロフィールを作りましょう</p>
        <p className="text-sm text-muted">お店の地域から、近くの農家さんの出品を探せるようになります。</p>
        <Link href="/buyer/profile" className="rounded-xl bg-leaf px-4 py-3 text-center font-bold text-white">
          プロフィールを作る
        </Link>
      </div>
    );
  }
  return (
    <>
    <Link href="/buyer/search" className="rounded-xl bg-leaf px-4 py-3 text-center font-bold text-white">
      仕入れ候補を探す
    </Link>
    <Link href="/buyer/orders" className="rounded-xl border border-leaf px-4 py-3 text-center font-bold text-leaf">
      自分の注文
    </Link>
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <p className="font-bold">お店のプロフィール</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">お店の地域</dt>
        <dd>{profile.prefecture} {profile.city}</dd>
        <dt className="text-muted">届け先</dt>
        <dd>{profile.address}</dd>
      </dl>
      <Link href="/buyer/profile" className="rounded-xl border border-line px-4 py-3 text-center font-bold">
        プロフィールを編集する
      </Link>
    </div>
    </>
  );
}
