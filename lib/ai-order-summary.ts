// AI：生産者向けに、注文の確認ポイントを短い文にまとめる（仕様書 4章 B-③）
// 確認ポイントはアプリが決まりで見つけたもの。AI はまとめるだけ（不変条件5）
// AI に渡すのは、店名・住所・地域の名前を外した事実だけ
import "server-only";
import { z } from "zod";
import { askJson } from "./ai";

const answerSchema = z.object({ summary: z.string().trim().min(1).max(150) });
const jsonSchema = {
  type: "object",
  properties: { summary: { type: "string", description: "生産者向けのまとめ（120文字以内）" } },
  required: ["summary"],
};

export type SummaryFacts = {
  食材: string;
  数量: string;
  受け取り方法: string;
  納品日まで: string;
  確認ポイント: string[];
};

export async function summarizeOrder(userId: string, facts: SummaryFacts): Promise<string | null> {
  const answer = await askJson({
    userId,
    task:
      "あなたは、畑仕事の合間にスマホで注文を確かめる農家さんを手伝う係です。データの注文の事実と「確認ポイント」を、120文字以内の1〜2文にまとめてください。" +
      "確認ポイントにないことを付け足したり、承認するか見送るかをすすめたりしないでください。確認ポイントがなければ「特に気をつける点はありません」とまとめてください。",
    data: facts,
    jsonSchema,
    schema: answerSchema,
  });
  return answer?.summary ?? null;
}
