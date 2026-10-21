// 売れ残りの場面を試すための出品を1つ作るプログラム（受付期限が1時間前に過ぎた、賀茂茄子 18kg）
// 実行：npm run seed:leftover（先に npm run seed:users と npm run seed:demo を実行しておく）
// 名前・文はすべて作り物
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const day = 24 * 60 * 60 * 1000;
// 日時は世界標準時の文字（…Z）で渡す。Date のまま渡すと、パソコンの時刻の設定（日本時間）で書かれて、9時間ずれるため
const dateOnly = (days) => new Date(Date.now() + days * day).toISOString().slice(0, 10);

const [user] = await sql`select id from "user" where email = 'producer1@example.com'`;
const [profile] = await sql`select "deliveryBand1MaxG", "selfDeliveryYen", "pickupPlace" from producer_profile where "userId" = ${user.id}`;
await sql`
  insert into listing (id, "producerId", vegetable, "totalG", "unitG", "minOrderG", "unitPriceYen", quality, surplus, note,
    "acceptUntil", "answerUntil", "deliverFrom", "deliverTo", "offersDelivery", "offersSelf", "offersPickup", "updatedAt")
  values (${randomUUID()}, ${user.id}, '賀茂茄子', 18000, 500, 1000, 300, 'normal', true, '売れ残りのテスト用',
    ${new Date(Date.now() - 60 * 60 * 1000).toISOString()}, ${new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString()}, ${dateOnly(2)}, ${dateOnly(10)},
    ${profile.deliveryBand1MaxG !== null}, ${profile.selfDeliveryYen !== null}, ${profile.pickupPlace !== null}, now())`;
console.log("producer1 に、受付期限が過ぎた「賀茂茄子 18kg」の出品を作りました");
