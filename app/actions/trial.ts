"use server";
// お試し食材の登録と受付終了（サーバー側で動く）。画面から送られた値は信用せず、ここで必ず確かめる

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { DeliveryMethod } from "@/lib/burden";
import { jstDateText } from "@/lib/datetime";
import { deliveryBands } from "@/lib/fees";
import { prisma } from "@/lib/prisma";
import { requireProducer } from "@/lib/session";
import { TRIAL_ANSWER_DAYS, TRIAL_UNIT_G, trialSchedule } from "@/lib/trial";

export type TrialFormState = {
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

// g の整数（お試しはグラム単位で取引する）
function gramField(min: number, max: number) {
  return z.string().transform((text, ctx) => {
    const t = text.trim();
    if (!/^\d{1,7}$/.test(t) || Number(t) < min || Number(t) > max) {
      ctx.addIssue({ code: "custom", message: `${min.toLocaleString()}〜${max.toLocaleString()}g の整数で入力してください` });
      return z.NEVER;
    }
    return Number(t);
  });
}

const trialSchema = z.object({
  vegetable: z.string().trim().min(1, "食材名を入力してください").max(50, "50文字以内にしてください"),
  note: z.string().trim().min(1, "食材の説明を入力してください").max(500, "500文字以内にしてください"),
  unitPrice: z.string().transform((text, ctx) => {
    if (!/^\d{1,6}$/.test(text.trim()) || Number(text) < 1 || Number(text) > 100000) {
      ctx.addIssue({ code: "custom", message: "1〜100,000 の整数（円）で入力してください" });
      return z.NEVER;
    }
    return Number(text);
  }),
  total: gramField(100, 100000), // 出せる量
  quality: z.enum(["normal", "irregular"], { error: "通常品か規格外かを選んでください" }),
  lastDay: z.string().min(1, "収穫できる最後の日を入力してください"),
  answerDays: z.coerce.number().refine((n) => (TRIAL_ANSWER_DAYS as readonly number[]).includes(n), "回答の日数を選んでください"),
});

const fields = ["vegetable", "note", "unitPrice", "total", "quality", "lastDay", "answerDays"] as const;

export async function createTrialItem(_state: TrialFormState, formData: FormData): Promise<TrialFormState> {
  // 誰のお試し食材かは、ログイン中の人で決める
  const user = await requireProducer();
  const profile = await prisma.producerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/producer/profile");

  const methods = formData.getAll("methods").filter((m): m is DeliveryMethod => m === "delivery" || m === "self" || m === "pickup");
  const values: Record<string, string> = Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "")]));
  values.methods = methods.join(",");

  const parsed = trialSchema.safeParse(values);
  const errors: Record<string, string[] | undefined> = parsed.success ? {} : z.flattenError(parsed.error).fieldErrors;

  // 出せる量は、100g の倍数（お店は 100g ずつ申し込むので、売りすぎない確かめをふつうの出品と同じにできる）
  if (parsed.success && parsed.data.total % TRIAL_UNIT_G !== 0) {
    errors.total = [`出せる量は、${TRIAL_UNIT_G}g の倍数にしてください`];
  }
  // 期限：収穫できる最後の日から、受付が終わる日を決める（受付が今より後になること）
  const schedule = parsed.success ? trialSchedule(parsed.data.lastDay, parsed.data.answerDays, jstDateText(new Date())) : null;
  if (parsed.success && !schedule) errors.lastDay = ["収穫できる最後の日を入力してください"];
  if (parsed.success && schedule && schedule.acceptUntil.getTime() <= Date.now()) {
    errors.lastDay = [`収穫できる最後の日は、今日から ${parsed.data.answerDays + 1}日後以降にしてください（返事の日数のあとに届けるため）`];
  }
  // 受け渡し方法：1つ以上。送料などが分からない方法は選べない（不変条件2）
  if (methods.length === 0) errors.methods = ["受け渡し方法を1つ以上選んでください"];
  else if (methods.includes("delivery") && deliveryBands(profile).length === 0) errors.methods = ["宅配発送にするには、プロフィールで送料を入力してください"];
  else if (methods.includes("self") && profile.selfDeliveryYen === null) errors.methods = ["自分で配達にするには、プロフィールで配達料を入力してください"];
  else if (methods.includes("pickup") && profile.pickupPlace === null) errors.methods = ["引き取りにするには、プロフィールで引き取りの場所を入力してください"];

  if (!parsed.success || !schedule || Object.keys(errors).length > 0) return { errors, values };
  const d = parsed.data;

  await prisma.listing.create({
    data: {
      producerId: user.id,
      isTrial: true, // お試し食材の印（アプリが自動で付ける）
      trialAnswerDays: d.answerDays,
      vegetable: d.vegetable,
      note: d.note,
      totalG: d.total,
      unitG: TRIAL_UNIT_G, // 100g あたりの値段なので、100g ずつ申し込む
      minOrderG: TRIAL_UNIT_G, // お試しは、100g から申し込める
      unitPriceYen: d.unitPrice,
      quality: d.quality,
      surplus: false,
      ...schedule,
      offersDelivery: methods.includes("delivery"),
      offersSelf: methods.includes("self"),
      offersPickup: methods.includes("pickup"),
    },
  });
  redirect("/producer/trial?tab=items");
}

// お試し食材の受付を終える（削除）。返事待ちの申し込みは残るので、そのまま返事ができる
export async function closeTrialItem(formData: FormData) {
  const user = await requireProducer();
  const id = String(formData.get("listingId") ?? "");
  // 自分のお試し食材だけを終了できる（ほかの人のものや、ふつうの出品は変えない）
  await prisma.listing.updateMany({ where: { id, producerId: user.id, isTrial: true }, data: { status: "closed" } });
  refresh();
}
