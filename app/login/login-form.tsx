"use client";
// ログインのフォーム（確かめはサーバー側の signIn で行う）

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/app/actions/auth";
import { Field } from "@/app/ui/field";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="メールアドレス" required name="email" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.errors?.email} />
      <Field label="パスワード" required name="password" type="password" autoComplete="current-password" errors={state.errors?.password} />

      {state.message && <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>}

      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "ログインしています…" : "ログインする"}
      </button>
      <p className="text-center text-sm text-muted">
        はじめての方は <Link href="/signup" className="font-bold text-leaf underline">新規登録</Link>
      </p>
    </form>
  );
}
