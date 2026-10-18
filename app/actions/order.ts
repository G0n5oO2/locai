"use server";
// 購入希望を送る処理（サーバー側で動く）。売りすぎない確かめは lib/orders.ts の placeOrder で行う

import { redirect } from "next/navigation";
import { z } from "zod";
import { parseDate } from "@/lib/datetime";
import { paymentMethodSchema } from "@/lib/payment";
import { sendMessage } from "@/lib/messages";
import { placeOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import { kgTextToGrams } from "@/lib/quantity";
import { requireBuyer } from "@/lib/session";

export type OrderFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  values?: Record<string, string>;
};

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

const orderSchema = z.object({
  listingId: z.string().min(1).max(100),
  quantity: z.string().transform((text, ctx) => {
    const grams = kgTextToGrams(text);
    if (grams === null || grams < 100 || grams > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "数量を 0.1kg 単位で入力してください" });
      return z.NEVER;
    }
    return grams;
  }),
  method: z.enum(["delivery", "self", "pickup"], { error: "受け取り方法を選んでください" }),
  deliveryDate: dateField("納品日を選んでください"),
  useDate: dateField("使用日を入力してください"),
  showUseDate: z.string().transform((v) => v === "on"),
  isTrial: z.string().transform((v) => v === "on"),
  requestKey: z.uuid(),
  // 支払方法（農家さんが設定していないときは空で届く）
  paymentMethod: z.union([z.literal("").transform(() => null), paymentMethodSchema]),
});

export async function sendOrder(_state: OrderFormState, formData: FormData): Promise<OrderFormState> {
  // 誰の申し込みかは、ログイン中の飲食店で決める
  const user = await requireBuyer();
  const values = Object.fromEntries(
    ["listingId", "quantity", "method", "deliveryDate", "useDate", "showUseDate", "isTrial", "requestKey", "paymentMethod"].map((f) => [f, String(formData.get(f) ?? "")]),
  );
  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const d = parsed.data;

  const result = await placeOrder({
    buyerId: user.id,
    listingId: d.listingId,
    quantityG: d.quantity,
    method: d.method,
    deliveryDate: d.deliveryDate,
    useDate: d.useDate,
    showUseDate: d.showUseDate,
    requestKey: d.requestKey,
    isTrial: d.isTrial,
    paymentMethod: d.paymentMethod,
  });
  if (!result.ok) return { message: result.message, values };
  redirect("/buyer/orders");
}

// お試し希望を送る（第2版 4-4「お試し」）。入れるのは、希望数量（g）・受け取り方法・納品日・支払方法・任意のメッセージ
// 申し込める野菜か・量・期限は、placeOrder がサーバー側でもう一度確かめる
const trialOrderSchema = z.object({
  listingId: z.string().min(1).max(100),
  quantity: z.string().transform((text, ctx) => {
    const t = text.trim();
    if (!/^\d{1,6}$/.test(t) || Number(t) < 100 || Number(t) > 100000) {
      ctx.addIssue({ code: "custom", message: "希望数量を 100g 単位の整数で入力してください" });
      return z.NEVER;
    }
    return Number(t);
  }),
  method: z.enum(["delivery", "self", "pickup"], { error: "受け取り方法を選んでください" }),
  deliveryDate: dateField("納品日を選んでください"),
  paymentMethod: z.union([z.literal("").transform(() => null), paymentMethodSchema]),
  message: z.string().trim().max(500, "メッセージは500文字以内にしてください"),
  requestKey: z.uuid(),
});

export async function sendTrialOrder(_state: OrderFormState, formData: FormData): Promise<OrderFormState> {
  // 誰の申し込みかは、ログイン中の飲食店で決める
  const user = await requireBuyer();
  const values = Object.fromEntries(
    ["listingId", "quantity", "method", "deliveryDate", "paymentMethod", "message", "requestKey"].map((f) => [f, String(formData.get(f) ?? "")]),
  );
  const parsed = trialOrderSchema.safeParse(values);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, values };
  const d = parsed.data;

  const result = await placeOrder({
    buyerId: user.id,
    listingId: d.listingId,
    quantityG: d.quantity,
    method: d.method,
    deliveryDate: d.deliveryDate,
    useDate: d.deliveryDate, // お試しは使用日を聞かないので、納品日と同じにする（農家さんには見せない）
    showUseDate: false,
    requestKey: d.requestKey,
    paymentMethod: d.paymentMethod,
  });
  if (!result.ok) return { message: result.message, values };
  // メッセージ（任意）は、申し込みができてから、その注文のメッセージとして送る
  // 送信ボタンの連打で同じ申し込みが返ってきたときに、同じメッセージを2回送らないよう、まだメッセージがないときだけ送る
  if (d.message !== "" && (await prisma.orderMessage.count({ where: { orderId: result.orderId } })) === 0) {
    await sendMessage(user.id, result.orderId, d.message);
  }
  // お試しの注文は、お試しのタブの「お試しの注文」で見る
  redirect("/buyer/trial?tab=orders");
}
