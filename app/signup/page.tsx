// 新規登録の画面
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { EntranceBackdrop } from "@/app/ui/entrance-backdrop";
import { RedirectIfSignedIn } from "@/app/ui/redirect-if-signed-in";
import { SignUpForm } from "./signup-form";
import { Loading } from "@/app/ui/loading";

export default function SignUpPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell title="新規登録">
      {/* 入口の画面の背景（空と、ふわふわ浮かぶ野菜） */}
      <EntranceBackdrop />
      {/* ログインしている人は、自分のホームへ */}
      <RedirectIfSignedIn />
      {/* URL の ?role=... はアクセスのたびに変わるので、読み込み中の表示を用意しておく */}
      <div className="card p-5">
        <Suspense fallback={<Loading />}>
          <SignUpFormWithRole searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthShell>
  );
}

// 紹介画面のボタンから来たときは、立場を最初から選んでおく
async function SignUpFormWithRole({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const { role } = await searchParams;
  return <SignUpForm initialRole={typeof role === "string" ? role : ""} />;
}
