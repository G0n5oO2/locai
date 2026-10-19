// AI：旬の野菜を使った料理の案（第2版 4-4「季節の野菜」）
// AI は案を出すだけ。分量は「目安」と明記する（第1版 4章 A-④）
import "server-only";
import { z } from "zod";
import { askJson } from "./ai";
import type { Genre } from "./recipe-genres";

export type RecipeIdea = { name: string; description: string; amount: string };

const answerSchema = z.object({
  recipes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(30),
        description: z.string().trim().min(1).max(120),
        amount: z.string().trim().min(1).max(60),
      }),
    )
    .max(3),
});

const jsonSchema = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "料理の名前（30文字以内）" },
          description: { type: "string", description: "どんな料理か・おいしく作るこつ（120文字以内）" },
          amount: { type: "string", description: "4人分で使う野菜の量の目安（60文字以内）" },
        },
        required: ["name", "description", "amount"],
      },
    },
  },
  required: ["recipes"],
};

// AI に渡すのは、野菜の名前と料理の種類だけ
export async function suggestRecipes(userId: string, vegetable: string, genre: Genre): Promise<RecipeIdea[] | null> {
  const answer = await askJson({
    userId,
    task:
      "あなたは、関西の小さな飲食店の献立づくりを手伝う係です。データの「野菜」を主役にした料理を3つ提案してください。" +
      "データの「料理の種類」が「すべて」以外なら、その種類の料理にしてください。お店で出しやすい料理にしてください。" +
      "量は「4人分で○○を△本くらい」のように、目安として書いてください。",
    data: { 野菜: vegetable, 料理の種類: genre },
    jsonSchema,
    schema: answerSchema,
  });
  return answer?.recipes ?? null;
}
