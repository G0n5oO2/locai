// 飲食店のホームの特集に使うイラスト（写真の準備ができたら差し替える）

// 季節の野菜：かごいっぱいの野菜
export function SeasonalArt() {
  return (
    <svg aria-hidden viewBox="0 0 160 90" className="h-28 w-auto">
      <ellipse cx="50" cy="38" rx="11" ry="18" transform="rotate(-25 50 38)" fill="#6b3f8f" />
      <path d="M54 22l5-7" stroke="#2f6b3a" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 52L86 16L94 20Z" fill="#e67e22" />
      <path d="M90 18l-3-8M90 18l6-6" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="40" r="12" fill="#7fb069" />
      <path d="M100 48c0-14 6-24 16-24 0 12-6 24-16 24z" fill="#2f6b3a" />
      <circle cx="114" cy="44" r="10" fill="#c0392b" />
      <path d="M114 34l2-5" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 46h112l-10 40H34z" fill="#c8964f" />
      <path d="M30 58h100M32 70h96" stroke="#8a5a2b" strokeWidth="2" />
    </svg>
  );
}

// 規格外の野菜：形がふぞろいな野菜たち
export function IrregularArt() {
  return (
    <svg aria-hidden viewBox="0 0 160 90" className="h-28 w-auto">
      {/* 曲がったきゅうり */}
      <path d="M20 70C30 30 60 24 70 34" fill="none" stroke="#3f7d3a" strokeWidth="12" strokeLinecap="round" />
      {/* 二股のにんじん */}
      <path d="M86 24L96 24L92 56L100 76L94 78L89 62L84 78L78 76L86 56Z" fill="#e67e22" />
      <path d="M91 24l-4-10M91 24l6-10" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      {/* ふぞろいなトマト */}
      <path d="M118 40c10-6 26 0 24 16s-18 22-28 14-6-24 4-30z" fill="#c0392b" />
      <path d="M128 38l2-6" stroke="#2f6b3a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="80" cy="84" rx="70" ry="4" fill="#000000" opacity="0.08" />
    </svg>
  );
}
