// ホームの背景の農園の絵（第2版 4-1：アイソメトリック＝斜め上から見下ろした立体的な絵）
// 野菜畑・農家さんの小屋・飲食店・その間の小道と軽トラで、「農家さんとお店がつながる」世界を描く
// 座標は、角度をそろえるために計算で出したもの（手で直すときは、まとめて作り直す）
// 同じ絵が1つの画面に2回出ても同じ見た目なので、グラデーションの名前（id）は固定にしている

export function FarmMap({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="170 60 560 385" className={className}>
      <defs>
      <linearGradient id="fm-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cfe8b4" />
      <stop offset="100%" stopColor="#a9d18a" />
      </linearGradient>
      <radialGradient id="fm-tree" cx="35%" cy="30%" r="75%"><stop offset="0%" stopColor="#9fd48a" />
      <stop offset="70%" stopColor="#5f9e4f" />
      <stop offset="100%" stopColor="#3f7536" />
      </radialGradient>
      </defs>
      <polygon points="190.4,254.2 495.3,430.2 495.3,417.0 190.4,241.0" fill="#8fb86f" />
      <polygon points="704.8,309.2 495.3,430.2 495.3,417.0 704.8,296.0" fill="#7aa45d" />
      <polygon points="400.0,120.0 704.8,296.0 495.3,417.0 190.4,241.0" fill="url(#fm-grass)" />
      <polygon points="373.3,205.8 556.2,311.4 537.2,322.4 354.3,216.8" fill="#f3e3c3" />
      <polygon points="537.2,300.4 556.2,311.4 480.0,355.4 461.0,344.4" fill="#f3e3c3" />
      <polygon points="228.5,241.0 304.7,285.0 304.7,279.5 228.5,235.5" fill="#9a6f45" />
      <polygon points="371.4,246.5 304.7,285.0 304.7,279.5 371.4,241.0" fill="#8a613b" />
      <polygon points="295.2,197.0 371.4,241.0 304.7,279.5 228.5,235.5" fill="#b98a5a" />
      <ellipse cx="294.3" cy="203.0" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="294.3" cy="198.7" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="307.6" cy="210.8" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="307.6" cy="206.4" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="320.9" cy="218.4" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="320.9" cy="214.1" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="334.3" cy="226.2" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="334.3" cy="221.8" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="347.6" cy="233.8" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="347.6" cy="229.5" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="279.0" cy="211.8" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="279.0" cy="207.5" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="292.4" cy="219.5" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="292.4" cy="215.2" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="305.7" cy="227.2" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="305.7" cy="222.9" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="319.0" cy="234.9" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="319.0" cy="230.6" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="332.4" cy="242.7" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="332.4" cy="238.2" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="263.8" cy="220.6" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="263.8" cy="216.2" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="277.1" cy="228.3" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="277.1" cy="223.9" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="290.4" cy="236.0" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="290.4" cy="231.6" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="303.8" cy="243.7" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="303.8" cy="239.3" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="317.1" cy="251.5" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="317.1" cy="247.1" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="248.5" cy="229.4" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="248.5" cy="225.1" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="261.9" cy="237.2" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="261.9" cy="232.8" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="275.2" cy="244.8" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="275.2" cy="240.4" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="288.5" cy="252.5" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="288.5" cy="248.2" rx="5.5" ry="4" fill="#7fb069" />
      <ellipse cx="301.9" cy="260.2" rx="6.5" ry="4.5" fill="#4c7a3a" />
      <ellipse cx="301.9" cy="255.9" rx="5.5" ry="4" fill="#7fb069" />
      <polygon points="316.2,291.6 384.8,331.2 384.8,325.7 316.2,286.1" fill="#9a6f45" />
      <polygon points="451.4,292.7 384.8,331.2 384.8,325.7 451.4,287.2" fill="#8a613b" />
      <polygon points="382.9,247.6 451.4,287.2 384.8,325.7 316.2,286.1" fill="#b98a5a" />
      <ellipse cx="381.9" cy="253.7" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="381.9" cy="249.2" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="395.2" cy="261.4" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="395.2" cy="256.9" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="408.6" cy="269.1" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="408.6" cy="264.7" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="421.9" cy="276.8" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="421.9" cy="272.4" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="435.2" cy="284.5" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="435.2" cy="280.1" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="366.7" cy="262.5" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="366.7" cy="258.1" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="380.0" cy="270.2" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="380.0" cy="265.8" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="393.3" cy="277.9" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="393.3" cy="273.4" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="406.7" cy="285.6" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="406.7" cy="281.2" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="420.0" cy="293.2" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="420.0" cy="288.8" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="351.4" cy="271.2" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="351.4" cy="266.8" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="364.8" cy="279.0" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="364.8" cy="274.6" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="378.1" cy="286.7" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="378.1" cy="282.2" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="391.4" cy="294.4" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="391.4" cy="289.9" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="404.8" cy="302.1" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="404.8" cy="297.6" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="336.2" cy="280.1" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="336.2" cy="275.7" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="349.5" cy="287.8" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="349.5" cy="283.4" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="362.8" cy="295.5" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="362.8" cy="291.1" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="376.2" cy="303.2" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="376.2" cy="298.8" rx="5.5" ry="4" fill="#8e5bb5" />
      <ellipse cx="389.5" cy="310.9" rx="6.5" ry="4.5" fill="#5d3a7a" />
      <ellipse cx="389.5" cy="306.4" rx="5.5" ry="4" fill="#8e5bb5" />
      <polygon points="342.8,175.0 411.4,214.6 411.4,209.1 342.8,169.5" fill="#9a6f45" />
      <polygon points="468.6,181.6 411.4,214.6 411.4,209.1 468.6,176.1" fill="#8a613b" />
      <polygon points="400.0,136.5 468.6,176.1 411.4,209.1 342.8,169.5" fill="#b98a5a" />
      <ellipse cx="399.0" cy="142.5" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="399.0" cy="138.2" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="412.4" cy="150.2" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="412.4" cy="145.9" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="425.7" cy="157.9" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="425.7" cy="153.6" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="439.1" cy="165.7" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="439.1" cy="161.2" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="452.4" cy="173.3" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="452.4" cy="169.0" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="383.8" cy="151.3" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="383.8" cy="147.0" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="397.1" cy="159.0" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="397.1" cy="154.7" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="410.5" cy="166.7" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="410.5" cy="162.4" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="423.8" cy="174.4" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="423.8" cy="170.1" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="437.2" cy="182.2" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="437.2" cy="177.8" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="368.6" cy="160.2" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="368.6" cy="155.8" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="381.9" cy="167.8" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="381.9" cy="163.5" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="395.2" cy="175.5" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="395.2" cy="171.2" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="408.6" cy="183.2" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="408.6" cy="178.9" rx="5.5" ry="4" fill="#f08a3c" />
      <ellipse cx="421.9" cy="190.9" rx="6.5" ry="4.5" fill="#b25f1f" />
      <ellipse cx="421.9" cy="186.6" rx="5.5" ry="4" fill="#f08a3c" />
      <polygon points="434.3,219.0 483.8,247.6 483.8,212.4 434.3,183.8" fill="#e9d2b0" />
      <polygon points="529.6,221.2 483.8,247.6 483.8,212.4 529.6,186.0" fill="#d8bd96" />
      <polygon points="480.0,157.4 529.6,186.0 483.8,212.4 434.3,183.8" fill="#f6ead6" />
      <polygon points="426.7,183.8 483.8,216.8 510.5,177.2 453.3,144.2" fill="#d9573f" />
      <polygon points="537.2,186.0 483.8,216.8 510.5,177.2" fill="#b5402c" />
      <polygon points="451.4,228.9 466.7,237.7 466.7,215.7 451.4,206.9" fill="#9a6f45" />
      <polygon points="400.0,353.2 457.2,386.2 457.2,348.8 400.0,315.8" fill="#f1e4cc" />
      <polygon points="491.5,366.4 457.2,386.2 457.2,348.8 491.5,329.0" fill="#e4d2b4" />
      <polygon points="434.3,296.0 491.5,329.0 457.2,348.8 400.0,315.8" fill="#fffaf0" />
      <polygon points="400.0,315.8 457.2,348.8 457.2,343.3 400.0,310.3" fill="#2f6b3a" />
      <polygon points="491.5,329.0 457.2,348.8 457.2,343.3 491.5,323.5" fill="#285c32" />
      <polygon points="434.3,290.5 491.5,323.5 457.2,343.3 400.0,310.3" fill="#3b7d4a" />
      <polygon points="400.0,325.7 409.5,331.2 400.0,343.3 390.5,337.8" fill="#4f9a5c" />
      <polygon points="409.5,331.2 419.1,336.7 409.5,348.8 400.0,343.3" fill="#ffffff" />
      <polygon points="419.1,336.7 428.6,342.2 419.1,354.3 409.5,348.8" fill="#4f9a5c" />
      <polygon points="428.6,342.2 438.1,347.7 428.6,359.8 419.1,354.3" fill="#ffffff" />
      <polygon points="438.1,347.7 447.6,353.2 438.1,365.3 428.6,359.8" fill="#4f9a5c" />
      <polygon points="447.6,353.2 457.2,358.7 447.6,370.8 438.1,365.3" fill="#ffffff" />
      <polygon points="405.7,348.8 424.8,359.8 424.8,346.6 405.7,335.6" fill="#bfe0f0" />
      <polygon points="434.3,373.0 447.6,380.7 447.6,358.7 434.3,351.0" fill="#9a6f45" />
      <polygon points="467.6,278.9 494.3,294.4 494.3,284.5 467.6,269.1" fill="#e6dccb" />
      <polygon points="507.6,286.6 494.3,294.4 494.3,284.5 507.6,276.8" fill="#d6cab5" />
      <polygon points="481.0,261.4 507.6,276.8 494.3,284.5 467.6,269.1" fill="#f6f1e6" />
      <polygon points="484.8,288.9 494.3,294.4 494.3,277.9 484.8,272.4" fill="#e6dccb" />
      <polygon points="507.6,286.6 494.3,294.4 494.3,277.9 507.6,270.1" fill="#d6cab5" />
      <polygon points="498.1,264.6 507.6,270.1 494.3,277.9 484.8,272.4" fill="#ffffff" />
      <ellipse cx="472.4" cy="280.6" rx="3.5" ry="3.5" fill="#3a3a3a" />
      <ellipse cx="488.6" cy="289.9" rx="3.5" ry="3.5" fill="#3a3a3a" />
      <ellipse cx="481.9" cy="266.3" rx="5" ry="3.5" fill="#7fb069" />
      <ellipse cx="488.6" cy="267.9" rx="4.5" ry="3" fill="#f08a3c" />
      <ellipse cx="655.3" cy="298.2" rx="11" ry="5" fill="#000000" opacity="0.12" />
      <rect x="653.3" y="277.8" width="4" height="16" fill="#8a613b" />
      <circle cx="655.3" cy="269.8" r="13" fill="url(#fm-tree)" />
      <ellipse cx="621.0" cy="322.4" rx="11" ry="5" fill="#000000" opacity="0.12" />
      <rect x="619.0" y="302.0" width="4" height="16" fill="#8a613b" />
      <circle cx="621.0" cy="294.0" r="13" fill="url(#fm-tree)" />
      <ellipse cx="323.8" cy="181.6" rx="11" ry="5" fill="#000000" opacity="0.12" />
      <rect x="321.8" y="161.2" width="4" height="16" fill="#8a613b" />
      <circle cx="323.8" cy="153.2" r="13" fill="url(#fm-tree)" />
      <ellipse cx="563.9" cy="241.0" rx="11" ry="5" fill="#000000" opacity="0.12" />
      <rect x="561.9" y="220.6" width="4" height="16" fill="#8a613b" />
      <circle cx="563.9" cy="212.6" r="13" fill="url(#fm-tree)" />
      <ellipse cx="567.7" cy="357.6" rx="11" ry="5" fill="#000000" opacity="0.12" />
      <rect x="565.7" y="337.2" width="4" height="16" fill="#8a613b" />
      <circle cx="567.7" cy="329.2" r="13" fill="url(#fm-tree)" />
    </svg>
  );
}

// ホームの一番上に出す、横長の絵（バナー）
export function FarmBanner() {
  return (
    <div className="card overflow-hidden bg-linear-to-b from-leaf-soft to-surface">
      <FarmMap className="mx-auto h-44 w-full max-w-2xl md:h-56" />
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
