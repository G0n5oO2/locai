// 入力欄の見た目をそろえるための部品（ラベル・入力欄・エラー表示）
import type { InputHTMLAttributes } from "react";
import { RequiredMark } from "./required-mark";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  // 入力が必須なら true（ラベルの横に赤い「必須」のしるしを出す。確かめはサーバーで行う）
  required?: boolean;
};

export function Field({ label, name, errors, required, ...inputProps }: Props) {
  const errorId = `${name}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-bold">
        {label}
        {required && <RequiredMark />}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={errors ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={errors ? errorId : undefined}
        className="rounded-xl border border-line bg-surface px-3 py-3 text-base"
        {...inputProps}
      />
      {errors && (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
