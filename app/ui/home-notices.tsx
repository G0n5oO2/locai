"use client";
// ログインしてホームを開いたときに、上からアニメーションで出てくる通知（第2版）
// ログインのたびに毎回出す（未読のメッセージなどが残っているあいだは、ずっと出る）。出すものがなければ出さない
// 内容は出さず、「何が何件あるか」だけを出す。それぞれにボタンを付ける（進む／閉じる）
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type Notice = {
  key: string;
  text: string;
  tone: "leaf" | "earth" | "red";
  action: { label: string; href: string }; // 進むボタン（例：返信する）
  dismissLabel: string; // 閉じるボタン（例：確認した）
};

const toneClass = {
  leaf: { badge: "bg-leaf-soft text-leaf", button: "btn-leaf" },
  earth: { badge: "bg-earth-soft text-earth", button: "btn-earth" },
  red: { badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300", button: "btn-earth" },
};

export function HomeNotices({ notices, fromLogin }: { notices: Notice[]; fromLogin: boolean }) {
  const [shown, setShown] = useState<Notice[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (!fromLogin) return;
    // アドレスの「ログインしたばかり」の印を消す（再読み込みや「戻る」で、もう一度出ないように）
    // 画面を作り直すと通知も消えてしまうので、アドレスだけを書きかえる（ボタンを押すまで出したままにする）
    window.history.replaceState(null, "", pathname);
    if (notices.length === 0) return;
    const show = setTimeout(() => setShown(notices), 300);
    return () => clearTimeout(show);
  }, [fromLogin, notices, pathname]);

  const close = (key: string) => setShown((list) => list.filter((x) => x.key !== key));
  if (shown.length === 0) return null;
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
      {shown.map((n, i) => (
        <div key={n.key} className="pointer-events-auto flex w-full max-w-md flex-col gap-3 card p-4 text-sm motion-safe:animate-drop" style={{ animationDelay: `${i * 0.15}s` }}>
          <div className="flex items-start gap-2">
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${toneClass[n.tone].badge}`}>お知らせ</span>
            <p className="flex-1 pt-0.5 font-bold">{n.text}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => close(n.key)} className="btn btn-sm btn-plain">
              {n.dismissLabel}
            </button>
            <Link href={n.action.href} onClick={() => close(n.key)} className={`btn btn-sm ${toneClass[n.tone].button}`}>
              {n.action.label}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
