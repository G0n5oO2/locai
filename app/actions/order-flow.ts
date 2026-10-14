"use server";
// 注文の状態を変える操作（サーバー側で動く）。本人か・表にある動きかは lib/order-flow.ts で確かめる

import { refresh } from "next/cache";
import { z } from "zod";
import { approveOrder, declineOrder, type FlowResult } from "@/lib/order-flow";
import { requireProducer } from "@/lib/session";

export type FlowState = { message?: string; done?: boolean };

const idSchema = z.string().min(1).max(100);

async function run(formData: FormData, fn: (orderId: string) => Promise<FlowResult>): Promise<FlowState> {
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { message: "注文が見つかりません" };
  const result = await fn(orderId.data);
  if (!result.ok) return { message: result.message };
  // 画面を最新の状態にする
  refresh();
  return { done: true };
}

// 承認（生産者だけ）
export async function approveAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireProducer();
  return run(formData, (orderId) => approveOrder(user.id, orderId));
}

// 見送り（生産者だけ）
export async function declineAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireProducer();
  return run(formData, (orderId) => declineOrder(user.id, orderId));
}
