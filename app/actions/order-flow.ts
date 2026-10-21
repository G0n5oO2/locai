"use server";
// 注文の状態を変える操作（サーバー側で動く）。本人か・表にある動きかは lib/order-flow.ts で確かめる

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parseDate } from "@/lib/datetime";
import { acceptProposal, approveOrder, cancelOrder, declineOrder, proposeChange, refuseProposal, type FlowResult } from "@/lib/order-flow";
import { summarizeOrder } from "@/lib/ai-order-summary";
import { summaryFactsFor } from "@/lib/order-check-facts";
import { kgTextToGrams } from "@/lib/quantity";
import { requireBuyer, requireProducer } from "@/lib/session";

export type FlowState = { message?: string; done?: boolean };

const idSchema = z.string().min(1).max(100);

async function run(formData: FormData, fn: (orderId: string) => Promise<FlowResult>): Promise<FlowState> {
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { message: "注文が見つかりません" };
  const result = await fn(orderId.data);
  if (!result.ok) return { message: result.message };
  // 画面を最新の状態にする
  refresh();
  return { done: true };
}

// 承認（生産者だけ）
export async function approveAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireProducer();
  return run(formData, (orderId) => approveOrder(user.id, orderId));
}

// 見送り（生産者だけ）
export async function declineAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireProducer();
  return run(formData, (orderId) => declineOrder(user.id, orderId));
}

// 条件変更の提案（生産者だけ）
export async function proposeAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireProducer();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { message: "注文が見つかりません" };

  // 空なら「変えない」
  const dateText = String(formData.get("newDate") ?? "");
  const quantityText = String(formData.get("newQuantity") ?? "").trim();
  const newDeliveryDate = dateText === "" ? null : parseDate(dateText);
  const newQuantityG = quantityText === "" ? null : kgTextToGrams(quantityText);
  if (dateText !== "" && !newDeliveryDate) return { message: "納品日の形が正しくありません" };
  if (quantityText !== "" && newQuantityG === null) return { message: "数量は 0.1kg 単位の数字で入力してください" };
  const fallback = formData.get("confirmIfRefused");
  if (fallback !== "yes" && fallback !== "no") return { message: "断られたときの扱いを選んでください" };
  // 送料が要相談の注文だけ：農家さんが決めた送料（円の整数）。範囲の確かめは lib/order-flow.ts で行う
  const shippingText = String(formData.get("shippingYen") ?? "").trim();
  if (shippingText !== "" && !/^\d{1,6}$/.test(shippingText)) return { message: "送料は円の整数で入れてください" };
  const shippingYen = shippingText === "" ? null : Number(shippingText);

  const result = await proposeChange(user.id, orderId.data, { newDeliveryDate, newQuantityG, confirmIfRefused: fallback === "yes", shippingYen });
  if (!result.ok) return { message: result.message };
  // お試しの申し込みは、お試しのタブに戻る（第2版：お試しの申し込みは、お試しのタブで見る）
  const order = await prisma.order.findUnique({ where: { id: orderId.data }, select: { isTrial: true } });
  redirect(order?.isTrial ? "/producer/trial" : "/producer/orders");
}

// 提案に同意（飲食店だけ）
export async function acceptAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireBuyer();
  return run(formData, (orderId) => acceptProposal(user.id, orderId));
}

// 提案を断る（飲食店だけ）
export async function refuseAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireBuyer();
  return run(formData, (orderId) => refuseProposal(user.id, orderId));
}

// 取消（飲食店だけ）
export async function cancelAction(_state: FlowState, formData: FormData): Promise<FlowState> {
  const user = await requireBuyer();
  return run(formData, (orderId) => cancelOrder(user.id, orderId));
}

export type SummaryState = { summary?: string; message?: string };

// AI で確認ポイントを短くまとめる（生産者だけ。自分の出品への注文だけ）
export async function summarizeAction(_state: SummaryState, formData: FormData): Promise<SummaryState> {
  const user = await requireProducer();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { message: "注文が見つかりません" };
  const facts = await summaryFactsFor(user.id, orderId.data);
  if (!facts) return { message: "注文が見つかりません" };
  const summary = await summarizeOrder(user.id, facts);
  return summary ? { summary } : { message: "今は AI のまとめを出せませんでした。下の確認ポイントを見てください" };
}
