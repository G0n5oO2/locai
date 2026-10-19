"use client";
// 飲食店プロフィールの入力フォーム（確かめと保存はサーバー側の saveBuyerProfile で行う）

import { useActionState } from "react";
import { saveBuyerProfile, type BuyerProfileFormState } from "@/app/actions/buyer-profile";
import { Field } from "@/app/ui/field";
import { RegionSelect } from "@/app/ui/region-select";

type Props = {
  citiesByPrefecture: Record<string, string[]>;
  initial: Partial<Record<string, string>>;
};

export function BuyerProfileForm({ citiesByPrefecture, initial }: Props) {
  const [state, action, pending] = useActionState<BuyerProfileFormState, FormData>(saveBuyerProfile, {});
  const values = state.values ?? initial;

  return (
    <form action={action} className="flex flex-col gap-6">
      <RegionSelect
        required
        legend="お店の地域"
        note="近くの農家さんの出品を探すのに使います。農家さんには、地域だけが伝わります。"
        citiesByPrefecture={citiesByPrefecture}
        defaultPrefecture={values.prefecture}
        defaultCity={values.city}
        prefectureErrors={state.errors?.prefecture}
        cityErrors={state.errors?.city}
      />
      <div className="flex flex-col gap-1">
        <Field label="届け先の住所" required name="address" maxLength={200} autoComplete="street-address" defaultValue={values.address} errors={state.errors?.address} />
        <p className="text-xs text-muted">販売確定した相手の農家さんにだけ表示します。</p>
      </div>
      <button type="submit" disabled={pending} className="btn btn-leaf">
        {pending ? "保存しています…" : "保存する"}
      </button>
    </form>
  );
}
