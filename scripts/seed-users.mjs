// テスト用の利用者（生産者・飲食店）を登録するプログラム
// 実行：開発用サーバー（npm run dev）を動かしたまま、別のターミナルで npm run seed:users
// 名前やメールアドレスはすべて作り物。実在のお店や人の情報は使わない。
// 何度実行しても、すでにいる人はそのままにする（二重に登録しない）。

const baseURL = process.env.SEED_BASE_URL ?? "http://localhost:3000";

// デモ用のパスワード（全員共通）。作り物のアカウントにだけ使う
const password = "demo-pass-1234";

const users = [
  { role: "producer", name: "南丹やさい畑", email: "producer1@example.com" },
  { role: "producer", name: "亀岡ふもと農園", email: "producer2@example.com" },
  { role: "producer", name: "はじめての畑（新規就農）", email: "producer3@example.com" },
  // 地図で探すを試すために、関西の各地に散らした農家さん（第2版）
  { role: "producer", name: "湖東ひかり農園", email: "producer4@example.com" },
  { role: "producer", name: "高島しずく畑", email: "producer5@example.com" },
  { role: "producer", name: "丹後うみかぜ農園", email: "producer6@example.com" },
  { role: "producer", name: "能勢さとやま農園", email: "producer7@example.com" },
  { role: "producer", name: "泉州みずなす畑", email: "producer8@example.com" },
  { role: "producer", name: "丹波くろまめ農園", email: "producer9@example.com" },
  { role: "producer", name: "淡路たまねぎ畑", email: "producer10@example.com" },
  { role: "producer", name: "大和高原やさい畑", email: "producer11@example.com" },
  { role: "producer", name: "紀の川くだもの畑", email: "producer12@example.com" },
  { role: "buyer", name: "小料理 みかみ", email: "buyer1@example.com" },
  { role: "buyer", name: "洋食 つばめ亭", email: "buyer2@example.com" },
  { role: "buyer", name: "定食 ひだまり", email: "buyer3@example.com" },
];

for (const user of users) {
  const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseURL },
    body: JSON.stringify({ ...user, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.ok) console.log(`  登録した    ${user.email}（${user.name}）`);
  else if (body.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") console.log(`  すでにいる  ${user.email}`);
  else console.log(`  失敗        ${user.email}：${body.message ?? response.status}`);
}

console.log(`\nパスワードは全員「${password}」です。`);
