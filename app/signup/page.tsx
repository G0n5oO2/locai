// 新規登録の画面
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { EntranceBackdrop } from "@/app/ui/entrance-backdrop";
import { SignUpForm } from "./signup-form";

export default function SignUpPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell title="新規登録">
      {/* 入口の画面の背景（空と、ふわふわ浮かぶ野菜） */}
      <EntranceBackdrop />
      {/* URL の ?role=... はアクセスのたびに変わるので、読み込み中の表示を用意しておく */}
      <div className="card p-5">
        <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
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
