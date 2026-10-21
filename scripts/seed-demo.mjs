// テスト用のプロフィールと出品を入れるプログラム（先に npm run seed:users で利用者を作っておく）
// 実行：npm run seed:demo
// すでにあるプロフィールは上書きしない。出品は、同じ農家さん・同じ食材の「受付中のデモ出品」がなければ作る。
// 名前・場所・文はすべて作り物。

import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// 日付：今日から◯日後
const day = 24 * 60 * 60 * 1000;
// 日時は世界標準時の文字（…Z）で渡す。Date のまま渡すと、パソコンの時刻の設定（日本時間）で書かれて、9時間ずれるため
const at = (days) => new Date(Date.now() + days * day).toISOString();
const dateOnly = (days) => at(days).slice(0, 10);

const producers = [
  {
    email: "producer1@example.com",
    profile: { prefecture: "京都府", city: "南丹市", items: "賀茂茄子、万願寺唐辛子", commitment: "朝どりにこだわっています（デモ）", band1: [2000, 800], band2: [5000, 1200], band3: [10000, 1600], self: 500, pickup: "南丹市の畑の前（デモ）" },
    listings: [{ vegetable: "賀茂茄子", totalG: 30000, unitG: 500, minOrderG: 1000, unitPriceYen: 300, quality: "normal", surplus: true, note: "豊作です（デモ）" }],
  },
  {
    email: "producer2@example.com",
    profile: { prefecture: "京都府", city: "亀岡市", items: "賀茂茄子、伏見甘長", commitment: "農薬を減らして育てています（デモ）", band1: [3000, 900], band2: [10000, 1500], band3: null, self: 700, pickup: null },
    listings: [
      { vegetable: "賀茂茄子", totalG: 20000, unitG: 1000, minOrderG: 2000, unitPriceYen: 650, quality: "normal", surplus: false, note: "" },
      { vegetable: "伏見甘長", totalG: 10000, unitG: 500, minOrderG: 500, unitPriceYen: 400, quality: "irregular", surplus: true, note: "形は不ぞろいです（デモ）" },
    ],
  },
  {
    email: "producer3@example.com",
    profile: { prefecture: "京都府", city: "南丹市", items: "賀茂茄子", commitment: "今年から始めました（デモ）", band1: [5000, 1000], band2: null, band3: null, self: null, pickup: "南丹市の集荷場（デモ）" },
    listings: [{ vegetable: "賀茂茄子", totalG: 10000, unitG: 500, minOrderG: 500, unitPriceYen: 280, quality: "irregular", surplus: false, note: "少し小ぶりです（デモ）" }],
  },
  // ここから下は、地図で探すを試すための農家さん（関西の各地）
  {
    email: "producer4@example.com",
    profile: { prefecture: "滋賀県", city: "東近江市", items: "赤かぶ、日野菜", commitment: "琵琶湖の近くで、土づくりから育てています（デモ）", band1: [3000, 900], band2: [10000, 1500], band3: null, self: null, pickup: "東近江市の直売所（デモ）" },
    listings: [{ vegetable: "日野菜", totalG: 15000, unitG: 500, minOrderG: 1000, unitPriceYen: 250, quality: "normal", surplus: false, note: "" }],
  },
  {
    email: "producer5@example.com",
    profile: { prefecture: "滋賀県", city: "高島市", items: "賀茂茄子、ほうれん草", commitment: "山の水で育てています（デモ）", band1: [5000, 1200], band2: null, band3: null, self: null, pickup: null },
    listings: [{ vegetable: "ほうれん草", totalG: 8000, unitG: 500, minOrderG: 500, unitPriceYen: 220, quality: "normal", surplus: true, note: "寒くなって甘くなりました（デモ）" }],
  },
  {
    email: "producer6@example.com",
    profile: { prefecture: "京都府", city: "京丹後市", items: "九条ねぎ、聖護院かぶ", commitment: "海風の当たる畑です（デモ）", band1: [3000, 1000], band2: [10000, 1800], band3: null, self: null, pickup: null },
    listings: [{ vegetable: "九条ねぎ", totalG: 12000, unitG: 500, minOrderG: 1000, unitPriceYen: 350, quality: "irregular", surplus: false, note: "太さがばらばらです（デモ）" }],
  },
  {
    email: "producer7@example.com",
    profile: { prefecture: "大阪府", city: "豊能郡能勢町", items: "賀茂茄子、里芋", commitment: "里山で、少量ずつ育てています（デモ）", band1: [3000, 800], band2: null, band3: null, self: 600, pickup: "能勢町の畑の前（デモ）" },
    listings: [
      { vegetable: "里芋", totalG: 20000, unitG: 1000, minOrderG: 2000, unitPriceYen: 500, quality: "normal", surplus: false, note: "" },
      { vegetable: "賀茂茄子", totalG: 6000, unitG: 500, minOrderG: 500, unitPriceYen: 320, quality: "normal", surplus: false, note: "" },
    ],
  },
  {
    email: "producer8@example.com",
    profile: { prefecture: "大阪府", city: "泉佐野市", items: "水なす、玉ねぎ", commitment: "泉州の水なす一筋です（デモ）", band1: [2000, 700], band2: [5000, 1100], band3: null, self: 500, pickup: null },
    listings: [{ vegetable: "水なす", totalG: 15000, unitG: 500, minOrderG: 1000, unitPriceYen: 450, quality: "normal", surplus: true, note: "たくさん採れています（デモ）" }],
  },
  {
    email: "producer9@example.com",
    profile: { prefecture: "兵庫県", city: "丹波篠山市", items: "黒枝豆、山の芋", commitment: "昼と夜の寒暖差を生かしています（デモ）", band1: [3000, 900], band2: [10000, 1400], band3: null, self: null, pickup: "丹波篠山市の集荷場（デモ）" },
    listings: [{ vegetable: "黒枝豆", totalG: 10000, unitG: 500, minOrderG: 500, unitPriceYen: 600, quality: "normal", surplus: false, note: "" }],
  },
  {
    email: "producer10@example.com",
    profile: { prefecture: "兵庫県", city: "南あわじ市", items: "玉ねぎ、レタス", commitment: "淡路島の玉ねぎです（デモ）", band1: [5000, 1000], band2: [20000, 2000], band3: null, self: null, pickup: null },
    listings: [{ vegetable: "玉ねぎ", totalG: 50000, unitG: 1000, minOrderG: 5000, unitPriceYen: 200, quality: "irregular", surplus: true, note: "大きさが不ぞろいです（デモ）" }],
  },
  {
    email: "producer11@example.com",
    profile: { prefecture: "奈良県", city: "宇陀市", items: "大和まな、ほうれん草", commitment: "高原の涼しさで育てています（デモ）", band1: [3000, 900], band2: null, band3: null, self: 800, pickup: null },
    listings: [{ vegetable: "大和まな", totalG: 6000, unitG: 500, minOrderG: 500, unitPriceYen: 280, quality: "normal", surplus: false, note: "" }],
  },
  {
    email: "producer12@example.com",
    profile: { prefecture: "和歌山県", city: "紀の川市", items: "玉ねぎ、ほうれん草", commitment: "紀の川の近くの畑です（デモ）", band1: [3000, 1000], band2: [10000, 1600], band3: null, self: null, pickup: "紀の川市の直売所（デモ）" },
    listings: [{ vegetable: "ほうれん草", totalG: 10000, unitG: 500, minOrderG: 1000, unitPriceYen: 200, quality: "normal", surplus: false, note: "" }],
  },
];

const buyers = [
  { email: "buyer1@example.com", prefecture: "大阪府", city: "大阪市福島区", address: "大阪市福島区（デモ住所）" },
  { email: "buyer2@example.com", prefecture: "京都府", city: "京都市中京区", address: "京都市中京区（デモ住所）" },
  { email: "buyer3@example.com", prefecture: "兵庫県", city: "神戸市中央区", address: "神戸市中央区（デモ住所）" },
];

async function userId(email) {
  const rows = await sql`select id from "user" where email = ${email}`;
  if (rows.length === 0) throw new Error(`${email} がいません。先に npm run seed:users を実行してください`);
  return rows[0].id;
}

for (const p of producers) {
  const id = await userId(p.email);
  const f = p.profile;
  const created = await sql`
    insert into producer_profile ("userId", prefecture, city, items, commitment, "shipLimitDelivery", "shipLimitSelf", "shipLimitPickup", "trialAmountG",
      "deliveryBand1MaxG", "deliveryBand1Yen", "deliveryBand2MaxG", "deliveryBand2Yen", "deliveryBand3MaxG", "deliveryBand3Yen", "selfDeliveryYen", "pickupPlace", "updatedAt")
    values (${id}, ${f.prefecture}, ${f.city}, ${f.items}, ${f.commitment}, 10, 5, 15, 500,
      ${f.band1?.[0] ?? null}, ${f.band1?.[1] ?? null}, ${f.band2?.[0] ?? null}, ${f.band2?.[1] ?? null}, ${f.band3?.[0] ?? null}, ${f.band3?.[1] ?? null}, ${f.self}, ${f.pickup}, now())
    on conflict ("userId") do nothing
    returning "userId"`;
  console.log(`  ${p.email} プロフィール：${created.length ? "作った" : "すでにある（そのまま）"}`);

  // プロフィールに合わせて、対応できる受け渡し方法だけを選ぶ
  const [profile] = await sql`select "deliveryBand1MaxG", "selfDeliveryYen", "pickupPlace" from producer_profile where "userId" = ${id}`;
  for (const l of p.listings) {
    const exists = await sql`select 1 from listing where "producerId" = ${id} and vegetable = ${l.vegetable} and status = 'open' and "acceptUntil" > now()`;
    if (exists.length) {
      console.log(`    出品 ${l.vegetable}：受付中のものがある（作らない）`);
      continue;
    }
    await sql`
      insert into listing (id, "producerId", vegetable, "totalG", "unitG", "minOrderG", "unitPriceYen", quality, surplus, note,
        "acceptUntil", "answerUntil", "deliverFrom", "deliverTo", "offersDelivery", "offersSelf", "offersPickup", "updatedAt")
      values (${randomUUID()}, ${id}, ${l.vegetable}, ${l.totalG}, ${l.unitG}, ${l.minOrderG}, ${l.unitPriceYen}, ${l.quality}, ${l.surplus}, ${l.note},
        ${at(3)}, ${at(4)}, ${dateOnly(5)}, ${dateOnly(12)},
        ${profile.deliveryBand1MaxG !== null}, ${profile.selfDeliveryYen !== null}, ${profile.pickupPlace !== null}, now())`;
    console.log(`    出品 ${l.vegetable}：作った`);
  }
}

for (const b of buyers) {
  const id = await userId(b.email);
  const created = await sql`
    insert into buyer_profile ("userId", prefecture, city, address, "updatedAt")
    values (${id}, ${b.prefecture}, ${b.city}, ${b.address}, now())
    on conflict ("userId") do nothing
    returning "userId"`;
  console.log(`  ${b.email} プロフィール：${created.length ? "作った" : "すでにある（そのまま）"}`);
}

// テスト用の「探しています」（同じお店で公開中のものがなければ作る）。予算は保存しない
const wanted = [
  { email: "buyer1@example.com", kind: "specified", vegetable: "賀茂茄子", substitutes: [], quantityG: 1000, method: "delivery" },
  { email: "buyer2@example.com", kind: "substitute", vegetable: "万願寺唐辛子", substitutes: ["伏見甘長", "ししとう"], quantityG: 2000, method: "delivery" },
  { email: "buyer3@example.com", kind: "any", vegetable: "", substitutes: [], quantityG: 5000, method: "self" },
];
for (const w of wanted) {
  const id = await userId(w.email);
  const exists = await sql`select 1 from wanted_request where "buyerId" = ${id} and closed = false and "useDate" >= current_date`;
  if (exists.length) {
    console.log(`  ${w.email} 探しています：公開中のものがある（作らない）`);
    continue;
  }
  const [b] = await sql`select prefecture, city from buyer_profile where "userId" = ${id}`;
  await sql`
    insert into wanted_request (id, "buyerId", kind, vegetable, substitutes, "quantityG", "useDate", method, prefecture, city)
    values (${randomUUID()}, ${id}, ${w.kind}, ${w.vegetable}, ${w.substitutes}, ${w.quantityG}, ${dateOnly(7)}, ${w.method}, ${b.prefecture}, ${b.city})`;
  console.log(`  ${w.email} 探しています：作った`);
}
