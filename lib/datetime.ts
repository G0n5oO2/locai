// 日付と日時（日本時間）の変換
// サーバー（Vercel）は日本時間ではない場所で動くので、日本時間であることをはっきり書いて変換する

// "2026-10-20T18:00"（画面の日時の入力欄）→ 日本時間の日時。形が違えば null
export function parseJstDateTime(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return null;
  const date = new Date(`${text}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// "2026-10-20"（画面の日付の入力欄）→ その日付。形が違えば null
export function parseDate(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// 日時が、日本時間で何日か（"2026-10-20"）
export function jstDateText(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
}

// 表示用：10月20日(火) 18:00
export function formatJstDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// 表示用：10月20日(火)（日付だけの値に使う）
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "UTC", month: "numeric", day: "numeric", weekday: "short" }).format(date);
}
