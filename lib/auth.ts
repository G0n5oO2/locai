// ログインの仕組み（Better Auth）の設定
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { z } from "zod";
import { prisma } from "./prisma";

// 利用者の立場：producer（生産者）か buyer（飲食店）だけを許す
export const roleSchema = z.enum(["producer", "buyer"]);
export type Role = z.infer<typeof roleSchema>;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // ログインに使う URL。ローカル・本番・プレビューのどれでも動くようにする
  baseURL: {
    allowedHosts: ["localhost:3000", "locai-neon.vercel.app", "locai-*.vercel.app"],
    fallback: "https://locai-neon.vercel.app",
  },
  // メールアドレスとパスワードでログインする
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      // 立場は登録のときだけ受け取り、決まった2つ以外は断る
      role: { type: "string", required: true, input: true, validator: { input: roleSchema } },
    },
  },
  // 立場はあとから変えられない（2重に守る）
  // 1つ目：利用者情報を変える窓口は、このアプリでは使わないので閉じる
  disabledPaths: ["/update-user"],
  databaseHooks: {
    user: {
      update: {
        // 2つ目：どこから更新されても、role は「変えない（undefined）」で上書きする
        // （ここで返した内容は、もとの更新内容に上書きで足し合わされる。取り除くだけでは残ってしまう）
        before: async (data) => ({ data: { ...data, role: undefined } }),
      },
    },
  },
  // サーバーアクションの中でログインしたとき、ブラウザにログイン状態（クッキー）を保存する
  plugins: [nextCookies()],
});
