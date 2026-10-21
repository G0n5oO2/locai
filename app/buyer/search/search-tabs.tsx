"use client";
// 「条件で探す」と「地図で探す」の切り替え（第2版）
// 切り替えても入力した内容が消えないよう、見えない方も残しておく。地図は、はじめて開いたときに読み込む

import { useState, type ReactNode } from "react";
import { MapSearch } from "./map-search";

export function SearchTabs({ home, children }: { home: { lat: number; lng: number; label: string }; children: ReactNode }) {
  const [tab, setTab] = useState<"form" | "map">("form");
  const [mapOpened, setMapOpened] = useState(false);
  const tabs = [
    { key: "form", label: "条件で探す" },
    { key: "map", label: "地図で探す" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="探し方" className="flex w-full rounded-full bg-leaf-soft p-1 md:w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === "map") setMapOpened(true);
            }}
            className={`flex-1 rounded-full px-6 py-2 text-sm font-bold md:flex-none ${tab === t.key ? "bg-leaf text-white shadow" : "text-leaf"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div hidden={tab !== "form"}>{children}</div>
      {mapOpened && <div hidden={tab !== "map"}><MapSearch home={home} /></div>}
    </div>
  );
}
