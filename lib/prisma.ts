// データベースに読み書きするための部品（Prisma Client）を1つだけ作って、アプリ全体で使い回す
import "server-only";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/prisma/client";

// Node.js 20 には WebSocket が無いので、ws を使う（トランザクションに必要）
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  // アプリの実行時は、プーリング経由の接続（DATABASE_URL）を使う
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// 開発中はファイルを保存するたびに読み込み直されるので、
// そのたびに接続が増えないよう、1つ目を覚えておいて使い回す
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
