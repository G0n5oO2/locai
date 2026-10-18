"use server";
// メッセージを送る（サーバー側で動く）。当事者か・送れる状態かは lib/messages.ts で確かめる

import { refresh } from "next/cache";
import { z } from "zod";
import { sendMessage, totalUnread } from "@/lib/messages";
import { getCurrentUser, requireUser } from "@/lib/session";

export type MessageState = { message?: string; sent?: number };

const bodySchema = z.string().trim().min(1, "メッセージを入力してください").max(500, "500文字以内にしてください");

export async function sendMessageAction(state: MessageState, formData: FormData): Promise<MessageState> {
  const user = await requireUser();
  const body = bodySchema.safeParse(formData.get("body") ?? "");
  if (!body.success) return { message: body.error.issues[0].message };
  const result = await sendMessage(user.id, String(formData.get("orderId") ?? ""), body.data);
  if (!result.ok) return { message: result.message };
  refresh();
  // 送れたら数を増やす（入力欄を空に戻すのに使う）
  return { sent: (state.sent ?? 0) + 1 };
}

// 自分あての未読メッセージの数（ナビゲーションバーが画面を移動するたびに聞きに来る）
// 外から直接呼ばれても、ログイン中の本人の数しか返さない
export async function unreadCountAction(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return totalUnread(user.id);
}
