// テスト用の利用者（生産者・飲食店）を登録するプログラム
// 実行：開発用サーバー（npm run dev）を動かしたまま、別のターミナルで npm run seed:users
// 名前やメールアドレスはすべて作り物。実在のお店や人の情報は使わない。
// 何度実行しても、すでにいる人はそのままにする（二重に登録しない）。

const baseURL = process.env.SEED_BASE_URL ?? "http://localhost:3000";

// デモ用のパスワード（全員共通）。作り物のアカウントにだけ使う
const password = "demo-pass-1234";

const users = [
  { role: "producer", name: "南丹やさい畑（デモ）", email: "producer1@example.com" },
  { role: "producer", name: "亀岡ふもと農園（デモ）", email: "producer2@example.com" },
  { role: "producer", name: "はじめての畑（デモ・新規就農）", email: "producer3@example.com" },
  { role: "buyer", name: "小料理 みかみ（デモ）", email: "buyer1@example.com" },
  { role: "buyer", name: "洋食 つばめ亭（デモ）", email: "buyer2@example.com" },
  { role: "buyer", name: "定食 ひだまり（デモ）", email: "buyer3@example.com" },
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
