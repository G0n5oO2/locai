"use client";
// 地域（府県 → 市区町村）を選ぶ部品。生産者と飲食店のプロフィールで使い回す

import { useState } from "react";
import { RequiredMark } from "./required-mark";

type Props = {
  legend: string;
  note: string;
  // 府県ごとの市区町村の一覧
  citiesByPrefecture: Record<string, string[]>;
  defaultPrefecture?: string;
  defaultCity?: string;
  prefectureErrors?: string[];
  cityErrors?: string[];
  // 必須なら true（見出しの横に赤い「必須」のしるしを出す）
  required?: boolean;
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function RegionSelect({ legend, note, citiesByPrefecture, defaultPrefecture, defaultCity, prefectureErrors, cityErrors, required }: Props) {
  // 府県を選ぶと、市区町村の選択肢が切り替わる
  const [prefecture, setPrefecture] = useState(defaultPrefecture ?? "");
  const cities = citiesByPrefecture[prefecture] ?? [];

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-bold">
        {legend}
        {required && <RequiredMark />}
      </legend>
      {/* 送信のあとフォームが元に戻されても、選んだ府県が消えないように、defaultValue で持つ */}
      <select name="prefecture" defaultValue={defaultPrefecture ?? ""} onChange={(e) => setPrefecture(e.target.value)} className={inputClass} aria-label="府県">
        <option value="">府県を選ぶ</option>
        {Object.keys(citiesByPrefecture).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      {prefectureErrors && <p className={errorClass}>{prefectureErrors[0]}</p>}
      {/* 府県が変わったら選び直してもらうため、key で作り直す */}
      <select key={prefecture} name="city" defaultValue={defaultCity ?? ""} disabled={!prefecture} className={inputClass} aria-label="市区町村">
        <option value="">市区町村を選ぶ</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {cityErrors && <p className={errorClass}>{cityErrors[0]}</p>}
      <p className="text-xs text-muted">{note}</p>
    </fieldset>
  );
}
