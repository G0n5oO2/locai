// いまログインしている人を調べる部品（どの画面・処理からも、ここを通して確かめる）
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, roleSchema, type Role } from "./auth";

export type CurrentUser = { id: string; name: string; role: Role };

// ログインしていなければ null を返す
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  // 立場がデータベースにある値と合っているかも確かめる
  const role = roleSchema.safeParse(session.user.role);
  if (!role.success) return null;
  // 画面に渡すのは、必要な3つだけ（メールアドレスなどは渡さない）
  return { id: session.user.id, name: session.user.name, role: role.data };
}

// ログインしていなければ、ログイン画面へ移動させる
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// 生産者だけが使える画面・処理で使う。生産者でなければマイページへ戻す
export async function requireProducer(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "producer") redirect("/mypage");
  return user;
}
