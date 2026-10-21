// 読み込み中の表示（第2版）。トマト・にんじん・なすが、順番にぴょんぴょん跳ねる
// 「動きを減らす」設定の人には、跳ねずに止まった野菜を出す。読み上げには「読み込んでいます」と伝える
import { SoftVeg, type SoftVegKind } from "@/app/buyer/home/feature-art";

const vegs: SoftVegKind[] = ["tomato", "carrot", "eggplant"];

export function Loading({ label = "読み込んでいます" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-10">
      <div aria-hidden className="flex items-end gap-3">
        {vegs.map((kind, i) => (
          <svg
            key={kind}
            viewBox="-26 -48 52 54"
            className="size-12 animate-hop motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            <SoftVeg kind={kind} />
          </svg>
        ))}
      </div>
      <p className="text-sm font-bold text-muted">{label}…</p>
    </div>
  );
}
