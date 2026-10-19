// 飲食店のホーム（第2版 4-4）。季節の野菜と、規格外の野菜の特集を大きく出す
// （農園マップは保留中）
import Link from "next/link";
import { AuthShell } from "@/app/ui/auth-shell";
import { IrregularArt, SeasonalArt } from "./feature-art";

const features = [
  {
    href: "/buyer/home/seasonal",
    title: "季節の野菜（旬の野菜）を紹介",
    text: "今が旬の野菜と、その野菜を使った料理の案を見られます。",
    art: <SeasonalArt />,
    tone: "bg-leaf-soft",
  },
  {
    href: "/buyer/home/irregular",
    title: "規格外の野菜の特集",
    text: "形や大きさがふぞろいでも、味は同じ。通常品より手ごろなこともあります。",
    art: <IrregularArt />,
    tone: "bg-earth-soft",
  },
];

export default function BuyerHomePage() {
  return (
    <AuthShell title="ホーム" wide>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className={`flex flex-col items-center gap-3 rounded-3xl p-6 text-center ${f.tone}`}>
            {f.art}
            <p className="text-xl font-bold">{f.title}</p>
            <p className="text-sm leading-6 text-muted">{f.text}</p>
            <span className="font-bold text-leaf underline">見てみる</span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
