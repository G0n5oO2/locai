// AI：代わりの野菜の提案（仕様書 4章 A-③）
// AI は候補と理由・使い道を出すだけ。どれを「これならOK」にするかは、お店が選ぶ（不変条件5）
import "server-only";
import { z } from "zod";
import { askJson } from "./ai";

export type SubstituteSuggestion = { name: string; reason: string; usage: string };

const answerSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(20),
        reason: z.string().trim().min(1).max(80),
        usage: z.string().trim().min(1).max(60),
      }),
    )
    .max(5),
});

const jsonSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "代わりの野菜の名前（20文字以内）" },
          reason: { type: "string", description: "代わりになる理由（80文字以内）" },
          usage: { type: "string", description: "その料理での使い方のこつ（60文字以内）" },
        },
        required: ["name", "reason", "usage"],
      },
    },
  },
  required: ["suggestions"],
};

// AI に渡すのは、探している野菜と料理の用途（任意）だけ
export async function suggestSubstitutes(userId: string, vegetable: string, usage: string): Promise<SubstituteSuggestion[] | null> {
  const answer = await askJson({
    userId,
    task:
      "あなたは、関西の小さな飲食店の仕入れを手伝う係です。データの「探している野菜」が手に入らないとき、代わりに使える野菜を最大5つ提案してください。" +
      "関西の農家さんが作っていそうな野菜を優先し、データの「料理の用途」があれば、それに合うものにしてください。野菜でないものは出さないでください。",
    data: { 探している野菜: vegetable, 料理の用途: usage || "（指定なし）" },
    jsonSchema,
    schema: answerSchema,
  });
  if (!answer) return null;
  // 同じ名前や、探している野菜そのものは外す
  const seen = new Set<string>([vegetable.trim()]);
  return answer.suggestions.filter((s) => (seen.has(s.name) ? false : (seen.add(s.name), true)));
}
