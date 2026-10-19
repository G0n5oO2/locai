// 入力が必須の項目に付ける、赤い「必須」のしるし（第2版）
// どの項目が必須かは、サーバーで確かめている決まりに合わせて付ける
export function RequiredMark() {
  return <span className="ml-1.5 inline-block rounded-full bg-red-600 px-1.5 py-px align-middle text-[10px] font-bold leading-4 text-white">必須</span>;
}

// 入力しなくてもよい項目に付ける、うすい「任意」のしるし
export function OptionalMark() {
  return <span className="ml-1.5 inline-block rounded-full bg-line px-1.5 py-px align-middle text-[10px] font-bold leading-4 text-muted">任意</span>;
}
