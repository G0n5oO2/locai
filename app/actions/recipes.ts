"use server";
// 旬の野菜の料理の案を AI に頼む（サーバー側で動く）。外から直接呼ばれても、ログイン中の飲食店しか使えない
import { z } from "zod";
import { suggestRecipes, type RecipeIdea } from "@/lib/ai-recipes";
import { GENRES } from "@/lib/recipe-genres";
import { requireBuyer } from "@/lib/session";

export async function recipeAction(vegetable: string, genre: string): Promise<{ recipes?: RecipeIdea[]; message?: string }> {
  const user = await requireBuyer();
  const v = z.string().trim().min(1).max(30).safeParse(vegetable);
  const g = z.enum(GENRES).safeParse(genre);
  if (!v.success || !g.success) return { message: "野菜と料理の種類を選んでください" };
  const recipes = await suggestRecipes(user.id, v.data, g.data);
  // AI が使えないときは、案なしで続けられる
  if (!recipes || recipes.length === 0) return { message: "今は料理の案を出せませんでした。少し時間をおいて試してください" };
  return { recipes };
}
