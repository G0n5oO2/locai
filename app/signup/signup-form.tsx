"use client";
// 新規登録のフォーム（入力と表示だけ。確かめと保存はサーバー側の signUp で行う）

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/app/actions/auth";
import { Field } from "@/app/ui/field";
import { RequiredMark } from "@/app/ui/required-mark";

const roles = [
  { value: "producer", label: "生産者", note: "野菜を出品して販売する" },
  { value: "buyer", label: "飲食店", note: "野菜を仕入れる" },
] as const;

export function SignUpForm({ initialRole }: { initialRole: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUp, {});
  const role = state.values?.role ?? initialRole;

  return (
    <form action={action} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">立場（あとから変えられません）<RequiredMark /></legend>
        <div className="grid grid-cols-2 gap-3">
          {roles.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer flex-col gap-1 rounded-xl border border-line bg-surface p-3 has-checked:border-leaf has-checked:bg-leaf-soft"
            >
              <span className="flex items-center gap-2 font-bold">
                <input type="radio" name="role" value={r.value} defaultChecked={role === r.value} />
                {r.label}
              </span>
              <span className="text-xs text-muted">{r.note}</span>
            </label>
          ))}
        </div>
        {state.errors?.role && <p className="text-sm text-red-700 dark:text-red-400">{state.errors.role[0]}</p>}
      </fieldset>

      <Field label="名前（お店の名前・農園の名前など）" required name="name" autoComplete="name" defaultValue={state.values?.name} errors={state.errors?.name} />
      <Field label="メールアドレス" required name="email" type="email" autoComplete="email" defaultValue={state.values?.email} errors={state.errors?.email} />
      <Field label="パスワード（8文字以上）" required name="password" type="password" autoComplete="new-password" errors={state.errors?.password} />

      {state.message && <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>}

      {/* 送信中はボタンを押せなくして、二重登録を防ぐ */}
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "登録しています…" : "登録する"}
      </button>
      <p className="text-center text-sm text-muted">
        登録済みの方は <Link href="/login" className="font-bold text-leaf underline">ログイン</Link>
      </p>
    </form>
  );
}
