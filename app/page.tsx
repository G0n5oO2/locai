// 初期画面（紹介画面）
// 仕様書 4章「① 入口」：紹介文を表示し、飲食店・生産者それぞれの入口を用意する

// 立場ごとの入口。ログインの仕組みができたら、ボタンをログイン画面へのリンクにする
const entrances = [
  {
    who: "飲食店の方",
    title: "野菜を仕入れる",
    points: ["仕入れ日の前に、必要な量だけ申し込める", "送料込みの合計金額が先に分かる", "地元の農家さんのこだわりが見える"],
    tone: "leaf",
  },
  {
    who: "生産者の方",
    title: "野菜を販売する",
    points: ["値段は自分で決めて、一度にまとめて出品", "複数のお店の申し込みを一覧で確認", "どのお店に、どれだけ売るかを自分で決める"],
    tone: "earth",
  },
] as const;

// アプリの使い方の3ステップ
const steps = [
  { title: "農家さんが出品する", text: "売りたい野菜と量、値段、受け渡し方法を登録します。" },
  { title: "お店が必要な量だけ申し込む", text: "条件に合う野菜を探して、使う分だけ申し込みます。" },
  { title: "農家さんが決めて、販売確定", text: "農家さんが承認すると、量・金額・受け渡し方法が決まります。" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-3xl px-4 pt-5">
        <p className="text-lg font-bold tracking-wide text-leaf">LocAI</p>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 pt-8 pb-12">
        {/* 紹介文 */}
        <section className="flex flex-col gap-3">
          <h1 className="text-3xl leading-tight font-bold sm:text-4xl">
            地元の野菜を、
            <br />
            必要な量で。
          </h1>
          <p className="text-lg font-medium text-leaf">農家と店をつなぐ</p>
          <p className="leading-7 text-muted">
            関西の農家さんが売りたい野菜を出品し、お店は必要な量だけ申し込めます。市場に行く前に、何がどれだけ手に入るかが分かります。
          </p>
        </section>

        {/* 立場ごとの入口 */}
        <section aria-label="はじめる" className="grid gap-4 sm:grid-cols-2">
          {entrances.map((entrance) => (
            <div
              key={entrance.title}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex flex-col gap-1">
                <p
                  className={`w-fit rounded-full px-3 py-0.5 text-sm font-medium ${
                    entrance.tone === "leaf" ? "bg-leaf-soft text-leaf" : "bg-earth-soft text-earth"
                  }`}
                >
                  {entrance.who}
                </p>
                <h2 className="text-xl font-bold">{entrance.title}</h2>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm leading-6 text-muted">
                {entrance.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className={entrance.tone === "leaf" ? "text-leaf" : "text-earth"}>
                      ●
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled
                className={`rounded-xl px-4 py-3 text-base font-bold text-white opacity-60 ${
                  entrance.tone === "leaf" ? "bg-leaf" : "bg-earth"
                }`}
              >
                {entrance.title}（準備中）
              </button>
            </div>
          ))}
        </section>

        {/* 使い方 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">使い方</h2>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-2xl bg-surface p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-leaf text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="font-bold">{step.title}</p>
                  <p className="text-sm leading-6 text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm leading-6 text-muted">
            申し込みを送っただけでは、購入は決まりません。農家さんの承認で「販売確定」になります。支払いと配送の手配は、当事者どうしでアプリの外で行います。
          </p>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-5 text-center text-xs text-muted">
        デモ版です。表示している内容は、作り物のデータです。
      </footer>
    </div>
  );
}
