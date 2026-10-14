"use server";
// 飲食店プロフィールの保存（サーバー側で動く）

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findMunicipality } from "@/lib/region";
import { requireBuyer } from "@/lib/session";

export type BuyerProfileFormState = {
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

const buyerProfileSchema = z.object({
  prefecture: z.string().min(1, "府県を選んでください"),
  city: z.string().min(1, "市区町村を選んでください"),
  address: z.string().trim().min(1, "届け先の住所を入力してください").max(200, "200文字以内にしてください"),
});

export async function saveBuyerProfile(_state: BuyerProfileFormState, formData: FormData): Promise<BuyerProfileFormState> {
  // 誰のプロフィールかは、ログイン中の人で決める
  const user = await requireBuyer();

  const values = {
    prefecture: String(formData.get("prefecture") ?? ""),
    city: String(formData.get("city") ?? ""),
    address: String(formData.get("address") ?? ""),
  };
  const parsed = buyerProfileSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  if (!findMunicipality(parsed.data.prefecture, parsed.data.city)) {
    return { errors: { city: ["一覧から市区町村を選んでください"] }, values };
  }

  await prisma.buyerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });
  redirect("/mypage");
}
