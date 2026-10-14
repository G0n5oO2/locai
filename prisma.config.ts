// Prisma の設定ファイル（Prisma 7 では、データベースの接続先をここに書く）
import { defineConfig } from "prisma/config";

// ローカルでは .env.local から環境変数を読み込む
// （Vercel では環境変数が最初から入っているので、ファイルが無くてもエラーにしない）
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  // 表の設計図（スキーマ）の場所
  schema: "prisma/schema.prisma",
  // 表を作ったり変えたりした記録（マイグレーション）の置き場所
  migrations: { path: "prisma/migrations" },
  // マイグレーションは、プーリングを通さない「直接接続」で行う
  datasource: { url: process.env.DATABASE_URL_UNPOOLED },
});
