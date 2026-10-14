"use client";
// 注文の確認ポイント（アプリの決まりで見つけたもの）と、AI のまとめ

import { useActionState } from "react";
import { summarizeAction, type SummaryState } from "@/app/actions/order-flow";

export function OrderChecks({ orderId, checks }: { orderId: string; checks: string[] }) {
  const [state, action, pending] = useActionState<SummaryState, FormData>(summarizeAction, {});
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-earth-soft p-3">
      <p className="font-bold">確認ポイント</p>
      {checks.length === 0 ? (
        <p>特に気をつける点はありません。</p>
      ) : (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {checks.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {/* AI は、上の確認ポイントを短い文にまとめるだけ（承認・見送りは決めない） */}
      {state.summary ? (
        <p className="rounded-lg bg-surface p-2">
          <span className="text-xs text-muted">AI のまとめ：</span>
          {state.summary}
        </p>
      ) : (
        <form action={action}>
          <input type="hidden" name="orderId" value={orderId} />
          <button type="submit" disabled={pending} className="text-sm font-bold text-earth underline disabled:opacity-60">
            {pending ? "AI がまとめています…" : "AI で短くまとめる"}
          </button>
        </form>
      )}
      {state.message && <p className="text-xs">{state.message}</p>}
    </div>
  );
}
