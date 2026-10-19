// ホーム以外の画面の背景（第2版 4-1）：そのタブに合う野菜や道具の絵を、壁紙のように散らす
// プロフィールのタブだけは立場で変える（農家さん：畑・土っぽい、お店：台所・市場っぽい）
// 文字が読みにくくならないよう、とてもうすくする。押せないようにする
import type { ReactNode } from "react";
import { Vegetable } from "./farm-map";

export type WallpaperTheme = "listing" | "calc" | "shopping" | "wanted" | "trial" | "message" | "profileFarm" | "profileKitchen";

// ===== 散らす絵（どれも、だいたい 40×40 の大きさ。x=0, y=0 が真ん中） =====

function Crate() {
  // 木箱
  return (
    <g>
      <rect x="-16" y="-10" width="32" height="20" rx="3" fill="#d9a86a" />
      <path d="M-16 -3 H16 M-16 4 H16" stroke="#b07c42" strokeWidth="2" />
      <circle cx="-8" cy="-14" r="5" fill="#e8574a" />
      <circle cx="3" cy="-15" r="5" fill="#7fb069" />
      <circle cx="11" cy="-13" r="4" fill="#f08a3c" />
    </g>
  );
}
function PriceTag() {
  // 値札
  return (
    <g transform="rotate(-20)">
      <path d="M-14 -8 H8 L16 0 L8 8 H-14 Z" fill="#f6d27a" />
      <circle cx="9" cy="0" r="2.5" fill="#fff8ec" />
      <path d="M-9 -2 H2 M-9 3 H-1" stroke="#b8902f" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}
function Calculator() {
  // 電卓
  return (
    <g>
      <rect x="-12" y="-16" width="24" height="32" rx="4" fill="#9cc7a4" />
      <rect x="-8" y="-12" width="16" height="7" rx="1.5" fill="#eaf6ec" />
      {[-6, 0, 6].map((x) => [-1, 5, 11].map((y) => <rect key={`${x}${y}`} x={x - 2} y={y - 2} width="4" height="4" rx="1" fill="#ffffff" />))}
    </g>
  );
}
function Coin() {
  // お金（円玉）
  return (
    <g>
      <circle r="11" fill="#f2c94c" />
      <circle r="8" fill="none" stroke="#d9a92a" strokeWidth="1.5" />
      <path d="M-4 -5 L0 0 L4 -5 M0 0 V6 M-4 1 H4" stroke="#b8862a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  );
}
function Receipt() {
  // レシート
  return (
    <g transform="rotate(10)">
      <path d="M-10 -15 H10 V13 L6 10 L2 13 L-2 10 L-6 13 L-10 10 Z" fill="#ffffff" stroke="#e1d6c2" strokeWidth="1.2" />
      <path d="M-6 -9 H6 M-6 -4 H4 M-6 1 H6 M-6 6 H2" stroke="#c9b99c" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}
function Basket() {
  // 買い物かご
  return (
    <g>
      <path d="M-12 -6 Q0 -22 12 -6" fill="none" stroke="#b07c42" strokeWidth="3" strokeLinecap="round" />
      <path d="M-16 -6 H16 L12 12 H-12 Z" fill="#d9a86a" />
      <path d="M-8 -6 L-6 12 M0 -6 V12 M8 -6 L6 12" stroke="#b07c42" strokeWidth="1.5" />
    </g>
  );
}
function Cart() {
  // 買い物カート
  return (
    <g>
      <path d="M-18 -12 H-12 L-7 8 H12 L16 -6 H-10" fill="none" stroke="#7fae8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-5" cy="14" r="3" fill="#7fae8a" />
      <circle cx="10" cy="14" r="3" fill="#7fae8a" />
    </g>
  );
}
function Magnifier() {
  // 虫めがね
  return (
    <g>
      <circle cx="-3" cy="-3" r="10" fill="#e3f4fb" stroke="#8fbfd6" strokeWidth="3" />
      <path d="M5 5 L14 14" stroke="#8fbfd6" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}
function Question() {
  // はてなの吹き出し
  return (
    <g>
      <path d="M-14 -12 H14 Q16 -12 16 -10 V6 Q16 8 14 8 H-2 L-8 14 V8 H-14 Q-16 8 -16 6 V-10 Q-16 -12 -14 -12 Z" fill="#f6d27a" />
      <path d="M-3 -6 Q0 -9 3 -6 Q4 -3 0 -1 V1" fill="none" stroke="#b8902f" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="4" r="1.3" fill="#b8902f" />
    </g>
  );
}
function Gift() {
  // プレゼントの箱
  return (
    <g>
      <rect x="-13" y="-6" width="26" height="18" rx="2" fill="#f4a3a3" />
      <rect x="-15" y="-11" width="30" height="7" rx="2" fill="#f7b9b9" />
      <rect x="-2" y="-11" width="4" height="23" fill="#ffffff" />
      <path d="M0 -11 Q-9 -20 -8 -12 M0 -11 Q9 -20 8 -12" fill="none" stroke="#e57f7f" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}
function Pouch() {
  // 小さな袋（お試し）
  return (
    <g>
      <path d="M-10 -6 Q-12 12 0 13 Q12 12 10 -6 Z" fill="#e9d6b4" />
      <path d="M-11 -7 H11" stroke="#b07c42" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy="3" r="4" fill="#7fb069" />
    </g>
  );
}
function Spoon() {
  // スプーン
  return (
    <g transform="rotate(35)">
      <ellipse cx="0" cy="-9" rx="5" ry="7" fill="#d5dde3" />
      <rect x="-1.5" y="-3" width="3" height="18" rx="1.5" fill="#d5dde3" />
    </g>
  );
}
function Bubble() {
  // ふきだし
  return (
    <g>
      <path d="M-15 -11 H15 Q17 -11 17 -9 V5 Q17 7 15 7 H-1 L-8 13 V7 H-15 Q-17 7 -17 5 V-9 Q-17 -11 -15 -11 Z" fill="#bfe3c4" />
      <circle cx="-7" cy="-2" r="2" fill="#ffffff" />
      <circle cx="0" cy="-2" r="2" fill="#ffffff" />
      <circle cx="7" cy="-2" r="2" fill="#ffffff" />
    </g>
  );
}
function Letter() {
  // 手紙
  return (
    <g transform="rotate(-8)">
      <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#fff4d6" />
      <path d="M-15 -9 L0 3 L15 -9" fill="none" stroke="#e2c27a" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="5" r="3" fill="#f4a3a3" />
    </g>
  );
}
function Sprout() {
  // 土から出た芽
  return (
    <g>
      <ellipse cx="0" cy="10" rx="13" ry="4" fill="#c49a6a" />
      <path d="M0 10 V-2" stroke="#5f9e4f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0 -2 Q-12 -4 -11 -13 Q-2 -12 0 -2 Z" fill="#7fbf6a" />
      <path d="M0 0 Q11 -2 11 -10 Q2 -10 0 0 Z" fill="#9fd48a" />
    </g>
  );
}
function WateringCan() {
  // じょうろ
  return (
    <g>
      <rect x="-12" y="-6" width="18" height="16" rx="4" fill="#8fc3d9" />
      <path d="M6 -2 L16 -10" stroke="#8fc3d9" strokeWidth="4" strokeLinecap="round" />
      <path d="M-12 -2 Q-20 -2 -18 6" fill="none" stroke="#8fc3d9" strokeWidth="3" />
      <path d="M-8 -6 Q-3 -14 2 -6" fill="none" stroke="#6fa9c2" strokeWidth="2.5" />
    </g>
  );
}
function StrawHat() {
  // 麦わら帽子
  return (
    <g>
      <ellipse cx="0" cy="4" rx="18" ry="6" fill="#ecc777" />
      <path d="M-9 4 Q-9 -10 0 -10 Q9 -10 9 4 Z" fill="#f2d48c" />
      <path d="M-9 0 H9" stroke="#e57f6a" strokeWidth="3" />
    </g>
  );
}
function Shovel() {
  // スコップ
  return (
    <g transform="rotate(-30)">
      <rect x="-1.5" y="-16" width="3" height="16" rx="1.5" fill="#b07c42" />
      <rect x="-5" y="-19" width="10" height="4" rx="2" fill="#b07c42" />
      <path d="M-7 0 H7 V6 Q0 14 -7 6 Z" fill="#aab8c2" />
    </g>
  );
}
function Pot() {
  // なべ
  return (
    <g>
      <path d="M-14 -4 H14 V6 Q14 12 8 12 H-8 Q-14 12 -14 6 Z" fill="#e8a27a" />
      <rect x="-16" y="-8" width="32" height="5" rx="2.5" fill="#d98b62" />
      <path d="M-20 -1 H-14 M14 -1 H20" stroke="#d98b62" strokeWidth="3" strokeLinecap="round" />
      <path d="M-5 -14 Q-3 -18 -5 -22 M3 -14 Q5 -18 3 -22" fill="none" stroke="#c9d6dd" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}
function ChefHat() {
  // コック帽
  return (
    <g>
      <rect x="-9" y="2" width="18" height="9" rx="2" fill="#ffffff" stroke="#e4ddd0" strokeWidth="1.2" />
      <path d="M-9 3 Q-18 -2 -12 -10 Q-8 -17 0 -13 Q8 -17 12 -10 Q18 -2 9 3 Z" fill="#ffffff" stroke="#e4ddd0" strokeWidth="1.2" />
    </g>
  );
}
function CuttingBoard() {
  // まな板と、切った野菜
  return (
    <g>
      <rect x="-17" y="-9" width="30" height="18" rx="4" fill="#e7c391" />
      <circle cx="16" cy="0" r="3" fill="#e7c391" />
      <circle cx="-7" cy="0" r="4" fill="#f08a3c" />
      <circle cx="2" cy="0" r="4" fill="#f08a3c" />
      <circle cx="-7" cy="0" r="1.6" fill="#f6b27a" />
      <circle cx="2" cy="0" r="1.6" fill="#f6b27a" />
    </g>
  );
}
function Plate() {
  // お皿と料理
  return (
    <g>
      <ellipse cx="0" cy="4" rx="17" ry="7" fill="#ffffff" stroke="#e4ddd0" strokeWidth="1.2" />
      <ellipse cx="0" cy="2" rx="9" ry="4" fill="#bfe39a" />
      <circle cx="-3" cy="0" r="2.5" fill="#e8574a" />
      <circle cx="3" cy="1" r="2.5" fill="#f08a3c" />
    </g>
  );
}

const veg = (kind: "cabbage" | "tomato" | "eggplant" | "carrot") => (
  <g transform="translate(0 8) scale(1.8)">
    <Vegetable kind={kind} />
  </g>
);

// タブごとに散らす絵（6つ。くり返すときに、同じ並びにならないよう位置と傾きを変える）
const themes: Record<WallpaperTheme, ReactNode[]> = {
  listing: [veg("eggplant"), <Crate key="c" />, veg("tomato"), <PriceTag key="p" />, veg("cabbage"), veg("carrot")],
  calc: [<Calculator key="a" />, <Coin key="b" />, <Receipt key="c" />, <Coin key="d" />, veg("tomato"), <Calculator key="e" />],
  shopping: [<Basket key="a" />, veg("tomato"), <Cart key="b" />, veg("eggplant"), veg("carrot"), veg("cabbage")],
  wanted: [<Magnifier key="a" />, veg("cabbage"), <Question key="b" />, veg("eggplant"), <Magnifier key="c" />, veg("tomato")],
  trial: [<Gift key="a" />, <Pouch key="b" />, <Spoon key="c" />, veg("tomato"), <Gift key="d" />, veg("carrot")],
  message: [<Bubble key="a" />, <Letter key="b" />, veg("tomato"), <Bubble key="c" />, <Letter key="d" />, veg("cabbage")],
  profileFarm: [<Sprout key="a" />, <WateringCan key="b" />, <StrawHat key="c" />, <Shovel key="d" />, <Sprout key="e" />, veg("carrot")],
  profileKitchen: [<Pot key="a" />, <ChefHat key="b" />, <CuttingBoard key="c" />, <Plate key="d" />, veg("tomato"), <Pot key="e" />],
};

// 1枚の模様の中の、絵の位置と傾き（大きさ 300×300 の四角に、まばらに置く）
const spots = [
  { x: 50, y: 55, r: -12 },
  { x: 190, y: 40, r: 10 },
  { x: 120, y: 145, r: 6 },
  { x: 255, y: 160, r: -8 },
  { x: 45, y: 240, r: 14 },
  { x: 185, y: 255, r: -6 },
];

export function Wallpaper({ theme }: { theme: WallpaperTheme }) {
  const id = `wp-${theme}`;
  return (
    <svg aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.15]">
      <defs>
        <pattern id={id} width="300" height="300" patternUnits="userSpaceOnUse">
          {themes[theme].map((icon, k) => (
            <g key={k} transform={`translate(${spots[k].x} ${spots[k].y}) rotate(${spots[k].r}) scale(1.1)`}>
              {icon}
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// 画面のアドレス（パス）と立場から、どの壁紙にするかを決める。ホームなど、壁紙を出さない画面は null
export function wallpaperFor(pathname: string, role: "producer" | "buyer"): WallpaperTheme | null {
  const starts = (...prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (starts("/producer/home") || pathname === "/buyer/home") return null; // ホームは農園の背景
  if (starts("/mypage", "/producer/profile", "/buyer/profile")) return role === "producer" ? "profileFarm" : "profileKitchen";
  if (starts("/producer/messages", "/buyer/messages", "/orders")) return "message";
  if (starts("/producer/trial", "/buyer/trial")) return "trial";
  if (starts("/producer/calc")) return "calc";
  if (starts("/producer/listings", "/producer/orders", "/producer/wanted")) return "listing";
  if (starts("/buyer/wanted")) return "wanted";
  if (starts("/buyer/search", "/buyer/listings", "/buyer/orders", "/buyer/home")) return "shopping";
  return null;
}
