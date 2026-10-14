"use server";
// 購入希望を送る処理（サーバー側で動く）。売りすぎない確かめは lib/orders.ts の placeOrder で行う

import { redirect } from "next/navigation";
import { z } from "zod";
import { parseDate } from "@/lib/datetime";
import { placeOrder } from "@/lib/orders";
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
});

export async function sendOrder(_state: OrderFormState, formData: FormData): Promise<OrderFormState> {
  // 誰の申し込みかは、ログイン中の飲食店で決める
  const user = await requireBuyer();
  const values = Object.fromEntries(
    ["listingId", "quantity", "method", "deliveryDate", "useDate", "showUseDate", "isTrial", "requestKey"].map((f) => [f, String(formData.get(f) ?? "")]),
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
  });
  if (!result.ok) return { message: result.message, values };
  redirect("/buyer/orders");
}
