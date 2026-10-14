// マイページ（ログインした人だけが見られる）
import { Suspense } from "react";
import { signOut } from "@/app/actions/auth";
import { AuthShell } from "@/app/ui/auth-shell";
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
      <form action={signOut}>
        <button type="submit" className="w-full rounded-xl border border-line px-4 py-3 font-bold">
          ログアウト
        </button>
      </form>
    </div>
  );
}
