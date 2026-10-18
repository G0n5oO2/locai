// 計算（第2版 4-3）。配送の実費・梱包費などを差し引いた、概算受取額の試算
import { Suspense } from "react";
import { AuthShell } from "@/app/ui/auth-shell";
import { requireProducer } from "@/lib/session";
import { CalcForm } from "./calc-form";

export default function CalcPage() {
  return (
    <AuthShell title="計算（概算受取額の試算）" wide>
      <Suspense fallback={<p className="text-muted">読み込んでいます…</p>}>
        <Calc />
      </Suspense>
    </AuthShell>
  );
}

async function Calc() {
  // 生産者だけが使える（計算はブラウザの中だけで行い、どこにも保存しない）
  await requireProducer();
  return <CalcForm />;
}
