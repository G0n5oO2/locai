"use server";
// 出品を探す処理（サーバー側で動く）

import { z } from "zod";
import { jstDateText, parseDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { kgTextToGrams } from "@/lib/quantity";
import { searchListings, type SearchResult } from "@/lib/search";
import { requireBuyer } from "@/lib/session";

export type SearchFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  values?: Record<string, string>;
  result?: SearchResult;
};

const searchSchema = z.object({
  // 空なら「種類を問わない」
  vegetable: z.string().trim().max(50, "50文字以内にしてください"),
  quantity: z.string().transform((text, ctx) => {
    const grams = kgTextToGrams(text);
    if (grams === null || grams < 500 || grams > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "希望数量は 0.5〜1,000kg を 0.1kg 単位で入力してください" });
      return z.NEVER;
    }
    return grams;
  }),
  budget: z.string().transform((text, ctx) => {
    if (!/^\d{1,6}$/.test(text.trim()) || Number(text) < 1 || Number(text) > 100000) {
      ctx.addIssue({ code: "custom", message: "予算は 1〜100,000 円の整数で入力してください" });
      return z.NEVER;
    }
    return Number(text);
  }),
  useDate: z.string().transform((text, ctx) => {
    const date = parseDate(text);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "使用日を入力してください" });
      return z.NEVER;
    }
    return date;
  }),
  method: z.enum(["delivery", "self", "pickup"], { error: "受け取り方法を選んでください" }),
});

export async function search(_state: SearchFormState, formData: FormData): Promise<SearchFormState> {
  const user = await requireBuyer();
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { message: "先に、お店のプロフィールで地域を登録してください" };

  const values = Object.fromEntries(["vegetable", "quantity", "budget", "useDate", "method"].map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = searchSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const d = parsed.data;
  if (jstDateText(new Date()) > values.useDate) return { errors: { useDate: ["使用日は、今日以降にしてください"] }, values };

  const result = await searchListings({
    buyerId: user.id,
    buyerPrefecture: profile.prefecture,
    buyerCity: profile.city,
    vegetable: d.vegetable,
    quantityG: d.quantity,
    budgetYen: d.budget,
    useDate: d.useDate,
    method: d.method,
  });
  return { values, result };
}
