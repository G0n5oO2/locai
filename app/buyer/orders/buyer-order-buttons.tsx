"use client";
// お店の操作ボタン：提案に同意・断る、取消（本当にできるかは、サーバーで確かめる）

import { useActionState } from "react";
import { acceptAction, cancelAction, refuseAction, type FlowState } from "@/app/actions/order-flow";

type Props = { orderId: string; canRespond: boolean; refuseLabel: string };

export function BuyerOrderButtons({ orderId, canRespond, refuseLabel }: Props) {
  const [acceptState, accept, accepting] = useActionState<FlowState, FormData>(acceptAction, {});
  const [refuseState, refuse, refusing] = useActionState<FlowState, FormData>(refuseAction, {});
  const [cancelState, cancel, cancelling] = useActionState<FlowState, FormData>(cancelAction, {});
  const busy = accepting || refusing || cancelling;
  const message = acceptState.message ?? refuseState.message ?? cancelState.message;

  return (
    <div className="flex flex-col gap-2">
      {canRespond && (
        <div className="grid grid-cols-2 gap-2">
          <form action={accept}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={busy} className="w-full btn btn-sm btn-leaf">
              {accepting ? "送っています…" : "提案に同意する"}
            </button>
          </form>
          <form action={refuse}>
            <input type="hidden" name="orderId" value={orderId} />
            <button type="submit" disabled={busy} className="w-full btn btn-sm btn-plain">
              {refusing ? "送っています…" : refuseLabel}
            </button>
          </form>
        </div>
      )}
      <form action={cancel}>
        <input type="hidden" name="orderId" value={orderId} />
        <button type="submit" disabled={busy} className="w-full rounded-xl px-3 py-2 text-sm text-muted underline disabled:opacity-60">
          {cancelling ? "取り消しています…" : "この購入希望を取り消す"}
        </button>
      </form>
      {message && <p className="text-sm text-red-700 dark:text-red-400">{message}</p>}
    </div>
  );
}
