// 購入希望の画面に出す、送料のきまり（第2版）
// 宅配の送料 ＝ 重さの料金 ＋ 距離の料金。お店までの距離と、あてはまる行が分かるようにする
// 距離は、市区町村の代表地点（役所の場所）どうしの、だいたいの距離（畑やお店のくわしい場所は使わない：不変条件4）
import { deliveryBands, distanceBands } from "@/lib/fees";
import { gramsToKgText } from "@/lib/quantity";

type Profile = Parameters<typeof deliveryBands>[0] & Parameters<typeof distanceBands>[0] & { selfDeliveryMaxKm: number | null };

export function ShippingInfo({ profile, km, selfBlocked, offersDelivery }: { profile: Profile; km: number; selfBlocked: boolean; offersDelivery: boolean }) {
  const weight = deliveryBands(profile);
  const distance = distanceBands(profile);
  // お店の距離があてはまる行（表より遠ければ -1）
  const hit = distance.findIndex((b) => km <= b.maxKm);
  return (
    <div className="flex flex-col gap-3 card p-4 text-sm">
      <p>
        <span className="text-xs text-muted">お店までの距離　</span>
        <strong className="text-lg">約 {km}km</strong>
        <span className="block text-xs text-muted">市区町村の役所どうしの、だいたいの距離です。</span>
      </p>
      {offersDelivery && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">宅配発送の送料 ＝ 重さの料金 ＋ 距離の料金</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-2">
              <p className="text-xs font-bold text-muted">重さの料金</p>
              {weight.map((b) => (
                <p key={b.maxG} className="flex justify-between gap-2">
                  <span>{gramsToKgText(b.maxG)}kg まで</span>
                  <span className="font-bold">{b.yen.toLocaleString()}円</span>
                </p>
              ))}
            </div>
            <div className="rounded-xl bg-background p-2">
              <p className="text-xs font-bold text-muted">距離の料金</p>
              {distance.length === 0 ? (
                <p>かかりません</p>
              ) : (
                <>
                  {distance.map((b, i) => (
                    <p key={b.maxKm} className={`flex justify-between gap-2 rounded px-1 ${i === hit ? "bg-leaf-soft font-bold text-leaf" : ""}`}>
                      <span>
                        {b.maxKm}km まで{i === hit && "（あなたのお店）"}
                      </span>
                      <span className="font-bold">{b.yen.toLocaleString()}円</span>
                    </p>
                  ))}
                  {hit === -1 && (
                    <p className="mt-1 rounded bg-amber-50 px-1 font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      お店が表より遠いので、送料は要相談です（農家さんが決めてから知らせます）
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {selfBlocked && (
        <p className="rounded-xl bg-background p-2 text-xs">
          この農家さんの配達は {profile.selfDeliveryMaxKm}km までのお店なので、「農家さんが配達」は選べません。宅配発送か引き取りを選んでください。
        </p>
      )}
    </div>
  );
}
