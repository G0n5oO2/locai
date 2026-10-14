// 注文の状態の表示名（docs/04_producer_design.md 4章）
export const orderStatusLabel = {
  pending: "回答待ち",
  change_pending: "条件変更の確認待ち",
  confirmed: "販売確定",
  declined: "見送り",
  cancelled: "取消",
  expired: "期限切れ",
} as const;
