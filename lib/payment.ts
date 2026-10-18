// 支払方法（第2版）。支払い自体はアプリの外で行い、どう払うかを伝えるために使う
// 画面（ブラウザ）とサーバーの両方から使うので、"server-only" は付けない
import { z } from "zod";

export const paymentMethods = ["cash", "transfer", "cod", "mobile"] as const;
export type PaymentMethodKey = (typeof paymentMethods)[number];

export const paymentLabel: Record<PaymentMethodKey, string> = {
  cash: "現金",
  transfer: "振り込み",
  cod: "代金引換",
  mobile: "スマホ決済",
};

// 選べる支払方法の説明（プロフィールの画面で出す）
export const paymentNote: Record<PaymentMethodKey, string> = {
  cash: "農家さん本人に渡す（自分で届けるとき・引き取りのとき）",
  transfer: "販売確定のあと、メッセージで振込先を伝える",
  cod: "宅配のときだけ。配達員に払う（宅配業者の手数料がかかる）",
  mobile: "PayPay など",
};

export const paymentMethodSchema = z.enum(paymentMethods, { error: "支払方法を選んでください" });

// 代金引換は、宅配のときだけ選べる
export function paymentFits(payment: PaymentMethodKey, method: "delivery" | "self" | "pickup") {
  return payment !== "cod" || method === "delivery";
}
