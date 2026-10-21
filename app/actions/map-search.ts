"use server";
// 地図で探す処理（サーバー側で動く）。食材の名前だけで絞り、地図で囲む部分は画面で行う

import { z } from "zod";
import { mapListings, type MapListing } from "@/lib/map-search";
import { requireBuyer } from "@/lib/session";

const vegetableSchema = z.string().trim().max(50);

export async function mapSearch(vegetable: string): Promise<{ listings: MapListing[] } | { message: string }> {
  const user = await requireBuyer();
  const parsed = vegetableSchema.safeParse(vegetable);
  if (!parsed.success) return { message: "食材は50文字以内にしてください" };
  return { listings: await mapListings(user.id, parsed.data) };
}
