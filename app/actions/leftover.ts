"use server";
// 売れ残りのときの操作（サーバー側で動く。生産者だけ）

import { refresh } from "next/cache";
import { closeListing, continueSale, notifyWanted } from "@/lib/leftover";
import { requireProducer } from "@/lib/session";

export type LeftoverState = { message?: string; ok?: boolean };

const daysOf = (formData: FormData) => {
  const text = String(formData.get("days") ?? "");
  return text === "" ? null : Number(text);
};

export async function notifyAction(_state: LeftoverState, formData: FormData): Promise<LeftoverState> {
  const user = await requireProducer();
  const result = await notifyWanted(user.id, String(formData.get("listingId") ?? ""), daysOf(formData));
  if (result.ok) refresh();
  return { ok: result.ok, message: result.message };
}

export async function continueAction(_state: LeftoverState, formData: FormData): Promise<LeftoverState> {
  const user = await requireProducer();
  const result = await continueSale(user.id, String(formData.get("listingId") ?? ""), daysOf(formData) ?? 0);
  if (result.ok) refresh();
  return { ok: result.ok, message: result.ok ? "受付期限を延ばしました" : result.message };
}

export async function closeAction(_state: LeftoverState, formData: FormData): Promise<LeftoverState> {
  const user = await requireProducer();
  const result = await closeListing(user.id, String(formData.get("listingId") ?? ""));
  if (result.ok) refresh();
  return { ok: result.ok, message: result.ok ? "受付を終了しました" : result.message };
}
