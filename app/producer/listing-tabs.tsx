// 出品の画面の上にある「出品／注文管理」の切り替え（第2版 4-3）
import Link from "next/link";

const tabs = [
  { key: "listings", label: "出品", href: "/producer/listings" },
  { key: "orders", label: "注文管理", href: "/producer/orders" },
] as const;

export function ListingTabs({ current }: { current: (typeof tabs)[number]["key"] }) {
  return (
    <nav aria-label="出品と注文管理の切り替え" className="flex gap-2 rounded-2xl bg-surface p-1 md:w-fit">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={`flex-1 rounded-xl px-6 py-2 text-center font-bold md:flex-none ${current === t.key ? "bg-earth text-white" : "text-muted"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
