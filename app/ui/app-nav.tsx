// ナビゲーションバーの入口（第2版 4-1）
// ログインしている人の立場を調べて、生産者用・飲食店用のバーを出し分ける
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";
import { NavBar } from "./nav-bar";

export function AppNav() {
  // ログイン中の人はアクセスのたびに調べるので、Suspense の中に入れる（読み込み中は何も出さない）
  return (
    <Suspense fallback={null}>
      <RoleNav />
    </Suspense>
  );
}

async function RoleNav() {
  const user = await getCurrentUser();
  // ログインしていない人（最初の画面・ログイン画面）には、バーを出さない
  if (!user) return null;
  return <NavBar role={user.role} />;
}
