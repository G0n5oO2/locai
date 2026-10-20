// ログインしている人が、入口の画面（最初の画面・ログイン・新規登録）を開いたら、自分のホームへ移動させる
// ログインしているかはアクセスのたびに調べるので、Suspense の中で使う（調べているあいだは何も出さない）
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";

async function Check() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "producer" ? "/producer/home" : "/buyer/home");
  return null;
}

export function RedirectIfSignedIn() {
  return (
    <Suspense fallback={null}>
      <Check />
    </Suspense>
  );
}
