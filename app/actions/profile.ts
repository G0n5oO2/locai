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

// 送料・配達料（円）：空なら「なし」。入れるなら 0〜100,000 の整数
const optionalYen = z
  .string()
  .trim()
  .transform((text, ctx) => {
    if (text === "") return null;
    // 数字だけ（小数や記号は不可）で、100,000円まで
    if (!/^\d{1,6}$/.test(text) || Number(text) > 100000) {
      ctx.addIssue({ code: "custom", message: "0〜100,000 の整数（円）で入力してください" });
      return z.NEVER;
    }
    return Number(text);
  });

// 送料の帯の「◯kg まで」：空なら「なし」。入れるなら 0.1kg 単位で 0.1〜1,000kg
const optionalKg = z
  .string()
  .trim()
  .transform((text, ctx) => {
    if (text === "") return null;
    const grams = kgTextToGrams(text);
    if (grams === null || grams < 100 || grams > 1000000) {
      ctx.addIssue({ code: "custom", message: "0.1〜1,000kg を 0.1kg 単位で入力してください" });
      return z.NEVER;
    }
    return grams;
  });

const feeSchema = z.object({
  band1Kg: optionalKg,
  band1Yen: optionalYen,
  band2Kg: optionalKg,
  band2Yen: optionalYen,
  band3Kg: optionalKg,
  band3Yen: optionalYen,
  selfDeliveryYen: optionalYen,
  pickupPlace: z.string().trim().max(200, "200文字以内にしてください"),
});

const fields = [
  "prefecture", "city", "items", "commitment", "shipLimitDelivery", "shipLimitSelf", "shipLimitPickup", "trialAmount",
  "band1Kg", "band1Yen", "band2Kg", "band2Yen", "band3Kg", "band3Yen", "selfDeliveryYen", "pickupPlace",
] as const;

// 送料の帯を確かめる：「◯kg まで」と「◯円」はそろって入れる、1行目から順に、下の行ほど重い
function checkBands(fee: z.infer<typeof feeSchema>) {
  const rows = [
    [fee.band1Kg, fee.band1Yen],
    [fee.band2Kg, fee.band2Yen],
    [fee.band3Kg, fee.band3Yen],
  ] as const;
  const errors: Record<string, string[]> = {};
  let previousG = 0;
  let ended = false;
  rows.forEach(([g, yen], i) => {
    const key = `band${i + 1}Kg`;
    if (g === null && yen === null) {
      ended = true;
      return;
    }
    if (g === null || yen === null) errors[key] = ["「◯kg まで」と「◯円」を両方入れてください"];
    else if (ended) errors[key] = ["上の行から順に入れてください"];
    else if (g <= previousG) errors[key] = ["上の行より重い量にしてください"];
    if (g !== null) previousG = g;
  });
  return errors;
}

export async function saveProfile(_state: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  // 誰のプロフィールかは、画面から送られた値ではなく、ログイン中の人で決める（他人のものを書き換えられないように）
  const user = await requireProducer();

  const values = Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };

  const feeParsed = feeSchema.safeParse(values);
  if (!feeParsed.success) return { errors: z.flattenError(feeParsed.error).fieldErrors, values };
  const bandErrors = checkBands(feeParsed.data);
  if (Object.keys(bandErrors).length > 0) return { errors: bandErrors, values };

  const { trialAmount, ...rest } = parsed.data;
  // 府県と市区町村の組み合わせが、一覧にあるものか確かめる
  if (!findMunicipality(rest.prefecture, rest.city)) {
    return { errors: { city: ["一覧から市区町村を選んでください"] }, values };
  }

  const fee = feeParsed.data;
  const data = {
    ...rest,
    trialAmountG: trialAmount,
    deliveryBand1MaxG: fee.band1Kg,
    deliveryBand1Yen: fee.band1Yen,
    deliveryBand2MaxG: fee.band2Kg,
    deliveryBand2Yen: fee.band2Yen,
    deliveryBand3MaxG: fee.band3Kg,
    deliveryBand3Yen: fee.band3Yen,
    selfDeliveryYen: fee.selfDeliveryYen,
    pickupPlace: fee.pickupPlace === "" ? null : fee.pickupPlace,
  };
  // 初回は作る、2回目からは更新する
  await prisma.producerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  redirect("/mypage");
}
