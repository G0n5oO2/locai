// 売上のまとめ（第2版 4-3「注文管理」）
// 数えるのは販売確定した注文だけ。金額は商品代だけ（送料は配送の実費に消えるので含めない）
// どの月かは、納品日の月で決める。金額は円、量は g の整数で足し算する
import "server-only";
import { jstDateText } from "./datetime";
import { prisma } from "./prisma";

// 今月を含めて、何か月分を出すか
const MONTHS = 6;

// "2026-10" から n か月前の "2026-05" を作る
function monthBefore(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) - n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export async function salesSummary(producerId: string, now = new Date()) {
  const thisMonth = jstDateText(now).slice(0, 7);
  const months = Array.from({ length: MONTHS }, (_, i) => monthBefore(thisMonth, MONTHS - 1 - i)); // 古い月 → 今月
  const from = new Date(`${months[0]}-01T00:00:00Z`);

  // 自分の出品への、販売確定した注文だけ（他人の注文は数えない）
  const orders = await prisma.order.findMany({
    where: { status: "confirmed", listing: { producerId }, deliveryDate: { gte: from } },
    select: { deliveryDate: true, quantityG: true, itemYen: true, listing: { select: { vegetable: true } } },
  });

  // 月別：売れていない月も 0円 として並べる
  const byMonth = new Map(months.map((m) => [m, { month: m, yen: 0, count: 0 }]));
  // 野菜別（同じ6か月の中で）
  const byVegetable = new Map<string, { vegetable: string; quantityG: number; yen: number }>();
  for (const o of orders) {
    const month = byMonth.get(o.deliveryDate.toISOString().slice(0, 7));
    if (!month) continue; // 来月以降の納品は、まだ数えない
    month.yen += o.itemYen;
    month.count += 1;
    const v = byVegetable.get(o.listing.vegetable) ?? { vegetable: o.listing.vegetable, quantityG: 0, yen: 0 };
    v.quantityG += o.quantityG;
    v.yen += o.itemYen;
    byVegetable.set(o.listing.vegetable, v);
  }
  return {
    months: [...byMonth.values()].reverse(), // 表では今月を一番上にする
    // 売れ筋の順：販売数量が多い順（同じなら売上が多い順）
    vegetables: [...byVegetable.values()].sort((a, b) => b.quantityG - a.quantityG || b.yen - a.yen),
  };
}
