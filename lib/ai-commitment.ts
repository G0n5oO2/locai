// AI：栽培のこだわりを、読みやすい文に整える（第2版 4-3「プロフィール」）
// AI は案を出すだけ。使うかどうか・どう直すかは、生産者が決める（不変条件5）
// 書かれていないこと（「無農薬」などの新しい事実）は足さないように指示する
import "server-only";
import { z } from "zod";
import { askJson } from "./ai";

const answerSchema = z.object({ text: z.string().trim().min(1).max(500) });

const jsonSchema = {
  type: "object",
  properties: { text: { type: "string", description: "整えた文（500文字以内）" } },
  required: ["text"],
};

// AI に渡すのは、生産者が書いた「こだわり」の文だけ（名前や住所は渡さない）
// previous を渡すと、その案とは違う言い方の「別の案」を出す
export async function polishCommitment(userId: string, draft: string, previous?: string): Promise<string | null> {
  const answer = await askJson({
    userId,
    task:
      "あなたは、農家さんのプロフィールの文を整える係です。データの「こだわりのメモ」は、農家さんが箇条書きなどで簡単に書いたものです。" +
      "これを、飲食店の人が読んで分かりやすい、ていねいな文（です・ます調、300文字くらいまで）に整えてください。" +
      "メモに書かれていることだけを使い、書かれていない事実（栽培方法・農薬や肥料・味・産地・受賞歴など）は絶対に足さないでください。" +
      "大げさな言い方や、ほかの農家さんと比べる言い方もしないでください。" +
      (previous ? "データの「前の案」とは、文の組み立てや言い回しを変えた、別の案にしてください（内容はメモのまま）。" : ""),
    data: previous ? { こだわりのメモ: draft, 前の案: previous } : { こだわりのメモ: draft },
    jsonSchema,
    schema: answerSchema,
  });
  return answer?.text ?? null;
}
