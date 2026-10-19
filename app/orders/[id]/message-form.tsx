"use client";
// メッセージの入力欄（送ってよいかは、サーバーで確かめる）

import { useActionState } from "react";
import { sendMessageAction, type MessageState } from "@/app/actions/message";

export function MessageForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<MessageState, FormData>(sendMessageAction, {});
  return (
    // 送れたら key が変わって、入力欄が空に戻る
    <form key={state.sent ?? 0} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="body" className="text-sm font-bold">メッセージ（500文字まで）</label>
      <textarea id="body" name="body" rows={3} maxLength={500} placeholder="例：お支払いは振込でよいですか？" className="rounded-xl border border-line bg-surface px-3 py-3 text-base" />
      {state.message && <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "送っています…" : "送る"}
      </button>
    </form>
  );
}
