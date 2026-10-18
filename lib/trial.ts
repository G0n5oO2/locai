// お試し食材のきまり（第2版 4-3・4-4「お試し」）
// 画面とサーバーの両方から使う
import { parseDate } from "./datetime";

// お試しの値段は「100g あたり何円」で決める（何gあたりは 100g で固定）
export const TRIAL_UNIT_G = 100;

// 回答期限：申し込みから何日以内に返事をするか（ボタンで選ぶ）
export const TRIAL_ANSWER_DAYS = [1, 2, 3] as const;
export type TrialAnswerDays = (typeof TRIAL_ANSWER_DAYS)[number];

const DAY = 24 * 60 * 60 * 1000;

// お試し食材の期限を、「収穫できる最後の日」と「回答の日数」から決める
// - 届けられる日：登録した日 〜 収穫できる最後の日
// - 受付：収穫できる最後の日に届けられるよう、その日の「回答の日数」日前の終わり（日本時間 23:59:59）まで
// - 出品としての回答期限：収穫できる最後の日の終わり（それぞれの申し込みの回答期限は、申し込みから○日で決める）
export function trialSchedule(lastDayText: string, answerDays: number, todayText: string) {
  const lastDay = parseDate(lastDayText);
  const today = parseDate(todayText);
  if (!lastDay || !today) return null;
  const acceptLastDay = new Date(lastDay.getTime() - answerDays * DAY);
  const endOfJstDay = (d: Date) => new Date(`${d.toISOString().slice(0, 10)}T23:59:59+09:00`);
  return {
    deliverFrom: today,
    deliverTo: lastDay,
    acceptUntil: endOfJstDay(acceptLastDay),
    answerUntil: endOfJstDay(lastDay),
  };
}

// お試しの申し込みの回答期限：申し込みから○日。ただし、出品の回答期限より後にはしない
export function trialAnswerUntil(now: Date, answerDays: number, listingAnswerUntil: Date): Date {
  const until = new Date(now.getTime() + answerDays * DAY);
  return until < listingAnswerUntil ? until : listingAnswerUntil;
}
