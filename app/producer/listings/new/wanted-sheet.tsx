"use client";
// 「探しています」を見るボトムシート（docs/04_producer_design.md 1章）
// 出品画面の上に重ねて出すので、入力中の内容は消えない

import { useRef, useState } from "react";
import { methodLabel } from "@/lib/burden";
import { formatDate } from "@/lib/datetime";
import { gramsToKgText } from "@/lib/quantity";
import type { PublicWanted } from "@/lib/wanted";
import { firstTab, splitWanted, type WantedTab } from "@/lib/wanted-tabs";

export function WantedSheet({ wanted, vegetable }: { wanted: PublicWanted[]; vegetable: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabs = splitWanted(wanted, vegetable);
  const [tab, setTab] = useState<WantedTab>("specified");
  const name = vegetable.trim() || "出品する食材";
  const total = tabs.specified.length + tabs.substitute.length + tabs.any.length;

  function open() {
    // 開くたびに、件数のあるタブから見せる（坂田さんがタブを押して探さなくてよいように）
    setTab(firstTab(tabs));
    dialogRef.current?.showModal();
  }

  const tabList: { key: WantedTab; label: string }[] = [
    { key: "specified", label: name },
    { key: "substitute", label: "代替野菜OK" },
    { key: "any", label: "種類を問わない" },
  ];

  return (
    <>
      <button type="button" onClick={open} className="w-fit text-sm font-bold text-earth underline">
        「探しています」を確認してみる
      </button>
      <dialog
        ref={dialogRef}
        aria-label="近くの「探しています」"
        className="fixed inset-x-0 bottom-0 m-0 mt-auto max-h-[75vh] w-full max-w-none rounded-t-2xl bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="mx-auto flex max-w-md flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">近くの「探しています」（畑から70km以内）</p>
            <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-lg border border-line px-3 py-1 text-sm">
              閉じる
            </button>
          </div>

          {total === 0 ? (
            // 3つとも0件のとき（設計メモ1章）
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-bold">今、この地域で{name}を探しているお店はありません。</p>
              <p>出荷の負担（最低注文量の下の「最大◯件」の表示）を目安に、最低注文量を決めてみましょう。</p>
            </div>
          ) : (
            <>
              <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1 text-sm">
                {tabList.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={`truncate rounded-lg px-2 py-2 ${tab === t.key ? "bg-surface font-bold shadow" : "text-muted"}`}
                  >
                    {t.label}（{tabs[t.key].length}）
                  </button>
                ))}
              </div>
              <ul role="tabpanel" className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto text-sm">
                {tabs[tab].length === 0 && <li className="text-muted">このタブには、まだありません。</li>}
                {tabs[tab].map((w) => (
                  <li key={w.id} className="flex flex-col rounded-xl border border-line p-3">
                    <span className="font-bold">
                      {gramsToKgText(w.quantityG)}kg
                      {tab === "substitute" && <span className="font-normal">（{w.vegetable} の代わりとして）</span>}
                      {tab === "any" && <span className="font-normal">（野菜なら何でも）</span>}
                    </span>
                    <span className="text-muted">
                      使用日 {formatDate(new Date(w.useDate))}・{methodLabel[w.method]}・{w.area}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">希望数量が少ない順です。お店の名前や住所は表示されません。</p>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
