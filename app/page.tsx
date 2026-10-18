// 初期画面（紹介画面）
// 仕様書 4章「① 入口」：紹介文を表示し、飲食店・生産者それぞれの入口を用意する
import Link from "next/link";
import type { ReactNode } from "react";
import { IntroSlides, ShowIntroButton } from "./ui/intro-slides";

// 立場ごとの入口。ボタンを押すと、立場を選んだ状態で登録画面が開く
const entrances = [
  {
    who: "飲食店の方",
    title: "野菜を仕入れる",
    points: ["仕入れ日の前に、必要な量だけ申し込める", "送料込みの合計金額が先に分かる", "地元の農家さんのこだわりが見える"],
    tone: "leaf",
    role: "buyer",
  },
  {
    who: "生産者の方",
    title: "野菜を販売する",
    points: ["値段は自分で決めて、一度にまとめて出品", "複数のお店の申し込みを一覧で確認", "どのお店に、どれだけ売るかを自分で決める"],
    tone: "earth",
    role: "producer",
  },
] as const;

// 登録してから使い始めるまでの流れ（第2版 4-2 ②）。絵と一緒に見せる
const signupSteps: { title: string; text: string; icon: ReactNode }[] = [
  { title: "お店か農家さんかを選んで登録", text: "メールアドレスとパスワードで登録します。", icon: <SignupIcon /> },
  { title: "プロフィールを作る", text: "農家さんは畑の地域・送料・支払方法など、お店は地域と届け先を入れます。", icon: <ProfileIcon /> },
  { title: "使いはじめる", text: "農家さんは野菜を出品、お店は仕入れ候補を探せます。", icon: <StartIcon /> },
];

// アプリの使い方の3ステップ
const steps = [
  { title: "農家さんが出品する", text: "売りたい野菜と量、値段、受け渡し方法を登録します。" },
  { title: "お店が必要な量だけ申し込む", text: "条件に合う野菜を探して、使う分だけ申し込みます。" },
  { title: "農家さんが決めて、販売確定", text: "農家さんが承認すると、量・金額・受け渡し方法が決まります。" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* はじめて開いたときだけ、説明のスライドを重ねて出す */}
      <IntroSlides />
      <header className="mx-auto w-full max-w-3xl px-4 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold tracking-wide text-leaf">LocAI</p>
          <Link href="/login" className="text-sm font-bold text-leaf underline">
            ログイン
          </Link>
        </div>
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

        {/* 登録してから使い始めるまで */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">登録から使いはじめるまで</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {signupSteps.map((step, index) => (
              <li key={step.title} className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-4 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-leaf-soft text-leaf">{step.icon}</span>
                <p className="font-bold">
                  {index + 1}. {step.title}
                </p>
                <p className="text-sm leading-6 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
          <ShowIntroButton />
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
              <Link
                href={`/signup?role=${entrance.role}`}
                className={`rounded-xl px-4 py-3 text-center text-base font-bold text-white ${
                  entrance.tone === "leaf" ? "bg-leaf" : "bg-earth"
                }`}
              >
                {entrance.title}
              </Link>
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

// ===== 登録の流れの絵（線で描いたアイコン） =====

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-9" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// 登録：お店と畑（2つの立場）
function SignupIcon() {
  return (
    <StepIcon>
      <path d="M3 10l4-3 4 3v8H3z" />
      <path d="M6 18v-3h2v3" />
      <path d="M14 18c0-3 1.5-5 3.5-5s3.5 2 3.5 5" />
      <path d="M17.5 13v-3" />
      <path d="M17.5 10c0-1.5 1-2.5 2.5-2.5 0 1.5-1 2.5-2.5 2.5z" />
    </StepIcon>
  );
}

// プロフィール：名札
function ProfileIcon() {
  return (
    <StepIcon>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c0-1.7 1.3-2.5 3-2.5s3 .8 3 2.5" />
      <path d="M14 10h4M14 13h4" />
    </StepIcon>
  );
}

// 使いはじめる：かごと野菜
function StartIcon() {
  return (
    <StepIcon>
      <path d="M3 11h18l-2 9H5z" />
      <path d="M8 11l4-6 4 6" />
      <circle cx="12" cy="15.5" r="1.5" />
    </StepIcon>
  );
}
