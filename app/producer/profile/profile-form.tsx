"use client";
// 生産者プロフィールの入力フォーム（確かめと保存はサーバー側の saveProfile で行う）

import { useActionState, useState, useTransition } from "react";
import { polishCommitmentAction, saveProfile, type ProfileFormState } from "@/app/actions/profile";
import { Field } from "@/app/ui/field";
import { paymentLabel, paymentMethods, paymentNote } from "@/lib/payment";
import { RegionSelect } from "@/app/ui/region-select";
import { OptionalMark, RequiredMark } from "@/app/ui/required-mark";

type Props = {
  // 府県ごとの市区町村の一覧
  citiesByPrefecture: Record<string, string[]>;
  // すでに保存してあるプロフィール（初回は最初に入れておく値）
  initial: Partial<Record<string, string>>;
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

// 保存ボタンの下に、直すところをまとめて出すときの欄の名前
const fieldNames: Record<string, string> = {
  prefecture: "畑の地域（府県）",
  city: "畑の地域（市区町村）",
  items: "栽培している品目",
  commitment: "栽培のこだわり",
  shipLimitDelivery: "1回の出荷（宅配発送）",
  shipLimitSelf: "1回の出荷（自分で配達）",
  shipLimitPickup: "1回の出荷（引き取り）",
  band1Kg: "宅配発送の送料（1行目）",
  band1Yen: "宅配発送の送料（1行目）",
  band2Kg: "宅配発送の送料（2行目）",
  band2Yen: "宅配発送の送料（2行目）",
  band3Kg: "宅配発送の送料（3行目）",
  band3Yen: "宅配発送の送料（3行目）",
  selfDeliveryYen: "自分で配達するときの料金",
  pickupPlace: "引き取りの場所",
  paymentMethods: "受け付ける支払方法",
};

export function ProfileForm({ citiesByPrefecture, initial }: Props) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const values = state.values ?? initial;
  // 栽培のこだわり（AI の案を「この文を使う」で入れられるように、入力欄の文をここで持つ）
  const [commitment, setCommitment] = useState(values.commitment ?? "");
  const [suggestion, setSuggestion] = useState<{ text?: string; message?: string } | null>(null);
  const [polishing, startPolish] = useTransition();
  // previous を渡すと、前の案とは違う「別の案」を頼む
  const polish = (previous?: string) =>
    startPolish(async () => {
      setSuggestion(await polishCommitmentAction(commitment, previous));
    });
  // 選んである支払方法（「cash,transfer」のように「,」でつないで持っている）
  const checkedPayments = (values.paymentMethods ?? "").split(",");

  return (
    <form action={action} className="flex flex-col gap-6">
      <RegionSelect
        required
        legend="畑の地域"
        note="畑の正確な場所は保存しません。市区町村だけを使います。"
        citiesByPrefecture={citiesByPrefecture}
        defaultPrefecture={values.prefecture}
        defaultCity={values.city}
        prefectureErrors={state.errors?.prefecture}
        cityErrors={state.errors?.city}
      />

      <Field label="栽培している品目（例：賀茂茄子、万願寺唐辛子）" required name="items" defaultValue={values.items} errors={state.errors?.items} maxLength={200} />

      <div className="flex flex-col gap-1">
        <label htmlFor="commitment" className="text-sm font-bold">栽培のこだわり<RequiredMark /></label>
        <textarea
          id="commitment"
          name="commitment"
          rows={4}
          maxLength={500}
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          placeholder={"例：\n・農薬はできるだけ減らしている\n・朝どりしてその日に出す"}
          className={inputClass}
        />
        {state.errors?.commitment && <p className={errorClass}>{state.errors.commitment[0]}</p>}
        <p className="text-xs text-muted">箇条書きでかまいません。下のボタンで、AI が読みやすい文の案を出します。</p>
        <button type="button" onClick={() => polish()} disabled={polishing} className="w-fit btn btn-sm btn-outline-earth text-sm">
          {polishing ? "AI が考えています…" : "AI で文に整える"}
        </button>
        {suggestion?.message && <p className="text-sm text-muted">{suggestion.message}</p>}
        {/* AI の案：使うかどうかは生産者が決める（不変条件5）。AI の文は、テキストとしてそのまま表示する */}
        {suggestion?.text && (
          <div className="flex flex-col gap-2 rounded-xl border border-earth bg-earth-soft p-3">
            <p className="text-xs font-bold text-earth">AI の案</p>
            <p className="text-sm whitespace-pre-wrap">{suggestion.text}</p>
            <p className="text-xs font-bold text-red-700 dark:text-red-400">
              AI は、あなたが書いていないことを足してしまうことがあります。内容が合っているか確かめてから使ってください。
            </p>
            {/* 「この文を使う」「別の案を出す」「使わない（閉じる）」の3つから選ぶ */}
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setSuggestion(null)} className="btn btn-sm btn-plain text-sm">
                使わない
              </button>
              <button type="button" onClick={() => polish(suggestion.text)} disabled={polishing} className="btn btn-sm btn-outline-earth text-sm">
                {polishing ? "考えています…" : "別の案を出す"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommitment(suggestion.text ?? "");
                  setSuggestion(null);
                }}
                className="btn btn-sm btn-earth text-sm"
              >
                この文を使う
              </button>
            </div>
          </div>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold">1回の出荷で、何件まで対応できますか<RequiredMark /></legend>
        <p className="text-xs text-muted">出品や申し込みの画面で、出荷の負担が大きすぎないかの目安に使います。いつでも変えられます。</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="宅配発送" required name="shipLimitDelivery" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitDelivery} errors={state.errors?.shipLimitDelivery} />
          <Field label="自分で配達" required name="shipLimitSelf" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitSelf} errors={state.errors?.shipLimitSelf} />
          <Field label="引き取り" required name="shipLimitPickup" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitPickup} errors={state.errors?.shipLimitPickup} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold">宅配発送の送料（重さごと、3行まで）<OptionalMark /></legend>
        <p className="text-xs text-muted">宅配をしない場合は空のままで大丈夫です。いちばん下の行より重い注文は、宅配では受け付けません。</p>
        {[1, 2, 3].map((n) => (
          <div key={n} className="grid grid-cols-2 gap-3">
            <Field label={`${n}行目：◯kg まで`} name={`band${n}Kg`} inputMode="decimal" defaultValue={values[`band${n}Kg`]} errors={state.errors?.[`band${n}Kg`]} />
            <Field label="送料（円）" name={`band${n}Yen`} inputMode="numeric" defaultValue={values[`band${n}Yen`]} errors={state.errors?.[`band${n}Yen`]} />
          </div>
        ))}
      </fieldset>

      <Field label="自分で配達するときの料金（円・1件あたり。配達しない場合は空）" name="selfDeliveryYen" inputMode="numeric" defaultValue={values.selfDeliveryYen} errors={state.errors?.selfDeliveryYen} />

      <div className="flex flex-col gap-1">
        <Field label="引き取りの場所（引き取りをしない場合は空）" name="pickupPlace" maxLength={200} defaultValue={values.pickupPlace} errors={state.errors?.pickupPlace} />
        <p className="text-xs text-muted">販売確定したお店にだけ表示します。</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-bold">受け付ける支払方法（1つ以上）<RequiredMark /></legend>
        <p className="text-xs text-muted">お店は、ここで選んだ方法の中から選びます。支払い自体は、アプリの外で行います。</p>
        {paymentMethods.map((m) => (
          <label key={m} className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
            <input type="checkbox" name="paymentMethods" value={m} defaultChecked={checkedPayments.includes(m)} className="mt-1" />
            <span className="flex flex-col">
              <span className="font-bold">{paymentLabel[m]}</span>
              <span className="text-xs text-muted">{paymentNote[m]}</span>
            </span>
          </label>
        ))}
        {state.errors?.paymentMethods && <p className={errorClass}>{state.errors.paymentMethods[0]}</p>}
      </fieldset>

      <button type="submit" disabled={pending} className="btn btn-earth">
        {pending ? "保存しています…" : "保存する"}
      </button>

      {/* 直すところがあれば、ボタンのすぐ下にまとめて出す（上のほうの欄のエラーにも気づけるように） */}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-xl border border-red-700 p-3 dark:border-red-400">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">保存できませんでした。次のところを直してください。</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {Object.entries(state.errors).map(([key, messages]) => (
              <li key={key} className={errorClass}>
                {fieldNames[key] ?? key}：{messages?.[0]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
