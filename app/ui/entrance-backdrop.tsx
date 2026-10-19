// 入口の画面（最初の画面・ログイン・新規登録）の背景（第2版 4-1）
// やさしく淡い、あたたかい色の空（桃色 → クリーム色）に、ふんわりした雲と、やわらかい野菜がふわふわ浮かぶ
// 野菜は、入力欄の邪魔にならないよう画面の左右のはしに置く。押せないようにする
// 「動きを減らす」設定の人には、野菜を動かさずに止めて出す
import type { CSSProperties } from "react";
import { SoftVeg, type SoftVegKind } from "@/app/buyer/home/feature-art";

// 浮かぶ野菜の、位置（画面の何%）・大きさ（px）・傾き・動き出す時間のずれ
// pcOnly の野菜は、パソコンの広い画面にだけ出す（スマホでは入力欄のまわりがせまいため）
const floaters: { kind: SoftVegKind; left?: string; right?: string; top: string; size: number; tilt: number; delay: number; pcOnly?: boolean }[] = [
  { kind: "tomato", left: "4%", top: "12%", size: 64, tilt: -8, delay: 0 },
  { kind: "carrot", left: "10%", top: "42%", size: 72, tilt: 10, delay: 1.2 },
  { kind: "cabbage", left: "3%", top: "72%", size: 76, tilt: -4, delay: 2.4 },
  { kind: "eggplant", right: "5%", top: "16%", size: 70, tilt: 8, delay: 0.6 },
  { kind: "pumpkin", right: "9%", top: "48%", size: 72, tilt: -6, delay: 1.8 },
  { kind: "greens", right: "4%", top: "76%", size: 68, tilt: 6, delay: 3 },
  { kind: "radish", left: "22%", top: "88%", size: 56, tilt: -10, delay: 2 },
  { kind: "pepper", right: "22%", top: "6%", size: 56, tilt: 12, delay: 3.6 },
  { kind: "onion", left: "19%", top: "22%", size: 60, tilt: 6, delay: 0.9, pcOnly: true },
  { kind: "beans", right: "18%", top: "30%", size: 60, tilt: -8, delay: 2.7, pcOnly: true },
  { kind: "sweetpotato", left: "17%", top: "60%", size: 62, tilt: 10, delay: 1.5, pcOnly: true },
  { kind: "potato", right: "17%", top: "66%", size: 58, tilt: -6, delay: 3.3, pcOnly: true },
];

// ふんわりした雲（位置は画面の何%）
const clouds = [
  { left: "8%", top: "6%", scale: 1 },
  { left: "62%", top: "10%", scale: 0.8 },
  { left: "40%", top: "26%", scale: 0.6 },
];

export function EntranceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linear-to-b from-[#fde8da] via-[#fdf1e4] to-background">
      {/* 右上の、ふんわりした光（あたたかさを足す） */}
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[radial-gradient(circle,#fff1c9_0%,transparent_70%)] opacity-80" />
      {clouds.map((c) => (
        <svg key={c.left} viewBox="-40 -24 80 44" className="absolute w-40 opacity-90" style={{ left: c.left, top: c.top, transform: `scale(${c.scale})` }}>
          <circle cx="-18" cy="2" r="14" fill="#fffaf3" />
          <circle cx="0" cy="-6" r="18" fill="#ffffff" />
          <circle cx="20" cy="2" r="13" fill="#ffffff" />
          <rect x="-32" y="0" width="64" height="15" rx="7.5" fill="#ffffff" />
        </svg>
      ))}
      {floaters.map((f) => (
        // 外側の箱で、パソコンでは 1.5 倍に大きくする。内側の絵が、ふわふわ動く
        <div
          key={f.kind}
          className={`absolute md:scale-150 ${f.pcOnly ? "hidden md:block" : ""}`}
          style={{ left: f.left, right: f.right, top: f.top, width: f.size, height: f.size }}
        >
          <svg
            viewBox="-26 -48 52 54"
            className="h-full w-full animate-float opacity-80 motion-reduce:animate-none"
            style={{ animationDelay: `${f.delay}s`, "--tilt": `${f.tilt}deg` } as CSSProperties}
          >
            <SoftVeg kind={f.kind} />
          </svg>
        </div>
      ))}
    </div>
  );
}
