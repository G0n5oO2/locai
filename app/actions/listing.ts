"use server";
// 出品の保存（サーバー側で動く）。画面から送られた値は信用せず、ここで必ず確かめる

import { redirect } from "next/navigation";
import { z } from "zod";
import { maxOrderCount, methodLabel, strictestLimit, type DeliveryMethod } from "@/lib/burden";
import { jstDateText, parseDate, parseJstDateTime } from "@/lib/datetime";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { quantityErrors } from "@/lib/listing-rules";
import { kgTextToGrams } from "@/lib/quantity";
import { requireProducer } from "@/lib/session";

export type ListingFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  values?: Record<string, string>;
  // 出荷の負担が基準を超えているので、もう一度確かめてほしいとき
  confirmOver?: { maxCount: number; limit: number; methodLabel: string };
};

// kg の入力 → g の整数（0.1kg 単位）
function kgField(min: number, max: number, rangeText: string) {
  return z.string().transform((text, ctx) => {
    const grams = kgTextToGrams(text);
    if (grams === null || grams < min || grams > max) {
      ctx.addIssue({ code: "custom", message: `${rangeText}を 0.1kg 単位で入力してください` });
      return z.NEVER;
    }
    return grams;
  });
}

// 日時の入力（日本時間）→ 日時。入っていなければ message を出す
function dateTimeField(message: string) {
  return z.string().transform((text, ctx) => {
    const date = parseJstDateTime(text);
    if (!date) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return date;
  });
}

// 日付の入力 → 日付。入っていなければ message を出す
function dateField(message: string) {
  return z.string().transform((text, ctx) => {
    const date = parseDate(text);
    if (!date) {
      ctx.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return date;
  });
}

const listingSchema = z.object({
  vegetable: z.string().trim().min(1, "食材名を入力してください").max(50, "50文字以内にしてください"),
  total: kgField(500, 1_000_000, "0.5〜1,000kg "),
  unit: kgField(100, 1_000_000, "0.1〜1,000kg "),
  minOrder: kgField(100, 1_000_000, "0.1〜1,000kg "),
  unitPrice: z.string().transform((text, ctx) => {
    if (!/^\d{1,6}$/.test(text.trim()) || Number(text) < 1 || Number(text) > 100000) {
      ctx.addIssue({ code: "custom", message: "1〜100,000 の整数（円）で入力してください" });
      return z.NEVER;
    }
    return Number(text);
  }),
  quality: z.enum(["normal", "irregular"], { error: "通常品か規格外かを選んでください" }),
  surplus: z.string().transform((v) => v === "on"),
  note: z.string().trim().max(500, "500文字以内にしてください"),
  acceptUntil: dateTimeField("受付期限を入力してください"),
  answerUntil: dateTimeField("回答期限を入力してください"),
  deliverFrom: dateField("「いつから」を入力してください"),
  deliverTo: dateField("「いつまで」を入力してください"),
});

const fields = ["vegetable", "total", "unit", "minOrder", "unitPrice", "quality", "surplus", "note", "acceptUntil", "answerUntil", "deliverFrom", "deliverTo", "methods"] as const;

export async function createListing(_state: ListingFormState, formData: FormData): Promise<ListingFormState> {
  // 誰の出品かは、ログイン中の人で決める
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");

  const methods = formData.getAll("methods").filter((m): m is DeliveryMethod => m === "delivery" || m === "self" || m === "pickup");
  const values: Record<string, string> = Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
  values.methods = methods.join(",");

  // 1段目：それぞれの欄が正しい形か
  const parsed = listingSchema.safeParse(values);
  const fieldErrors = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;

  // 2段目：欄どうしの関係。1段目にエラーがあっても、確かめられるものは確かめて、まとめて返す
  const errors: Record<string, string[]> = {};
  const totalG = kgTextToGrams(values.total);
  const unitG = kgTextToGrams(values.unit);
  const minOrderG = kgTextToGrams(values.minOrder);
  for (const [key, message] of Object.entries(quantityErrors(totalG, unitG, minOrderG))) errors[key] = [message];
  const acceptUntil = parseJstDateTime(values.acceptUntil);
  const answerUntil = parseJstDateTime(values.answerUntil);
  const deliverFrom = parseDate(values.deliverFrom);
  const deliverTo = parseDate(values.deliverTo);
  if (acceptUntil && acceptUntil.getTime() <= Date.now()) errors.acceptUntil = ["受付期限は、今より後にしてください"];
  if (acceptUntil && answerUntil && answerUntil.getTime() <= acceptUntil.getTime()) errors.answerUntil = ["回答期限は、受付期限より後にしてください"];
  if (deliverFrom && deliverTo && deliverTo.getTime() < deliverFrom.getTime()) errors.deliverTo = ["「いつまで」は「いつから」以降にしてください"];
  else if (answerUntil && deliverTo && jstDateText(answerUntil) >= values.deliverTo) errors.deliverTo = ["「いつまで」は、回答期限の日より後にしてください"];

  // 受け渡し方法：1つ以上。送料などが分からない方法は選べない（不変条件2）
  if (methods.length === 0) errors.methods = ["受け渡し方法を1つ以上選んでください"];
  else if (methods.includes("delivery") && deliveryBands(profile).length === 0) errors.methods = ["宅配発送にするには、プロフィールで送料を入力してください"];
  else if (methods.includes("self") && profile.selfDeliveryYen === null) errors.methods = ["自分で配達にするには、プロフィールで配達料を入力してください"];
  else if (methods.includes("pickup") && profile.pickupPlace === null) errors.methods = ["引き取りにするには、プロフィールで引き取りの場所を入力してください"];

  // 1段目のエラーを優先して、まとめて返す
  const allErrors = { ...errors, ...fieldErrors };
  if (!parsed.success || Object.keys(allErrors).length > 0) return { errors: allErrors, values };
  const d = parsed.data;

  // 出荷の負担が基準を超えていたら、「このまま出品する」を押してもらうまで保存しない
  const maxCount = maxOrderCount(d.total, d.minOrder);
  const strictest = strictestLimit(profile, methods);
  const confirmed = formData.get("confirmOver") === "yes";
  if (strictest && maxCount > strictest.limit && !confirmed) {
    return { values, confirmOver: { maxCount, limit: strictest.limit, methodLabel: methodLabel[strictest.method] } };
  }

  // 再出品のときは、前の出品（自分のものだけ）を受付終了にする
  // 「前の出品を終了」と「新しい出品を保存」は1つのトランザクションで行う（片方だけ失敗しないように）
  const fromListingId = String(formData.get("fromListingId") ?? "");
  await prisma.$transaction([
    prisma.listing.updateMany({ where: { id: fromListingId, producerId: user.id }, data: { status: "closed" } }),
    prisma.listing.create({
      data: {
        producerId: user.id,
        vegetable: d.vegetable,
        totalG: d.total,
        unitG: d.unit,
        minOrderG: d.minOrder,
        unitPriceYen: d.unitPrice,
        quality: d.quality,
        surplus: d.surplus,
        note: d.note,
        acceptUntil: d.acceptUntil,
        answerUntil: d.answerUntil,
        deliverFrom: d.deliverFrom,
        deliverTo: d.deliverTo,
        offersDelivery: methods.includes("delivery"),
        offersSelf: methods.includes("self"),
        offersPickup: methods.includes("pickup"),
      },
    }),
  ]);
  redirect("/producer/listings");
}
