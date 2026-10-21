"use client";
// 承認・見送りのボタン（本当に変えてよいかは、サーバーで確かめる）

import { useActionState } from "react";
import { approveAction, declineAction, type FlowState } from "@/app/actions/order-flow";

// declineOnly：見送るボタンだけを出す（送料が要相談の注文は、承認の前に送料を提案するため）
export function OrderButtons({ orderId, declineOnly = false }: { orderId: string; declineOnly?: boolean }) {
  const [approveState, approve, approving] = useActionState<FlowState, FormData>(approveAction, {});
  const [declineState, decline, declining] = useActionState<FlowState, FormData>(declineAction, {});
  const busy = approving || declining;
  const message = approveState.message ?? declineState.message;

  return (
    <div className="flex flex-col gap-2">
      <div className={`grid gap-2 ${declineOnly ? "grid-cols-1" : "grid-cols-2"}`}>
        {!declineOnly && (
          <form action={approve}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={busy} className="w-full btn btn-sm btn-earth">
              {approving ? "承認しています…" : "承認する"}
            </button>
          </form>
        )}
        <form action={decline}>
          <input type="hidden" name="orderId" value={orderId} />
          <button type="submit" disabled={busy} className="w-full btn btn-sm btn-plain">
            {declining ? "見送っています…" : "見送る"}
          </button>
        </form>
      </div>
      {message && <p className="text-sm text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}
