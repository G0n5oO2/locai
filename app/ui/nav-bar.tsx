"use client";
// ナビゲーションバー（第2版 4-1）
// スマホでは画面の下に固定し、パソコン（md 以上の幅）では画面の上に表示する
// ボタンはアイコンだけ。読み上げ用に、見えない名前（aria-label）を付ける
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { unreadCountAction } from "@/app/actions/message";
import type { Role } from "@/lib/auth";

type NavItem = {
  label: string; // 読み上げ・マウスを重ねたときに出る名前
  href: string; // 押したときに開く画面
  match: string[]; // この画面を開いているときに、ボタンの色を変える
  icon: ReactNode;
};

// 生産者のボタン：ホーム・出品・計算・お試し・メッセージ・プロフィール
const producerItems: NavItem[] = [
  { label: "ホーム", href: "/producer/home", match: ["/producer/home"], icon: <HomeIcon /> },
  { label: "出品", href: "/producer/listings", match: ["/producer/listings", "/producer/orders", "/producer/wanted"], icon: <SproutIcon /> },
  { label: "計算", href: "/producer/calc", match: ["/producer/calc"], icon: <CalcIcon /> },
  { label: "お試し", href: "/producer/trial", match: ["/producer/trial"], icon: <GiftIcon /> },
  { label: "メッセージ", href: "/producer/messages", match: ["/producer/messages"], icon: <ChatIcon /> },
  { label: "プロフィール", href: "/mypage", match: ["/mypage", "/producer/profile"], icon: <PersonIcon /> },
];

// 飲食店のボタン：ホーム・仕入れ・探しています・お試し・メッセージ・プロフィール
const buyerItems: NavItem[] = [
  { label: "ホーム", href: "/buyer/home", match: ["/buyer/home"], icon: <HomeIcon /> },
  { label: "仕入れ", href: "/buyer/search", match: ["/buyer/search", "/buyer/listings", "/buyer/orders"], icon: <BasketIcon /> },
  { label: "探しています", href: "/buyer/wanted", match: ["/buyer/wanted"], icon: <SearchIcon /> },
  { label: "お試し", href: "/buyer/trial", match: ["/buyer/trial"], icon: <GiftIcon /> },
  { label: "メッセージ", href: "/buyer/messages", match: ["/buyer/messages"], icon: <ChatIcon /> },
  { label: "プロフィール", href: "/mypage", match: ["/mypage", "/buyer/profile"], icon: <PersonIcon /> },
];

export function NavBar({ role, initialUnread }: { role: Role; initialUnread: number }) {
  const pathname = usePathname();
  // 未読メッセージの数。画面を移動するたびに、サーバーに聞き直す（読んだら消えるように）
  const [unread, setUnread] = useState(initialUnread);
  useEffect(() => {
    let alive = true;
    unreadCountAction()
      .then((n) => alive && setUnread(n))
      .catch(() => {}); // 聞けなかったときは、前の数のまま
    return () => {
      alive = false;
    };
  }, [pathname]);
  const items = role === "producer" ? producerItems : buyerItems;
  // 今開いている画面かどうか（「/producer/listings/new」も「出品」に含める）
  const isActive = (item: NavItem) => item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <>
      {/* スマホ：下に固定。パソコン：一番上（order-first）に置き、スクロールしても上に残す（sticky） */}
      <nav
        aria-label="メインメニュー"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:bottom-auto md:order-first md:border-t-0 md:border-b md:pb-0"
      >
        <div className="mx-auto max-w-3xl md:px-4">
          <ul className="flex justify-around md:justify-center md:gap-2">
            {items.map((item) => {
              const active = isActive(item);
              // メッセージのボタンにだけ、未読の数を出す
              const badge = item.label === "メッセージ" && unread > 0 ? unread : 0;
              const name = badge > 0 ? `${item.label}（未読 ${badge}件）` : item.label;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-label={name}
                    title={name}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex size-14 items-center justify-center rounded-xl ${
                      active ? "bg-leaf-soft text-leaf" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {/* 通知のしるし：未読があるときだけ、右上に数を出す（10件以上は「9+」） */}
                    {badge > 0 && (
                      <span aria-hidden className="absolute top-1.5 right-1.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs leading-5 font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      {/* スマホで、下のバーが画面の最後の内容に重ならないようにする空き */}
      <div aria-hidden className="h-16 shrink-0 md:hidden" />
    </>
  );
}

// ===== アイコン（線で描いた絵。色は文字の色に合わせる） =====

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// ホーム：家
function HomeIcon() {
  return (
    <Icon>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </Icon>
  );
}

// 出品：芽が出た野菜
function SproutIcon() {
  return (
    <Icon>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z" />
      <path d="M12 10c0-3 2.5-5 6-5 0 3-2.5 5-6 5z" />
      <path d="M6 21h12" />
    </Icon>
  );
}

// 計算：電卓
function CalcIcon() {
  return (
    <Icon>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </Icon>
  );
}

// お試し：プレゼントの箱
function GiftIcon() {
  return (
    <Icon>
      <rect x="4" y="9" width="16" height="12" rx="1" />
      <path d="M3 9h18v-2H3z" />
      <path d="M12 7v14" />
      <path d="M12 7c-2-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3-2-5 1z" />
    </Icon>
  );
}

// メッセージ：ふきだし
function ChatIcon() {
  return (
    <Icon>
      <path d="M4 5h16v11H9l-5 4z" />
    </Icon>
  );
}

// プロフィール：人
function PersonIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </Icon>
  );
}

// 仕入れ：かご
function BasketIcon() {
  return (
    <Icon>
      <path d="M3 10h18l-2 10H5z" />
      <path d="M8 10l4-6 4 6" />
      <path d="M9 14v3M15 14v3" />
    </Icon>
  );
}

// 探しています：虫めがね
function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </Icon>
  );
}
