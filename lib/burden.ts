// 出荷の負担の目安（docs/04_producer_design.md 1章・2章）

export type DeliveryMethod = "delivery" | "self" | "pickup";

export const methodLabel: Record<DeliveryMethod, string> = {
  delivery: "宅配発送",
  self: "自分で配達",
  pickup: "引き取り",
};

// 最大で何件の発送になるか：総量 ÷ 最低注文量（あまりは切り捨て。最低注文量に届かない残りは申し込めないため）
export function maxOrderCount(totalG: number, minOrderG: number): number {
  if (minOrderG <= 0) return 0;
  return Math.floor(totalG / minOrderG);
}

type Limits = { shipLimitDelivery: number; shipLimitSelf: number; shipLimitPickup: number };

// その出品で対応する受け渡し方法のうち、一番少ない件数しかこなせない方法の基準（最悪の場合で比べる）
export function strictestLimit(limits: Limits, methods: DeliveryMethod[]): { method: DeliveryMethod; limit: number } | null {
  const all: { method: DeliveryMethod; limit: number }[] = [
    { method: "delivery", limit: limits.shipLimitDelivery },
    { method: "self", limit: limits.shipLimitSelf },
    { method: "pickup", limit: limits.shipLimitPickup },
  ];
  const offered = all.filter((x) => methods.includes(x.method));
  if (offered.length === 0) return null;
  return offered.reduce((a, b) => (b.limit < a.limit ? b : a));
}
