// 新規登録の画面
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { SignUpForm } from "./signup-form";

export default function SignUpPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell title="新規登録">
      {/* URL の ?role=... はアクセスのたびに変わるので、読み込み中の表示を用意しておく */}
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <SignUpFormWithRole searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

// 紹介画面のボタンから来たときは、立場を最初から選んでおく
async function SignUpFormWithRole({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  const { role } = await searchParams;
  return <SignUpForm initialRole={typeof role === "string" ? role : ""} />;
}
