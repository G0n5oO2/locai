// 飲食店のホームの特集に使うイラスト（写真の準備ができたら差し替える）
// ホームの上の絵と同じ、やわらかく・やさしい絵にする：丸みのある形・明るいパステル・てかり・やさしい陰・ふんわりした影
// かたい線は使わない。同じ絵が1つの画面に何回出ても同じ見た目なので、グラデーションの名前（id）は固定にしている

// ===== 野菜（x=0 が真ん中、y=0 が下の地面。だいたい 40×44 の大きさ） =====

export type SoftVegKind =
  | "eggplant"
  | "tomato"
  | "carrot"
  | "cabbage"
  | "greens"
  | "pepper"
  | "potato"
  | "sweetpotato"
  | "radish"
  | "pumpkin"
  | "takenoko"
  | "beans"
  | "onion"
  | "burdock";

// 下に置く、ふんわりした影
function Shadow({ w = 15 }: { w?: number }) {
  return <ellipse cx="0" cy="1" rx={w} ry="3.5" fill="#6b5a3a" opacity="0.13" />;
}
// 白いてかり
function Shine({ x, y, rx = 3, ry = 2, r = 0 }: { x: number; y: number; rx?: number; ry?: number; r?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${r} ${x} ${y})`} fill="#ffffff" opacity="0.55" />;
}

export function SoftVeg({ kind }: { kind: SoftVegKind }) {
  switch (kind) {
    case "eggplant": // なす：ふっくらしたむらさきの実と、緑のへた
      return (
        <g>
          <Shadow w={13} />
          <g transform="rotate(-18)">
            <path d="M0 -30 C 11 -30 13 -14 11 -6 C 9 2 -9 2 -11 -6 C -13 -14 -9 -24 0 -30 Z" fill="#9a72c4" />
            <path d="M8 -20 C 12 -12 10 -4 4 -1 C 10 -6 10 -14 8 -20 Z" fill="#6d4a96" opacity="0.5" />
            <path d="M-6 -30 Q0 -24 6 -30 Q4 -36 0 -36 Q-4 -36 -6 -30 Z" fill="#7dbb72" />
            <rect x="-1.5" y="-41" width="3" height="7" rx="1.5" fill="#6aa65f" />
            <Shine x={-5} y={-18} rx={2.5} ry={6} r={-10} />
          </g>
        </g>
      );
    case "tomato": // トマト：まるい赤い実と、星形のへた
      return (
        <g>
          <Shadow w={14} />
          <circle cx="0" cy="-14" r="14" fill="#f07a68" />
          <path d="M10 -6 A14 14 0 0 1 -8 -2 A14 14 0 0 0 10 -6 Z" fill="#d95e4e" opacity="0.5" />
          <path d="M0 -27 l3 -3 l-0.6 4 l4.2 -0.6 l-4 2 l1.6 3.6 l-3.2 -2.2 l-3.2 2.2 l1.6 -3.6 l-4 -2 l4.2 0.6 l-0.6 -4 Z" fill="#7dbb72" />
          <Shine x={-6} y={-19} rx={4} ry={2.6} r={-30} />
        </g>
      );
    case "carrot": // にんじん：まるみのあるオレンジの根と、ふさふさの葉
      return (
        <g>
          <Shadow w={9} />
          <g transform="rotate(-15)">
            <path d="M-7 -26 Q0 -29 7 -26 Q5 -10 1 0 Q0 1.5 -1 0 Q-5 -10 -7 -26 Z" fill="#f6a057" />
            <path d="M-3 -18 h4 M-2 -11 h3" stroke="#e08440" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M0 -27 Q-8 -34 -9 -40 M0 -27 Q0 -36 0 -42 M0 -27 Q8 -34 9 -40" fill="none" stroke="#7dbb72" strokeWidth="3" strokeLinecap="round" />
            <Shine x={-3.5} y={-21} rx={1.5} ry={4} />
          </g>
        </g>
      );
    case "cabbage": // キャベツ：外側の葉に包まれた、まるい玉
      return (
        <g>
          <Shadow w={16} />
          <ellipse cx="0" cy="-10" rx="17" ry="11" fill="#8cc97a" />
          <circle cx="0" cy="-15" r="12" fill="#d6efb8" />
          <path d="M-6 -15 Q0 -22 6 -15 M0 -26 V-8" fill="none" stroke="#b5dd94" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-17 -10 Q-19 -20 -11 -24 M17 -10 Q19 -20 11 -24" fill="none" stroke="#79b868" strokeWidth="2.4" strokeLinecap="round" />
          <Shine x={-5} y={-20} rx={3.5} ry={2.2} r={-25} />
        </g>
      );
    case "greens": // ねぎ・葉もの：白い根もとと、すっとのびた緑の葉
      return (
        <g>
          <Shadow w={11} />
          <rect x="-7" y="-14" width="14" height="14" rx="5" fill="#f6f2e4" />
          {[-6, -2, 2, 6].map((x, k) => (
            <path key={x} d={`M${x * 0.6} -12 Q${x} -26 ${x * 1.6} ${-38 + (k % 2) * 4}`} fill="none" stroke={k % 2 ? "#7dbb72" : "#94cc84"} strokeWidth="4.5" strokeLinecap="round" />
          ))}
          <Shine x={-3} y={-8} rx={1.5} ry={4} />
        </g>
      );
    case "pepper": // とうがらし・ししとう・きゅうりなど：細長い緑の実
      return (
        <g>
          <Shadow w={12} />
          <g transform="rotate(-25)">
            <path d="M-4 -34 Q4 -36 5 -28 Q6 -12 2 -2 Q0 2 -2 -2 Q-6 -14 -6 -28 Q-6 -33 -4 -34 Z" fill="#8cc97a" />
            <path d="M3 -26 Q4 -12 1 -3 Q4 -12 3 -26 Z" fill="#5f9e55" opacity="0.6" />
            <path d="M-5 -34 Q0 -31 4 -35 L2 -40 H-2 Z" fill="#5f9e55" />
            <Shine x={-3} y={-24} rx={1.3} ry={6} />
          </g>
        </g>
      );
    case "potato": // いも（里芋など）：まるい茶色の実と、小さな芽の点
      return (
        <g>
          <Shadow w={15} />
          <ellipse cx="0" cy="-12" rx="15" ry="12" fill="#c9a07a" />
          <path d="M-12 -6 Q0 2 12 -6 Q0 -1 -12 -6 Z" fill="#a8805a" opacity="0.5" />
          {[[-5, -14], [4, -9], [6, -17]].map(([x, y]) => (
            <circle key={`${x}`} cx={x} cy={y} r="1.3" fill="#a8805a" />
          ))}
          <Shine x={-6} y={-17} rx={3.5} ry={2.2} r={-20} />
        </g>
      );
    case "sweetpotato": // さつまいも：むらさきがかった赤の、細長い実
      return (
        <g>
          <Shadow w={16} />
          <g transform="rotate(-10)">
            <path d="M-17 -10 Q-12 -22 2 -20 Q16 -18 17 -10 Q14 -2 0 -2 Q-14 -2 -17 -10 Z" fill="#c76a8c" />
            <path d="M-12 -5 Q0 0 13 -6 Q0 -3 -12 -5 Z" fill="#a14e6e" opacity="0.5" />
            <Shine x={-6} y={-15} rx={5} ry={2} r={-8} />
          </g>
        </g>
      );
    case "radish": // かぶ・大根：白くまるい根と、緑の葉
      return (
        <g>
          <Shadow w={13} />
          <path d="M-12 -14 Q-12 -2 0 0 Q12 -2 12 -14 Q12 -24 0 -24 Q-12 -24 -12 -14 Z" fill="#fbf8f0" />
          <path d="M6 -18 Q10 -8 2 -2 Q8 -9 6 -18 Z" fill="#e4dccb" />
          <path d="M0 0 V5" stroke="#e4dccb" strokeWidth="2" strokeLinecap="round" />
          <path d="M-2 -23 Q-10 -34 -12 -40 M0 -24 Q0 -36 1 -42 M2 -23 Q10 -33 12 -38" fill="none" stroke="#7dbb72" strokeWidth="4" strokeLinecap="round" />
          <Shine x={-5} y={-16} rx={2.2} ry={4} />
        </g>
      );
    case "pumpkin": // かぼちゃ：すじの入った、まるいだいだい色の実
      return (
        <g>
          <Shadow w={17} />
          <ellipse cx="-8" cy="-12" rx="9" ry="11" fill="#f2a24e" />
          <ellipse cx="8" cy="-12" rx="9" ry="11" fill="#f2a24e" />
          <ellipse cx="0" cy="-12" rx="9" ry="12" fill="#f7b462" />
          <path d="M0 -24 Q-2 -30 3 -32" fill="none" stroke="#8a6a3a" strokeWidth="3" strokeLinecap="round" />
          <Shine x={-3} y={-18} rx={2.2} ry={4} />
        </g>
      );
    case "takenoko": // たけのこ：先のとがった、うすい茶色の皮
      return (
        <g>
          <Shadow w={12} />
          <path d="M-12 -2 Q-12 -20 0 -36 Q12 -20 12 -2 Z" fill="#d9b48a" />
          <path d="M-12 -2 Q-4 -14 2 -30 Q-2 -12 -2 -2 Z" fill="#c49a6c" />
          <path d="M12 -2 Q4 -12 4 -22 Q8 -10 12 -2 Z" fill="#c49a6c" />
          <path d="M0 -36 Q2 -40 4 -41" stroke="#8cc97a" strokeWidth="2.5" strokeLinecap="round" />
          <Shine x={-5} y={-12} rx={1.6} ry={5} />
        </g>
      );
    case "beans": // 豆：ふっくらしたさやと、まるい豆
      return (
        <g>
          <Shadow w={16} />
          <g transform="rotate(-12)">
            <path d="M-17 -10 Q-15 -20 0 -18 Q15 -16 17 -8 Q12 -2 0 -4 Q-14 -4 -17 -10 Z" fill="#9fd48a" />
            {[-9, 0, 9].map((x) => (
              <circle key={x} cx={x} cy="-11" r="4.2" fill="#c6eba8" />
            ))}
            <path d="M17 -8 Q20 -10 21 -14" fill="none" stroke="#7dbb72" strokeWidth="2.5" strokeLinecap="round" />
            <Shine x={-8} y={-15} rx={4} ry={1.6} r={-6} />
          </g>
        </g>
      );
    case "onion": // 玉ねぎ：うすい茶色の、しずく形の玉
      return (
        <g>
          <Shadow w={14} />
          <path d="M0 -32 Q4 -26 12 -18 Q16 -8 8 -2 Q0 1 -8 -2 Q-16 -8 -12 -18 Q-4 -26 0 -32 Z" fill="#f3d39c" />
          <path d="M-6 -22 Q-8 -10 -4 -2 M6 -22 Q8 -10 4 -2" fill="none" stroke="#e2b877" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M0 0 V4" stroke="#d9c39a" strokeWidth="2" strokeLinecap="round" />
          <Shine x={-6} y={-14} rx={2} ry={4.5} />
        </g>
      );
    case "burdock": // ごぼう：細長い茶色の根
      return (
        <g>
          <Shadow w={16} />
          <g transform="rotate(-30)">
            <rect x="-3.5" y="-40" width="7" height="40" rx="3.5" fill="#a8805a" />
            <path d="M-2 -32 h4 M-2 -22 h4 M-2 -12 h4" stroke="#8a6644" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M0 -40 Q-6 -46 -8 -50 M0 -40 Q4 -47 7 -50" fill="none" stroke="#7dbb72" strokeWidth="2.6" strokeLinecap="round" />
            <Shine x={-1.5} y={-26} rx={0.9} ry={7} />
          </g>
        </g>
      );
  }
}

// 野菜の名前から、絵の種類を決める（名前にふくまれる言葉で見分ける）
export function vegKindOf(name: string): SoftVegKind {
  const rules: [RegExp, SoftVegKind][] = [
    [/茄子|なす/, "eggplant"],
    [/トマト/, "tomato"],
    [/にんじん|人参/, "carrot"],
    [/キャベツ|白菜/, "cabbage"],
    [/玉ねぎ|たまねぎ/, "onion"],
    [/ねぎ|菜|水菜|ほうれん|小松/, "greens"],
    [/唐辛子|甘長|ししとう|ピーマン|オクラ|きゅうり|ズッキーニ/, "pepper"],
    [/さつまいも/, "sweetpotato"],
    [/芋|いも/, "potato"],
    [/かぶ|大根/, "radish"],
    [/かぼちゃ/, "pumpkin"],
    [/たけのこ/, "takenoko"],
    [/豆/, "beans"],
    [/ごぼう/, "burdock"],
  ];
  return rules.find(([re]) => re.test(name))?.[1] ?? "cabbage";
}

// 季節の野菜の画面などで使う、小さな野菜の絵（名前に合った形で描く）
export function VegIcon({ name }: { name: string }) {
  return (
    <svg aria-hidden viewBox="-24 -46 48 52" className="size-12">
      <SoftVeg kind={vegKindOf(name)} />
    </svg>
  );
}

// ===== 特集の大きな絵 =====

// 季節の野菜：まるいかごいっぱいの野菜
export function SeasonalArt() {
  return (
    <svg aria-hidden viewBox="0 -6 170 116" className="h-32 w-auto">
      <defs>
        <linearGradient id="sa-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecc68e" />
          <stop offset="100%" stopColor="#c99a62" />
        </linearGradient>
      </defs>
      {/* かごの影 */}
      <ellipse cx="85" cy="102" rx="62" ry="6" fill="#6b5a3a" opacity="0.13" />
      {/* かごの後ろから顔を出す野菜（奥から手前の順） */}
      <g transform="translate(50 52) scale(1.3)">
        <SoftVeg kind="greens" />
      </g>
      <g transform="translate(90 46) scale(1.25)">
        <SoftVeg kind="carrot" />
      </g>
      <g transform="translate(122 54) scale(1.25)">
        <SoftVeg kind="eggplant" />
      </g>
      <g transform="translate(68 60) scale(1.3)">
        <SoftVeg kind="cabbage" />
      </g>
      <g transform="translate(106 60) scale(1.25)">
        <SoftVeg kind="tomato" />
      </g>
      {/* まるいかご（ふちは明るく、編み目はやさしい線） */}
      <path d="M26 60 H144 Q142 96 120 98 H50 Q28 96 26 60 Z" fill="url(#sa-basket)" />
      <path d="M32 74 Q85 80 138 74 M38 86 Q85 92 132 86" fill="none" stroke="#b8864e" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
      <rect x="20" y="54" width="130" height="12" rx="6" fill="#f3d7a6" />
      <path d="M30 57 H90" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// 規格外の野菜：形がふぞろいでも、元気な野菜たち（曲がったきゅうり・二股のにんじん・ふぞろいなトマト）
export function IrregularArt() {
  return (
    <svg aria-hidden viewBox="0 0 170 110" className="h-32 w-auto">
      {/* 影 */}
      <ellipse cx="85" cy="100" rx="68" ry="6" fill="#6b5a3a" opacity="0.13" />
      {/* 曲がったきゅうり（丸い線を重ねて、ふっくら見せる） */}
      <path d="M24 92 C 30 52 58 40 74 50" fill="none" stroke="#7dbb72" strokeWidth="16" strokeLinecap="round" />
      <path d="M28 84 C 34 56 56 46 68 50" fill="none" stroke="#a6d896" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
      {[[40, 66], [50, 56], [62, 50]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.6" fill="#5f9e55" />
      ))}
      {/* 二股のにんじん */}
      <path d="M86 30 Q95 28 104 30 Q102 50 98 60 Q104 74 104 92 Q99 95 96 92 Q95 80 95 70 Q92 80 90 92 Q86 95 82 92 Q83 74 90 60 Q86 50 86 30 Z" fill="#f6a057" />
      <path d="M90 40 h8 M90 50 h7" stroke="#e08440" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M95 29 Q88 20 86 12 M95 29 Q95 18 96 10 M95 29 Q102 20 106 14" fill="none" stroke="#7dbb72" strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="90" cy="44" rx="1.6" ry="6" fill="#ffffff" opacity="0.5" />
      {/* ふぞろいなトマト（てかり付き） */}
      <path d="M122 60 C 134 50 156 56 154 74 C 152 92 132 98 122 90 C 112 82 112 68 122 60 Z" fill="#f07a68" />
      <path d="M150 80 C 146 92 132 96 124 92 C 136 92 146 86 150 80 Z" fill="#d95e4e" opacity="0.5" />
      <path d="M136 56 l3 -3 l-0.6 4 l4.2 -0.6 l-4 2 l1.6 3.6 l-3.2 -2.2 l-3.2 2.2 l1.6 -3.6 l-4 -2 l4.2 0.6 l-0.6 -4 Z" fill="#7dbb72" />
      <ellipse cx="128" cy="68" rx="5" ry="3" transform="rotate(-30 128 68)" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
