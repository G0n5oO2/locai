import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 日本語のフォント。日本語は文字の種類が多く subsets が使えないため、先読み（preload）はしない
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  preload: false,
});

export const metadata: Metadata = {
  title: "LocAI｜地元の野菜を、必要な量で。",
  description: "関西の農家さんとお店を、必要な量でつなぐ野菜の仕入れアプリ",
};

// スマートフォンで見たときの表示の設定
export const viewport: Viewport = {
  themeColor: "#2f6b3a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
