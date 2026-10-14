"use server";
// 生産者プロフィールの保存（サーバー側で動く）

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { kgTextToGrams } from "@/lib/quantity";
import { findMunicipality } from "@/lib/region";
import { requireProducer } from "@/lib/session";

export type ProfileFormState = {
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

// 1回の出荷で何件まで：1〜100 の整数
const shipLimit = z.coerce
  .number({ error: "数字を入力してください" })
  .int("整数で入力してください")
  .min(1, "1件以上にしてください")
  .max(100, "100件以内にしてください");

const profileSchema = z.object({
  prefecture: z.string().min(1, "府県を選んでください"),
  city: z.string().min(1, "市区町村を選んでください"),
  items: z.string().trim().min(1, "栽培している品目を入力してください").max(200, "200文字以内にしてください"),
  commitment: z.string().trim().min(1, "こだわりを入力してください").max(500, "500文字以内にしてください"),
  shipLimitDelivery: shipLimit,
  shipLimitSelf: shipLimit,
  shipLimitPickup: shipLimit,
  // お試しの量：0.5〜10kg（g の整数に変えてから確かめる）
  trialAmount: z
    .string()
    .transform((text, ctx) => {
      const grams = kgTextToGrams(text);
      if (grams === null) {
        ctx.addIssue({ code: "custom", message: "0.1kg 単位の数字で入力してください（例：0.5）" });
        return z.NEVER;
      }
      return grams;
    })
    .pipe(z.number().min(500, "0.5kg 以上にしてください").max(10000, "10kg 以内にしてください")),
});

const fields = ["prefecture", "city", "items", "commitment", "shipLimitDelivery", "shipLimitSelf", "shipLimitPickup", "trialAmount"] as const;

export async function saveProfile(_state: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  // 誰のプロフィールかは、画面から送られた値ではなく、ログイン中の人で決める（他人のものを書き換えられないように）
  const user = await requireProducer();

  const values = Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const { trialAmount, ...rest } = parsed.data;
  // 府県と市区町村の組み合わせが、一覧にあるものか確かめる
  if (!findMunicipality(rest.prefecture, rest.city)) {
    return { errors: { city: ["一覧から市区町村を選んでください"] }, values };
  }

  const data = { ...rest, trialAmountG: trialAmount };
  // 初回は作る、2回目からは更新する
  await prisma.producerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  redirect("/mypage");
}
