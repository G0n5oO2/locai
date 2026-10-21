"use server";
// 登録・ログイン・ログアウトの処理（サーバー側で動く）
// 画面から送られてきた値は信用せず、ここで必ず確かめる

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth, roleSchema } from "@/lib/auth";

// 画面に返す内容：項目ごとのエラー、全体のエラー、入力済みの値（入力し直さなくてよいように）
export type AuthFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  values?: Record<string, string>;
};

const signUpSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(50, "名前は50文字以内にしてください"),
  email: z.email("メールアドレスの形が正しくありません").max(254),
  password: z.string().min(8, "パスワードは8文字以上にしてください").max(128, "パスワードは128文字以内にしてください"),
  role: z.enum(roleSchema.options, { error: "生産者か飲食店かを選んでください" }),
});

const signInSchema = z.object({
  email: z.email("メールアドレスの形が正しくありません").max(254),
  password: z.string().min(1, "パスワードを入力してください").max(128),
});

// フォームの値を文字列として取り出す
function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    role: text(formData, "role"),
  };
  // パスワードは画面に戻さない
  const values = { name: input.name, email: input.email, role: input.role };

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError && error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      return { errors: { email: ["このメールアドレスはすでに登録されています"] }, values };
    }
    return { message: "登録できませんでした。時間をおいてもう一度お試しください。", values };
  }
  // redirect は try の外で呼ぶ（中で呼ぶとエラーとして扱われてしまうため）
  redirect("/mypage");
}

export async function signIn(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const input = { email: text(formData, "email"), password: text(formData, "password") };
  const values = { email: input.email };

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  let role: unknown;
  try {
    const result = await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
    role = (result.user as { role?: unknown }).role;
  } catch {
    // どちらが違うかは教えない（他人のメールアドレスが登録済みか分からないようにするため）
    return { message: "メールアドレスかパスワードが違います", values };
  }
  // ログインしたら、立場に合ったホームへ（第2版）。立場が分からないときはマイページへ
  const checked = roleSchema.safeParse(role);
  // 「ログインしたばかり」の印（welcome=1）を付けて、ホームで通知を出す
  redirect(!checked.success ? "/mypage" : checked.data === "producer" ? "/producer/home?welcome=1" : "/buyer/home?welcome=1");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
