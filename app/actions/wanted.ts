"use server";
// 「探しています」の公開・取り下げ（サーバー側で動く。飲食店だけ）

import { refresh } from "next/cache";
import { z } from "zod";
import { suggestSubstitutes, type SubstituteSuggestion } from "@/lib/ai-substitutes";
import { jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { kgTextToGrams } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";

export type WantedFormState = { message?: string; done?: boolean };

const wantedSchema = z.object({
  kind: z.enum(["specified", "substitute", "any"], { error: "食材の種類を選んでください" }),
  vegetable: z.string().trim().max(50),
  // 代替野菜は「、」か「,」で区切って5つまで
  substitutes: z.string().trim().max(200),
  quantity: z.string(),
  useDate: z.string(),
  method: z.enum(["delivery", "self", "pickup"]),
});

export async function publishWanted(_state: WantedFormState, formData: FormData): Promise<WantedFormState> {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { message: "先に、お店のプロフィールで地域を登録してください" };

  const parsed = wantedSchema.safeParse(Object.fromEntries(["kind", "vegetable", "substitutes", "quantity", "useDate", "method"].map((f) => [f, String(formData.get(f) ?? "")])));
  if (!parsed.success) return { message: "入力を確かめてください" };
  const d = parsed.data;

  const quantityG = kgTextToGrams(d.quantity);
  const useDate = parseDate(d.useDate);
  if (quantityG === null || quantityG < 500 || quantityG > 1_000_000) return { message: "希望数量を確かめてください" };
  if (!useDate || d.useDate < jstDateText(new Date())) return { message: "使用日を確かめてください" };
  if (d.kind !== "any" && d.vegetable === "") return { message: "食材を入れて探してから公開してください（種類を問わないときは「種類を問わない」を選びます）" };

  const substitutes = d.kind === "substitute" ? [...new Set(d.substitutes.split(/[、,]/).map((x) => x.trim()).filter(Boolean))] : [];
  if (d.kind === "substitute" && substitutes.length === 0) return { message: "代わりに使える野菜を1つ以上入れてください" };
  if (substitutes.length > 5 || substitutes.some((x) => x.length > 30)) return { message: "代わりの野菜は、30文字以内で5つまでにしてください" };

  await prisma.wantedRequest.create({
    data: {
      buyerId: user.id,
      kind: d.kind,
      vegetable: d.kind === "any" ? "" : d.vegetable,
      substitutes,
      quantityG,
      useDate,
      method: d.method,
      prefecture: profile.prefecture,
      city: profile.city,
    },
  });
  return { done: true };
}

// 自分の「探しています」を取り下げる（他人のものは取り下げられない）
export async function closeWanted(_state: WantedFormState, formData: FormData): Promise<WantedFormState> {
  const user = await requireBuyer();
  const id = String(formData.get("wantedId") ?? "");
  const result = await prisma.wantedRequest.updateMany({ where: { id, buyerId: user.id, closed: false }, data: { closed: true } });
  if (result.count === 0) return { message: "見つかりませんでした" };
  refresh();
  return { done: true };
}

export type SuggestState = { suggestions?: SubstituteSuggestion[]; message?: string };

// AI に代わりの野菜を提案してもらう（AI は提案だけ。選ぶのはお店）
export async function suggestAction(_state: SuggestState, formData: FormData): Promise<SuggestState> {
  const user = await requireBuyer();
  const vegetable = String(formData.get("vegetable") ?? "").trim().slice(0, 50);
  const usage = String(formData.get("usage") ?? "").trim().slice(0, 50);
  if (vegetable === "") return { message: "食材を入れて探してから使ってください" };
  const suggestions = await suggestSubstitutes(user.id, vegetable, usage);
  // AI が使えなくても、自分で入力すれば公開できる
  if (!suggestions || suggestions.length === 0) return { message: "今は AI の提案を出せませんでした。代わりの野菜を自分で入力してください" };
  return { suggestions };
}
