// ナビゲーションバーの入口（第2版 4-1）
// ログインしている人の立場を調べて、生産者用・飲食店用のバーを出し分ける
// バーはいつも置いておき、ログインしていないときは何も出さない（画面を移動するたびに、バーが自分で聞き直す）
import { Suspense } from "react";
import { totalUnread } from "@/lib/messages";
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
  // 最初に表示するときの立場と未読の数（ログインしていなければ立場は null で、バーは出ない）
  const unread = user ? await totalUnread(user.id) : 0;
  return <NavBar initialRole={user?.role ?? null} initialUnread={unread} />;
}
