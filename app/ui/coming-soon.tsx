// 「準備中」の画面（第2版で中身を作る予定の画面の入れ物）
import { AuthShell } from "./auth-shell";

export function ComingSoon({ title, plan }: { title: string; plan: string }) {
  return (
    <AuthShell title={title}>
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5">
        <p className="w-fit rounded-full bg-earth-soft px-3 py-0.5 text-sm font-medium text-earth">準備中</p>
        <p className="leading-7 text-muted">{plan}</p>
      </div>
    </AuthShell>
  );
}
