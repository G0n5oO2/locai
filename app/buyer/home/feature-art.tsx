// 飲食店のホームの特集に使うイラスト（写真の準備ができたら差し替える）
// 立体的に見えるように、光が当たる明るいところ・端の暗いところ（グラデーション）・てかり・影を付ける
// 同じ絵が1つの画面に何回出ても同じ見た目なので、グラデーションの名前（id）は固定にしている

// 季節の野菜：かごいっぱいの野菜
export function SeasonalArt() {
  return (
    <svg aria-hidden viewBox="0 0 160 100" className="h-32 w-auto">
      <defs>
        {/* 球のような丸みを出すグラデーション（左上が明るい） */}
        <radialGradient id="sa-eggplant" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#a678c9" />
          <stop offset="60%" stopColor="#6b3f8f" />
          <stop offset="100%" stopColor="#3d2154" />
        </radialGradient>
        <radialGradient id="sa-tomato" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8a73" />
          <stop offset="60%" stopColor="#d6402f" />
          <stop offset="100%" stopColor="#8e2117" />
        </radialGradient>
        <radialGradient id="sa-cabbage" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#c9e7a8" />
          <stop offset="60%" stopColor="#7fb069" />
          <stop offset="100%" stopColor="#4c7a3a" />
        </radialGradient>
        <linearGradient id="sa-carrot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffb066" />
          <stop offset="50%" stopColor="#e67e22" />
          <stop offset="100%" stopColor="#a8550f" />
        </linearGradient>
        {/* かごの木の色（上が明るく、下が暗い） */}
        <linearGradient id="sa-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2b574" />
          <stop offset="100%" stopColor="#9c6a2e" />
        </linearGradient>
      </defs>
      {/* 影 */}
      <ellipse cx="80" cy="94" rx="62" ry="5" fill="#000000" opacity="0.15" />
      {/* 野菜（かごの後ろから顔を出す） */}
      <ellipse cx="50" cy="40" rx="12" ry="20" transform="rotate(-25 50 40)" fill="url(#sa-eggplant)" />
      <ellipse cx="45" cy="33" rx="3" ry="7" transform="rotate(-25 45 33)" fill="#ffffff" opacity="0.45" />
      {/* なすのへた（実の上の端につける） */}
      <path d="M36 25q6-6 12-1" fill="#2f6b3a" />
      <path d="M42 23l-3-9" stroke="#2f6b3a" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 56L87 15L96 19Z" fill="url(#sa-carrot)" />
      <path d="M91 17l-3-9M91 17l7-6" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="77" cy="42" r="14" fill="url(#sa-cabbage)" />
      <path d="M70 40q7-8 14 0" fill="none" stroke="#4c7a3a" strokeWidth="1.5" opacity="0.6" />
      <circle cx="116" cy="44" r="12" fill="url(#sa-tomato)" />
      <ellipse cx="111" cy="39" rx="3.5" ry="2.5" fill="#ffffff" opacity="0.6" />
      <path d="M116 32l2-6M112 33l-3-2M120 33l3-2" stroke="#2f6b3a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M100 52c0-16 7-27 18-27 0 13-7 27-18 27z" fill="#2f6b3a" />
      {/* かご（ふちは明るく、側面は木の色のグラデーション） */}
      <path d="M22 50h116l-11 42H33z" fill="url(#sa-basket)" />
      <path d="M28 62h104M31 74h98" stroke="#7a4f1f" strokeWidth="2" opacity="0.7" />
      <path d="M50 52l-4 38M80 52v38M110 52l4 38" stroke="#7a4f1f" strokeWidth="1.5" opacity="0.5" />
      <rect x="18" y="45" width="124" height="8" rx="4" fill="#f0c98b" stroke="#9c6a2e" strokeWidth="1.5" />
    </svg>
  );
}

// 規格外の野菜：形がふぞろいな野菜たち
export function IrregularArt() {
  return (
    <svg aria-hidden viewBox="0 0 160 100" className="h-32 w-auto">
      <defs>
        <linearGradient id="ia-cucumber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fbf6a" />
          <stop offset="100%" stopColor="#2c5e28" />
        </linearGradient>
        <linearGradient id="ia-carrot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffb066" />
          <stop offset="50%" stopColor="#e67e22" />
          <stop offset="100%" stopColor="#a8550f" />
        </linearGradient>
        <radialGradient id="ia-tomato" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ff8a73" />
          <stop offset="60%" stopColor="#d6402f" />
          <stop offset="100%" stopColor="#8e2117" />
        </radialGradient>
      </defs>
      {/* 影 */}
      <ellipse cx="80" cy="92" rx="66" ry="5" fill="#000000" opacity="0.15" />
      {/* 曲がったきゅうり（太い線に、明るい線を重ねて丸みを出す） */}
      <path d="M22 78C32 36 62 28 72 38" fill="none" stroke="url(#ia-cucumber)" strokeWidth="14" strokeLinecap="round" />
      <path d="M26 70C35 40 58 33 67 38" fill="none" stroke="#b6e0a3" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M40 52l2 1M50 44l2 1M60 40l2 1" stroke="#1f4a1c" strokeWidth="2" strokeLinecap="round" />
      {/* 二股のにんじん */}
      <path d="M86 26L98 26L94 58L102 82L95 84L90 66L84 84L77 82L86 58Z" fill="url(#ia-carrot)" />
      <path d="M88 34l6 0M88 44l5 0M87 54l5 0" stroke="#a8550f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M92 26l-4-11M92 26l7-11M92 26l1-12" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      {/* ふぞろいなトマト（てかり付き） */}
      <path d="M118 44c10-7 27 0 25 17s-19 23-29 15-7-26 4-32z" fill="url(#ia-tomato)" />
      <ellipse cx="124" cy="50" rx="4" ry="2.5" fill="#ffffff" opacity="0.6" />
      <path d="M129 42l2-7M125 43l-3-2M133 43l3-2" stroke="#2f6b3a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 季節の野菜の画面で使う、小さな野菜の絵（名前から色を決める。写真の準備ができたら差し替える）
const vegColors = [
  { id: "vi-0", light: "#a678c9", base: "#6b3f8f", dark: "#3d2154" },
  { id: "vi-1", light: "#ffb066", base: "#e67e22", dark: "#a8550f" },
  { id: "vi-2", light: "#c9e7a8", base: "#7fb069", dark: "#4c7a3a" },
  { id: "vi-3", light: "#ff8a73", base: "#d6402f", dark: "#8e2117" },
  { id: "vi-4", light: "#f0d3a0", base: "#c8964f", dark: "#8a5a2b" },
  { id: "vi-5", light: "#7fbf6a", base: "#2f6b3a", dark: "#1c4022" },
];

export function VegIcon({ name }: { name: string }) {
  const c = vegColors[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % vegColors.length];
  return (
    <svg aria-hidden viewBox="0 0 40 44" className="size-11">
      <defs>
        <radialGradient id={c.id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="60%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.dark} />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="40" rx="11" ry="2.5" fill="#000000" opacity="0.15" />
      <ellipse cx="20" cy="25" rx="11" ry="12" fill={`url(#${c.id})`} />
      <ellipse cx="16" cy="20" rx="3" ry="2" fill="#ffffff" opacity="0.55" />
      <path d="M20 13c-1-4 1-7 5-8M20 13c-2-3-5-4-8-3" fill="none" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
