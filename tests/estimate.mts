// 計算タブの試算のテスト（第2版 4-3「計算」）。データベースは使わない
// 実行：npm run test:estimate

import { directReceipt, itemYenOf, marketReceipt, yenInput } from "../lib/estimate";
import { kgTextToGrams } from "../lib/quantity";

let failed = false;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "OK" : "NG"}  ${name}${detail ? `：${detail}` : ""}`);
  if (!ok) failed = true;
}

const g = kgTextToGrams("5")!; // 5kg
const item = itemYenOf(600, g); // 1kg 600円 × 5kg
check("商品代 ＝ 単価 × 数量", item === 3000, `${item}円`);
check("1円未満は切り捨て（1kg 333円 × 0.5kg ＝ 166.5円 → 166円）", itemYenOf(333, kgTextToGrams("0.5")!) === 166);
check("自分で届ける：3,000 ＋ 配達料500 − ガソリン代300 − 梱包費100 ＝ 3,100円", directReceipt(item, { feeYen: 500, deliveryCostYen: 300, packingYen: 100 }) === 3100);
check("受け取り：3,000 − 梱包費100 ＝ 2,900円", directReceipt(item, { feeYen: 0, deliveryCostYen: 0, packingYen: 100 }) === 2900);
check("郵送：3,000 ＋ 送料800 − 送料の実費1,000 − 梱包費200 ＝ 2,600円", directReceipt(item, { feeYen: 800, deliveryCostYen: 1000, packingYen: 200 }) === 2600);
check("市場：1kg 400円 × 5kg − 手数料300 ＝ 1,700円", marketReceipt(400, g, 300) === 1700);
check("空の欄は 0円", yenInput("") === 0);
check("小数や記号は受け付けない", yenInput("12.5") === null && yenInput("-100") === null && yenInput("abc") === null);
check("1,000,000円まで", yenInput("1000000") === 1000000 && yenInput("1000001") === null);

console.log(failed ? "\nNG があります" : "\nすべて OK です");
process.exit(failed ? 1 : 0);
