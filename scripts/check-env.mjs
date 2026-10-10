// 環境変数がそろっていて、データベースと Gemini につながるかを確かめるプログラム
// 実行：npm run check:env
// 秘密情報（キーや接続文字列）の中身は表示しない。OK／NG だけを表示する。

import { neon } from "@neondatabase/serverless";
import { GoogleGenAI } from "@google/genai";

const names = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "GEMINI_API_KEY", "GEMINI_MODEL"];

// エラー文に秘密情報が混ざっていたら、*** に置き換えてから表示する
function hideSecrets(message) {
  let text = String(message);
  for (const name of names) {
    const value = process.env[name];
    if (value && name !== "GEMINI_MODEL") text = text.split(value).join("***");
  }
  return text.replace(/postgres(ql)?:\/\/\S+/g, "***");
}

let ok = true;

// 1. 4つの環境変数が書かれているか
console.log("【1】環境変数");
for (const name of names) {
  const filled = Boolean(process.env[name]?.trim());
  console.log(`  ${filled ? "OK" : "NG"}  ${name}${filled ? "" : "（空です）"}`);
  if (!filled) ok = false;
}

// 2. データベース（Neon）につながるか
console.log("【2】データベース（Neon）");
for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  if (!process.env[name]) continue;
  try {
    const sql = neon(process.env[name]);
    await sql`select 1`;
    console.log(`  OK  ${name} でつながった`);
  } catch (error) {
    console.log(`  NG  ${name} でつながらない：${hideSecrets(error.message)}`);
    ok = false;
  }
}

// 3. Gemini に短い質問をして、返事が来るか
console.log("【3】Gemini");
if (process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: "「OK」とだけ答えてください。",
    });
    console.log(`  OK  ${process.env.GEMINI_MODEL} から返事が来た：${response.text?.trim()}`);
  } catch (error) {
    console.log(`  NG  返事が来ない：${hideSecrets(error.message).slice(0, 300)}`);
    ok = false;
  }
}

console.log(ok ? "\nすべて OK です。" : "\nNG があります。表示をそのまま AI に見せてください。");
process.exit(ok ? 0 : 1);
