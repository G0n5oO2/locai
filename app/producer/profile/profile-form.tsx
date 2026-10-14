"use client";
// 生産者プロフィールの入力フォーム（確かめと保存はサーバー側の saveProfile で行う）

import { useActionState } from "react";
import { saveProfile, type ProfileFormState } from "@/app/actions/profile";
import { Field } from "@/app/ui/field";
import { RegionSelect } from "@/app/ui/region-select";

type Props = {
  // 府県ごとの市区町村の一覧
  citiesByPrefecture: Record<string, string[]>;
  // すでに保存してあるプロフィール（初回は最初に入れておく値）
  initial: Partial<Record<string, string>>;
};

const inputClass = "rounded-xl border border-line bg-surface px-3 py-3 text-base";
const errorClass = "text-sm text-red-700 dark:text-red-400";

export function ProfileForm({ citiesByPrefecture, initial }: Props) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {});
  const values = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-6">
      <RegionSelect
        legend="畑の地域"
        note="畑の正確な場所は保存しません。市区町村だけを使います。"
        citiesByPrefecture={citiesByPrefecture}
        defaultPrefecture={values.prefecture}
        defaultCity={values.city}
        prefectureErrors={state.errors?.prefecture}
        cityErrors={state.errors?.city}
      />

      <Field label="栽培している品目（例：賀茂茄子、万願寺唐辛子）" name="items" defaultValue={values.items} errors={state.errors?.items} maxLength={200} />

      <div className="flex flex-col gap-1">
        <label htmlFor="commitment" className="text-sm font-bold">栽培のこだわり</label>
        <textarea id="commitment" name="commitment" rows={4} maxLength={500} defaultValue={values.commitment} className={inputClass} />
        {state.errors?.commitment && <p className={errorClass}>{state.errors.commitment[0]}</p>}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold">1回の出荷で、何件まで対応できますか</legend>
        <p className="text-xs text-muted">出品や申し込みの画面で、出荷の負担が大きすぎないかの目安に使います。いつでも変えられます。</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="宅配発送" name="shipLimitDelivery" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitDelivery} errors={state.errors?.shipLimitDelivery} />
          <Field label="自分で配達" name="shipLimitSelf" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitSelf} errors={state.errors?.shipLimitSelf} />
          <Field label="引き取り" name="shipLimitPickup" type="number" inputMode="numeric" min={1} max={100} defaultValue={values.shipLimitPickup} errors={state.errors?.shipLimitPickup} />
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <Field label="お試しの量（kg）" name="trialAmount" inputMode="decimal" defaultValue={values.trialAmount} errors={state.errors?.trialAmount} />
        <p className="text-xs text-muted">まだあなたから買ったことがないお店が、1回だけこの量で買えます（値段はいつもと同じ）。</p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold">宅配発送の送料（重さごと、3行まで）</legend>
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

      <button type="submit" disabled={pending} className="rounded-xl bg-earth px-4 py-3 font-bold text-white disabled:opacity-60">
        {pending ? "保存しています…" : "保存する"}
      </button>
    </form>
  );
}
