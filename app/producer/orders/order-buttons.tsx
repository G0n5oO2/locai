"use client";
// 承認・見送りのボタン（本当に変えてよいかは、サーバーで確かめる）

import { useActionState } from "react";
import { approveAction, declineAction, type FlowState } from "@/app/actions/order-flow";

export function OrderButtons({ orderId }: { orderId: string }) {
  const [approveState, approve, approving] = useActionState<FlowState, FormData>(approveAction, {});
  const [declineState, decline, declining] = useActionState<FlowState, FormData>(declineAction, {});
  const busy = approving || declining;
  const message = approveState.message ?? declineState.message;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <form action={approve}>
          <input type="hidden" name="orderId" value={orderId} />
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-earth px-3 py-2 font-bold text-white disabled:opacity-60">
            {approving ? "承認しています…" : "承認する"}
          </button>
        </form>
        <form action={decline}>
          <input type="hidden" name="orderId" value={orderId} />
          <button type="submit" disabled={busy} className="w-full rounded-xl border border-line px-3 py-2 font-bold disabled:opacity-60">
            {declining ? "見送っています…" : "見送る"}
          </button>
        </form>
      </div>
      {message && <p className="text-sm text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}
