"use client";
// 納品日のカレンダー（第2版）：販売確定した注文の納品日に、届く野菜のアイコンをのせる
// 日にちを押すと、その日の納品の詳しい内容が下に出る。前の月・次の月にも切り替えられる
import Link from "next/link";
import { useState } from "react";
import { VegIcon } from "@/app/buyer/home/feature-art";

export type CalendarDelivery = {
  id: string;
  date: string; // "2026-10-24"
  vegetable: string;
  quantity: string; // "2kg" や "300g"
  grams: number; // 量（g。野菜ごとの合計に使う）
  partner: string; // 相手（農家さんから見たらお店、お店から見たら農家さん）
  method: string; // 受け渡しの方法（表示用）
  methodKey: "delivery" | "self" | "pickup";
};

// 出品の期限（農家さんのカレンダーだけ）：受付期限・回答期限の日に印を付ける
export type CalendarDeadline = { date: string; kind: "accept" | "answer"; vegetable: string; time: string; listingId: string };
// 1回の出荷で何件まで（農家さんの基準。受け渡し方法ごと）
export type ShipLimits = Record<"delivery" | "self" | "pickup", number>;

const methodNames = { delivery: "宅配発送", self: "自分で配達", pickup: "引き取り" } as const;

// 量の書き方：1kg 以上は kg、それより少なければ g
function amountText(grams: number) {
  return grams >= 1000 ? `${Math.floor(grams / 100) / 10}kg` : `${grams}g`;
}

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

// "2026-10" の月の、カレンダーに並べる日付（前の月・次の月の分は null）
function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DeliveryCalendar({
  deliveries,
  today,
  side,
  limits,
  deadlines = [],
}: {
  deliveries: CalendarDelivery[];
  today: string;
  side: "producer" | "buyer";
  limits?: ShipLimits;
  deadlines?: CalendarDeadline[];
}) {
  const [y0, m0] = today.split("-").map(Number);
  // 見ている月（今月から、前は1か月・先は2か月まで）
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const base = y0 * 12 + (m0 - 1) + offset;
  const year = Math.floor(base / 12);
  const month = (base % 12) + 1;
  const byDate = new Map<string, CalendarDelivery[]>();
  for (const d of deliveries) byDate.set(d.date, [...(byDate.get(d.date) ?? []), d]);
  const accent = side === "producer" ? "earth" : "leaf";
  const picked = selected ? (byDate.get(selected) ?? []) : [];
  const deadlinesOn = (date: string) => deadlines.filter((d) => d.date === date);
  // 出品ごとに番号を付ける（受付期限が早い順）。受付期限と回答期限の印に、同じ番号を入れてセットだと分かるようにする
  const listingIds = [...new Set([...deadlines].sort((a, b) => (a.kind === b.kind ? a.date.localeCompare(b.date) : a.kind === "accept" ? -1 : 1)).map((d) => d.listingId))];
  const numberOf = (listingId: string) => listingIds.indexOf(listingId) + 1;
  const circled = (n: number) => (n >= 1 && n <= 20 ? String.fromCharCode(0x2460 + n - 1) : `(${n})`);
  // 押した日に期限がある出品の、もう一方の期限の日（セットの日）も枠で光らせる
  const pairedDates = new Set(selected ? deadlinesOn(selected).flatMap((d) => deadlines.filter((x) => x.listingId === d.listingId && x.date !== selected).map((x) => x.date)) : []);
  // その日の件数を、受け渡し方法ごとに数える（農家さんの、出荷の負担の目安）
  const countsOn = (date: string) =>
    (["delivery", "self", "pickup"] as const)
      .map((m) => ({ method: m, count: (byDate.get(date) ?? []).filter((d) => d.methodKey === m).length, limit: limits?.[m] ?? Infinity }))
      .filter((c) => c.count > 0);
  // 基準を超えた日か
  const overOn = (date: string) => countsOn(date).some((c) => c.count > c.limit);
  // 押した日の、野菜ごとの合計の量
  const totals = [...picked.reduce((map, d) => map.set(d.vegetable, (map.get(d.vegetable) ?? 0) + d.grams), new Map<string, number>())];

  return (
    // スマホは幅をおさえ、パソコンは横幅いっぱいに使う（マスの高さは決めておき、大きくなりすぎないようにする）
    <section className="flex w-full max-w-md flex-col gap-3 card p-4 md:max-w-none">
      <div className="flex items-center justify-between gap-2">
        {/* 農家さんにとっては「届ける・発送する日」なので、見出しを変える */}
        <h2 className={side === "producer" ? "section-title section-title-earth" : "section-title"}>{side === "producer" ? "出荷・お届けの予定" : "納品の予定"}</h2>
        {/* 月の切り替え */}
        <div className="flex items-center gap-1">
          <button type="button" aria-label="前の月" disabled={offset <= -1} onClick={() => setOffset(offset - 1)} className="flex size-8 items-center justify-center rounded-full text-muted ring-1 ring-line disabled:opacity-30">
            ‹
          </button>
          <span className="w-24 text-center font-bold">
            {year}年{month}月
          </span>
          <button type="button" aria-label="次の月" disabled={offset >= 2} onClick={() => setOffset(offset + 1)} className="flex size-8 items-center justify-center rounded-full text-muted ring-1 ring-line disabled:opacity-30">
            ›
          </button>
        </div>
      </div>

      {/* 農家さん：色の見本（どの色が何の期限か） */}
      {side === "producer" && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-900 ring-1 ring-amber-400">受付期限</span>
          <span className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-bold text-sky-900 ring-1 ring-sky-400">回答期限</span>
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700 ring-1 ring-red-300 dark:bg-red-950 dark:text-red-300">出荷の基準を超えた日</span>
        </div>
      )}
      {/* カレンダー：曜日の見出しと、日にちのマス。納品がある日には、届く野菜のアイコンをのせる */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEK.map((w, i) => (
          <span key={w} className={`py-1 font-bold ${i === 0 ? "text-red-600" : i === 6 ? "text-sky-700" : "text-muted"}`}>
            {w}
          </span>
        ))}
        {monthCells(year, month).map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const items = byDate.get(date) ?? [];
          const isToday = date === today;
          const isSelected = date === selected;
          const over = side === "producer" && overOn(date);
          const marks = deadlinesOn(date);
          const paired = pairedDates.has(date);
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(isSelected ? null : date)}
              aria-label={`${Number(date.slice(8))}日${items.length > 0 ? `（${side === "producer" ? "お届け" : "納品"} ${items.length}件）` : ""}${over ? "（基準を超えています）" : ""}${marks.length > 0 ? "（出品の期限あり）" : ""}`}
              aria-pressed={isSelected}
              className={`flex h-14 flex-col items-center gap-0.5 rounded-xl p-0.5 md:h-24 outline-none focus-visible:ring-2 focus-visible:ring-leaf ${
                isSelected
                  ? accent === "earth"
                    ? "bg-earth-soft ring-2 ring-earth"
                    : "bg-leaf-soft ring-2 ring-leaf"
                  : paired
                    ? "bg-amber-50 ring-2 ring-amber-500 dark:bg-amber-950"
                    : over
                    ? "bg-red-50 ring-1 ring-red-300 dark:bg-red-950"
                    : items.length > 0
                      ? "bg-background"
                      : ""
              }`}
            >
              <span className={`text-xs font-bold ${isToday ? `rounded-full px-1.5 text-white ${accent === "earth" ? "bg-earth" : "bg-leaf"}` : ""}`}>{Number(date.slice(8))}</span>
              {/* 出品の期限の印：どの野菜の期限か分かるよう、野菜のアイコン入りにする（黄色＝受付期限、水色＝回答期限）
                  スマホはアイコンだけ、パソコンは「受 賀茂茄子」のように名前も出す */}
              {marks.length > 0 && (
                <span className="flex max-w-full flex-wrap justify-center gap-0.5">
                  {marks.slice(0, 2).map((m) => (
                    <span
                      key={`${m.listingId}-${m.kind}`}
                      className={`flex max-w-full items-center gap-0.5 rounded-full px-0.5 ring-1 md:px-1 ${m.kind === "accept" ? "bg-amber-100 ring-amber-400" : "bg-sky-100 ring-sky-400"}`}
                    >
                      <span className="[&>svg]:size-3.5 md:[&>svg]:size-4">
                        <VegIcon name={m.vegetable} />
                      </span>
                      {/* 番号（同じ番号が、同じ出品の受付期限と回答期限） */}
                      <span className={`text-[10px] leading-4 font-bold ${m.kind === "accept" ? "text-amber-900" : "text-sky-900"}`}>{circled(numberOf(m.listingId))}</span>
                      <span className={`hidden truncate text-[10px] leading-4 font-bold md:inline ${m.kind === "accept" ? "text-amber-900" : "text-sky-900"}`}>
                        {m.kind === "accept" ? "受" : "回"} {m.vegetable}
                      </span>
                    </span>
                  ))}
                  {marks.length > 2 && <span className="text-[9px] font-bold text-muted">+{marks.length - 2}</span>}
                </span>
              )}
              {/* 届く野菜のアイコン（3つまで。もっとあれば「+数」） */}
              <span className="flex flex-1 items-center justify-center">
                {items.slice(0, 3).map((d) => (
                  <span key={d.id} className="-mx-1 [&>svg]:size-5 sm:[&>svg]:size-6 md:mx-0 md:[&>svg]:size-10">
                    <VegIcon name={d.vegetable} />
                  </span>
                ))}
                {items.length > 3 && <span className="text-[10px] font-bold text-muted">+{items.length - 3}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* 押した日の、納品の詳しい内容 */}
      {selected && (
        <div className="flex flex-col gap-2 rounded-2xl bg-background p-3 text-sm">
          <p className="font-bold">
            {Number(selected.slice(5, 7))}月{Number(selected.slice(8))}日の{side === "producer" ? "お届け" : "納品"}
            {selected === today && "（今日）"}
          </p>
          {picked.length === 0 && <p className="text-muted">この日の{side === "producer" ? "お届け" : "納品"}はありません。</p>}
          {/* 農家さん：野菜ごとの合計の量（何をどれだけ収穫するか）と、受け渡し方法ごとの件数（出荷の負担） */}
          {side === "producer" && picked.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface p-2 ring-1 ring-line">
                <p className="text-xs text-muted">届ける量の合計</p>
                {totals.map(([veg, g]) => (
                  <p key={veg} className="font-bold">
                    {veg} <span className="text-earth">{amountText(g)}</span>
                  </p>
                ))}
              </div>
              <div className="rounded-2xl bg-surface p-2 ring-1 ring-line">
                <p className="text-xs text-muted">件数（あなたの基準）</p>
                {countsOn(selected).map((c) => (
                  <p key={c.method} className={`font-bold ${c.count > c.limit ? "text-red-700 dark:text-red-400" : ""}`}>
                    {methodNames[c.method]} {c.count}件{Number.isFinite(c.limit) && `（${c.limit}件まで）`}
                    {c.count > c.limit && ` → ${c.count - c.limit}件超えています`}
                  </p>
                ))}
              </div>
            </div>
          )}
          {/* 農家さん：この日が期限の出品 */}
          {deadlinesOn(selected).map((d) => (
            <Link key={`${d.listingId}-${d.kind}`} href="/producer/listings" className="flex items-center gap-2 rounded-2xl bg-surface p-2 ring-1 ring-line">
              <span className={`rounded px-1.5 text-xs font-bold ${d.kind === "accept" ? "bg-amber-200 text-amber-900" : "bg-sky-200 text-sky-900"}`}>{d.kind === "accept" ? "受付期限" : "回答期限"}</span>
              <span className="font-bold">
                {circled(numberOf(d.listingId))} {d.vegetable}
              </span>
              <span className="ml-auto text-xs text-muted">{d.time} まで</span>
            </Link>
          ))}
          {picked.map((d) => (
            <Link key={d.id} href={`/orders/${d.id}`} className="flex items-center gap-3 rounded-2xl bg-surface p-2 ring-1 ring-line">
              <VegIcon name={d.vegetable} />
              <span className="flex min-w-0 flex-col">
                {/* 名前・野菜は利用者が入力したものなので、テキストとしてそのまま表示する */}
                <span className="truncate font-bold">
                  {d.vegetable} {d.quantity}
                </span>
                <span className="truncate text-xs text-muted">
                  {d.partner}・{d.method}
                </span>
              </span>
              <span className={`ml-auto shrink-0 text-xs font-bold ${accent === "earth" ? "text-earth" : "text-leaf"}`}>詳しく →</span>
            </Link>
          ))}
        </div>
      )}
      {side === "producer" && listingIds.length > 0 && (
        <div className="flex flex-col gap-1 rounded-2xl bg-background p-3 text-sm">
          <p className="text-xs text-muted">出品の期限（同じ番号が、1つの出品の受付期限と回答期限のセット）</p>
          <ul className="grid gap-1 md:grid-cols-2">
            {listingIds.map((id) => {
              const accept = deadlines.find((d) => d.listingId === id && d.kind === "accept");
              const answer = deadlines.find((d) => d.listingId === id && d.kind === "answer");
              return (
                // 名前の長さで並び方が変わらないよう、いつも「名前の下に日付」にそろえる
                <li key={id} className="flex flex-col rounded-xl bg-surface px-2 py-1">
                  <span className="font-bold">
                    {circled(numberOf(id))} {(accept ?? answer)?.vegetable}
                  </span>
                  <span className="text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300">受付 {accept?.time ?? "—"}</span>
                    {" → "}
                    <span className="font-bold text-sky-800 dark:text-sky-300">回答 {answer?.time ?? "—"}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted">
        販売確定した注文の納品日に、{side === "producer" ? "届ける" : "届く"}野菜をのせています。日にちを押すと、詳しい内容が見られます。
        {side === "producer" && "黄色の枠の野菜は出品の受付期限、水色の枠の野菜は回答期限の日です。同じ番号がセットで、期限の日を押すと、もう一方の日が黄色の枠で光ります。1回の出荷の基準を超えた日は、赤っぽい色になります。"}
      </p>
    </section>
  );
}
