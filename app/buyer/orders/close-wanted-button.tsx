"use client";
// 「探しています」を取り下げるボタン（自分のものかは、サーバーで確かめる）

import { useActionState } from "react";
import { closeWanted, type WantedFormState } from "@/app/actions/wanted";

export function CloseWantedButton({ wantedId }: { wantedId: string }) {
  const [state, action, pending] = useActionState<WantedFormState, FormData>(closeWanted, {});
  return (
    <form action={action}>
      <input type="hidden" name="wantedId" value={wantedId} />
      <button type="submit" disabled={pending} className="text-sm text-muted underline disabled:opacity-60">
        {pending ? "取り下げています…" : "取り下げる"}
      </button>
      {state.message && <p className="text-sm text-red-700 dark:text-red-400">{state.message}</p>}
    </form>
  );
}
