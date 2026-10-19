// ホームの絵（第2版 4-1）
// - FarmBanner：ホームの一番上の横長の絵。横から見た農園で、トラックが農家さんの畑とお店の間を行き来する
// - FarmBackdrop：画面全体のうすい背景（斜め上から見下ろした広い農園の1枚の絵）

// トラックの絵（横から見た形。右向き。x=0 が真ん中、y=0 が地面）
// 丸みのある形にし、上を明るく・下を少し暗くして、立体的に見せる
// cargoDur を渡すと、行き（前半）は野菜を積み、お店で降ろして、帰り（後半）は荷台を空にする
function Truck({ cargoDur }: { cargoDur?: string }) {
  return (
    <g>
      {/* 地面のふんわりした影 */}
      <ellipse cx="-4" cy="2" rx="48" ry="5" fill="#5b4a2a" opacity="0.15" />
      {/* 荷台 */}
      <rect x="-48" y="-32" width="58" height="22" rx="7" fill="url(#fb-white)" />
      {/* 積んだ野菜のかごと、野菜（てかりつき） */}
      <g>
        {cargoDur && <animate attributeName="opacity" values="1; 0" keyTimes="0; 0.46" calcMode="discrete" dur={cargoDur} repeatCount="indefinite" />}
        <rect x="-43" y="-43" width="21" height="13" rx="4" fill="url(#fb-basket)" />
        <rect x="-19" y="-43" width="21" height="13" rx="4" fill="url(#fb-basket)" />
        {(
          [
            [-37, -40, "cabbage"],
            [-27, -40, "tomato"],
            [-13, -40, "eggplant"],
            [-4, -40, "carrot"],
          ] as [number, number, Veg][]
        ).map(([x, y, kind]) => (
          <g key={kind} transform={`translate(${x} ${y}) scale(0.8)`}>
            <Vegetable kind={kind} />
          </g>
        ))}
      </g>
      {/* 運転席（丸い屋根・窓） */}
      <path d="M8 -10 V-30 Q8 -38 16 -38 H25 Q29 -38 32 -34 L40 -23 Q42 -20 42 -16 V-10 Z" fill="url(#fb-white)" />
      <path d="M13 -33 Q13 -34 15 -34 H24 Q26 -34 28 -32 L34 -24 H13 Z" fill="url(#fb-glass)" />
      {/* 車体の下の、やさしい緑の帯 */}
      <rect x="-50" y="-13" width="92" height="8" rx="4" fill="url(#fb-leafbar)" />
      {/* タイヤ（くるくる回る） */}
      {[-31, 25].map((x) => (
        <g key={x} transform={`translate(${x} -5)`}>
          <circle r="8.5" fill="#4a4a4a" />
          <circle r="4" fill="#e6e6e6" />
          <g>
            <rect x="-1" y="-7.5" width="2" height="4" rx="1" fill="#9a9a9a" />
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.6s" repeatCount="indefinite" />
          </g>
        </g>
      ))}
    </g>
  );
}

// 横から見た野菜（x=0 が真ん中、y=0 が根もと・かごの底）。形の特徴で、何の野菜か分かるようにする
export type Veg = "cabbage" | "tomato" | "eggplant" | "carrot";
export function Vegetable({ kind }: { kind: Veg }) {
  if (kind === "cabbage") {
    // キャベツ：外側の濃い葉に包まれた、うすい緑の丸い玉（葉のすじつき）
    return (
      <g>
        <ellipse cx="0" cy="-6" rx="9" ry="6" fill="#6fae5c" />
        <circle cx="0" cy="-9" r="6.5" fill="#cdeaa9" />
        <path d="M-4 -9 Q0 -14 4 -9 M0 -15 V-6" fill="none" stroke="#9fcf7f" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M-9 -6 Q-11 -12 -6 -14 M9 -6 Q11 -12 6 -14" fill="none" stroke="#5f9e4f" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "tomato") {
    // トマト：赤い丸い実と、緑の星形のへた（てかりつき）
    return (
      <g>
        <circle cx="0" cy="-6" r="6" fill="#e8574a" />
        <path d="M0 -12 l2 -2 l-0.5 3 l3 -0.5 l-3 1.5 l1 2.5 l-2.5 -1.5 l-2.5 1.5 l1 -2.5 l-3 -1.5 l3 0.5 l-0.5 -3 Z" fill="#4c8a3f" />
        <circle cx="-2.2" cy="-8" r="1.6" fill="#ffffff" opacity="0.6" />
      </g>
    );
  }
  if (kind === "eggplant") {
    // なす：細長いむらさきの実と、緑のへた（てかりつき）
    return (
      <g transform="rotate(-25)">
        <ellipse cx="0" cy="-7" rx="4" ry="8" fill="#7a4aa3" />
        <path d="M-4 -14 Q0 -11 4 -14 L2 -17 H-2 Z" fill="#3f7a35" />
        <ellipse cx="-1.5" cy="-8" rx="1" ry="3" fill="#ffffff" opacity="0.45" />
      </g>
    );
  }
  // にんじん：オレンジのとがった根と、ふさふさの葉
  return (
    <g transform="rotate(-20)">
      <path d="M-3.5 -14 Q0 -15 3.5 -14 L0.6 2 Q0 3 -0.6 2 Z" fill="#f08a3c" />
      <path d="M-2 -8 h3 M-2 -4 h2.5" stroke="#c96e1c" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M0 -14 L-4 -21 M0 -14 L0 -22 M0 -14 L4 -21" stroke="#5fa35a" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

// 畑に植わった株（茎と葉の上に、野菜がなる）
function Plant({ x, kind }: { x: number; kind: Veg }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {kind === "tomato" && <path d="M0 0 V-16" stroke="#b08a5a" strokeWidth="1.5" />}
      {kind !== "cabbage" && (
        <>
          <ellipse cx="-4.5" cy="-4" rx="5" ry="2.6" fill="#7fbf6a" />
          <ellipse cx="4.5" cy="-6" rx="5" ry="2.6" fill="#6fae5c" />
        </>
      )}
      <g transform={kind === "cabbage" ? "" : "translate(0 -5)"}>
        <Vegetable kind={kind} />
      </g>
    </g>
  );
}

// 丸い木（葉は、左上が明るい玉。地面にふんわりした影）
function Tree({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="3" cy="1" rx={r * 1.1} ry={r * 0.25} fill="#5b4a2a" opacity="0.13" />
      <rect x="-3.5" y={-r * 1.4} width="7" height={r * 1.4} rx="3" fill="url(#fb-trunk)" />
      <circle cy={-r * 1.9} r={r} fill="url(#fb-tree)" />
      <circle cx={-r * 0.35} cy={-r * 2.25} r={r * 0.3} fill="#ffffff" opacity="0.25" />
    </g>
  );
}

// ホームの一番上に出す、横長の絵（バナー）。斜めにせず、横から見た農園
// 立体的に見えるよう、光の当たる側を明るく・反対側を少し暗く塗り、物の下にふんわりした影を置く。かたい線は使わない
// トラックが、左の農家さんの小屋から右のお店まで野菜を運び、お店で降ろして、向きを変えて空で戻る（くり返す）
// 動きを減らす設定（OS の「視差効果を減らす」など）の人には、止まったトラックを出す
export function FarmBanner({ message = "地元の野菜を、必要な量で。" }: { message?: string }) {
  // 1回の行き来の時間（秒）と、トラックの止まる位置（左：小屋の前、右：お店の前）
  const dur = "14s";
  // 文字の見た目（やさしい緑の丸ゴシック。白いふちで、絵の上でも読みやすくする）
  const textProps = {
    x: 400,
    y: 118,
    textAnchor: "middle" as const,
    fontSize: 30,
    fontWeight: 700,
    fill: "#3b7d4a",
    stroke: "#ffffff",
    strokeWidth: 6,
    strokeLinejoin: "round" as const,
    paintOrder: "stroke",
    style: { fontFamily: "var(--font-zen-maru), sans-serif" },
  };
  const left = 210;
  const right = 610;
  return (
    <div className="card overflow-hidden">
      <svg aria-hidden viewBox="0 0 800 230" className="h-auto w-full">
        <defs>
          <linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfe9f6" />
            <stop offset="100%" stopColor="#fbf7ec" />
          </linearGradient>
          <radialGradient id="fb-sun">
            <stop offset="0%" stopColor="#fff6c9" />
            <stop offset="55%" stopColor="#fff1b0" />
            <stop offset="100%" stopColor="#fff1b0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fb-hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9efc6" />
            <stop offset="100%" stopColor="#c3e3a8" />
          </linearGradient>
          <linearGradient id="fb-hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c6e6aa" />
            <stop offset="100%" stopColor="#a9d68c" />
          </linearGradient>
          <linearGradient id="fb-soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d2a777" />
            <stop offset="100%" stopColor="#a87c50" />
          </linearGradient>
          <linearGradient id="fb-wall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff8ec" />
            <stop offset="100%" stopColor="#ecd9bc" />
          </linearGradient>
          <linearGradient id="fb-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f08a72" />
            <stop offset="100%" stopColor="#d65f48" />
          </linearGradient>
          <linearGradient id="fb-shopwall" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#f0e4cf" />
          </linearGradient>
          <linearGradient id="fb-white" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e9e3d6" />
          </linearGradient>
          <linearGradient id="fb-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e3f4fb" />
            <stop offset="100%" stopColor="#a9d5ea" />
          </linearGradient>
          <linearGradient id="fb-basket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2b77a" />
            <stop offset="100%" stopColor="#b98a52" />
          </linearGradient>
          <linearGradient id="fb-leafbar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7fbf8a" />
            <stop offset="100%" stopColor="#4f9a5c" />
          </linearGradient>
          <linearGradient id="fb-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7ead0" />
            <stop offset="100%" stopColor="#ecd8b2" />
          </linearGradient>
          <linearGradient id="fb-trunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a8794a" />
            <stop offset="100%" stopColor="#7d5630" />
          </linearGradient>
          <radialGradient id="fb-tree" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#b6e09f" />
            <stop offset="65%" stopColor="#7dbb67" />
            <stop offset="100%" stopColor="#5a9a4b" />
          </radialGradient>
          <radialGradient id="fb-cloud" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef6fb" />
          </radialGradient>
        </defs>

        {/* 空・太陽（ふんわり光る）・雲（下に、うすい影） */}
        <rect width="800" height="230" fill="url(#fb-sky)" />
        <circle cx="690" cy="52" r="46" fill="url(#fb-sun)" />
        <circle cx="690" cy="52" r="20" fill="#fff6c9" />
        {[
          [140, 46, 1],
          [455, 34, 0.75],
        ].map(([x, y, k]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${k})`}>
            <ellipse cx="2" cy="16" rx="40" ry="6" fill="#9cc3d8" opacity="0.18" />
            <circle cx="-20" cy="2" r="15" fill="url(#fb-cloud)" />
            <circle cx="0" cy="-6" r="20" fill="url(#fb-cloud)" />
            <circle cx="22" cy="2" r="14" fill="url(#fb-cloud)" />
            <rect x="-34" y="0" width="70" height="15" rx="7.5" fill="url(#fb-cloud)" />
          </g>
        ))}

        {/* 丘（2重。手前ほどこい緑） */}
        <path d="M0 150 C 120 108 240 120 360 140 S 600 104 800 136 V230 H0 Z" fill="url(#fb-hill1)" />
        <path d="M0 166 C 160 142 320 152 480 161 S 700 142 800 156 V230 H0 Z" fill="url(#fb-hill2)" />

        {/* 左：農家さんの畑（丸い盛り土の列ごとに、なす・トマト・キャベツが並ぶ） */}
        {(["eggplant", "tomato", "cabbage"] as Veg[]).map((kind, row) => (
          <g key={kind} transform={`translate(0 ${148 + row * 11})`}>
            <rect x="8" y="-4" width="150" height="8" rx="4" fill="url(#fb-soil)" />
            {[20, 42, 64, 86, 108, 130, 150].map((x) => (
              <Plant key={x} x={x + row * 6} kind={kind} />
            ))}
          </g>
        ))}

        {/* 農家さんの小屋（光の当たる左が明るい壁・丸みのある屋根・影） */}
        <g transform="translate(150 182)">
          <ellipse cx="34" cy="2" rx="44" ry="6" fill="#5b4a2a" opacity="0.13" />
          <rect x="0" y="-50" width="64" height="50" rx="4" fill="url(#fb-wall)" />
          <path d="M-9 -46 Q-10 -50 -6 -53 L28 -78 Q32 -81 36 -78 L70 -53 Q74 -50 73 -46 Z" fill="url(#fb-roof)" />
          <rect x="23" y="-28" width="19" height="28" rx="3" fill="#a77b4f" />
          <circle cx="38" cy="-14" r="1.6" fill="#f4dfb8" />
          <rect x="6" y="-38" width="12" height="11" rx="2" fill="url(#fb-glass)" />
        </g>
        <Tree x={244} y={182} r={17} />

        {/* 右：お店（しま模様のひさし・窓・戸・影） */}
        <g transform="translate(640 182)">
          <ellipse cx="56" cy="2" rx="66" ry="7" fill="#5b4a2a" opacity="0.13" />
          <rect x="0" y="-64" width="112" height="64" rx="5" fill="url(#fb-shopwall)" />
          <rect x="-5" y="-71" width="122" height="10" rx="5" fill="url(#fb-leafbar)" />
          {/* ひさし：下が丸く波打つ、緑と白のしま */}
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <path key={k} d={`M${k * 16} -61 h16 v10 q-8 7 -16 0 Z`} fill={k % 2 === 0 ? "#6fb07a" : "#ffffff"} />
          ))}
          <rect x="10" y="-40" width="42" height="24" rx="4" fill="url(#fb-glass)" />
          <rect x="68" y="-40" width="27" height="40" rx="4" fill="#a77b4f" />
          <circle cx="90" cy="-20" r="1.6" fill="#f4dfb8" />
        </g>
        <Tree x={776} y={182} r={14} />

        {/* 道（やさしい砂色。白い点線は丸く） */}
        <rect y="188" width="800" height="26" fill="url(#fb-road)" />
        <path d="M0 201 H800" stroke="#ffffff" strokeWidth="3" strokeDasharray="14 12" strokeLinecap="round" opacity="0.9" />
        <rect y="214" width="800" height="16" fill="#a9d68c" />

        {/* 文字：トラックが通ったところから現れ、帰りはトラックが通ったところから消える
            （文字を、トラックの位置までの幅で切り取って見せる。切り取る幅を、トラックと同じ動きで変える） */}
        <clipPath id="fb-reveal">
          {/* 文字が、小屋の前では全部かくれ、お店の前では全部見えるよう、少し広めに動かす */}
          <rect x="0" y="0" height="230" width={left - 40}>
            <animate
              attributeName="width"
              values={`${left - 40}; ${right + 40}; ${right + 40}; ${left - 40}; ${left - 40}`}
              keyTimes="0; 0.42; 0.5; 0.92; 1"
              dur={dur}
              repeatCount="indefinite"
            />
          </rect>
        </clipPath>
        <g className="motion-reduce:hidden" clipPath="url(#fb-reveal)">
          <text {...textProps}>{message}</text>
        </g>
        {/* 動きを減らす設定の人には、文字をはじめから全部見せる */}
        <text {...textProps} className="hidden motion-reduce:inline">
          {message}
        </text>

        {/* 動くトラック：野菜を積んで右へ走る → お店の前で止まって降ろす → 向きを変えて、空で左へ戻る → 小屋の前で止まって積む */}
        <g className="motion-reduce:hidden">
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`${left} 206; ${right} 206; ${right} 206; ${left} 206; ${left} 206`}
              keyTimes="0; 0.42; 0.5; 0.92; 1"
              dur={dur}
              repeatCount="indefinite"
            />
            <g>
              {/* 行きは右向き、帰りは左向き（向きを、ぱっと切り替える）。帰りは野菜を降ろして空になる */}
              <animateTransform attributeName="transform" type="scale" values="1 1; -1 1" keyTimes="0; 0.46" calcMode="discrete" dur={dur} repeatCount="indefinite" />
              <Truck cargoDur={dur} />
            </g>
          </g>
        </g>
        {/* 動きを減らす設定の人には、小屋の前に止まったトラックを出す */}
        <g className="hidden motion-reduce:inline" transform={`translate(${left} 206)`}>
          <Truck />
        </g>
      </svg>
    </div>
  );
}

// 画面全体の背景（第2版 4-1）。1つの広い農園（public/images/farm-scene.svg）
// いろいろな野菜の畑・小屋・ビニールハウス・道とトラック・木を、斜め上から見下ろした1枚の絵（空と山はなし）
// 縦横の比率はそのままで画面いっぱいに広げ、真ん中を合わせる（はみ出した端は切れる）
// 文字が読みにくくならないよう、うすくする。押せないようにする
export function FarmBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-[0.25]"
      style={{ backgroundImage: "url(/images/farm-scene.svg)" }}
    />
  );
}
