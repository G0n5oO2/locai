// 注文管理の上に出す、売上のまとめ（第2版 4-3）
// 月別の売上（直近6か月）と、野菜別の販売数量・売上（売れ筋の順）を表にする
import { gramsToKgText } from "@/lib/quantity";
import { salesSummary } from "@/lib/sales";
import { requireProducer } from "@/lib/session";

const thClass = "px-3 py-2 text-left text-xs font-bold text-muted";
const tdClass = "px-3 py-2";

export async function SalesSummary() {
  const user = await requireProducer();
  const { months, vegetables } = await salesSummary(user.id);
  const label = (month: string) => `${Number(month.slice(0, 4))}年${Number(month.slice(5))}月`;

  return (
    <section aria-label="売上のまとめ" className="flex flex-col gap-3">
      <p className="text-xs text-muted">販売確定した注文の商品代を、納品日の月で数えています（送料は含みません）。</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <caption className="px-3 pt-3 text-left font-bold">月別の売上（直近6か月）</caption>
            <thead>
              <tr>
                <th scope="col" className={thClass}>月</th>
                <th scope="col" className={`${thClass} text-right`}>件数</th>
                <th scope="col" className={`${thClass} text-right`}>売上</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m.month} className="border-t border-line">
                  <th scope="row" className={`${tdClass} text-left font-normal`}>
                    {label(m.month)}
                    {i === 0 && <span className="ml-1 text-xs text-earth">（今月）</span>}
                  </th>
                  <td className={`${tdClass} text-right`}>{m.count}件</td>
                  <td className={`${tdClass} text-right font-bold`}>{m.yen.toLocaleString()}円</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <caption className="px-3 pt-3 text-left font-bold">野菜別（売れ筋の順・直近6か月）</caption>
            <thead>
              <tr>
                <th scope="col" className={thClass}>野菜</th>
                <th scope="col" className={`${thClass} text-right`}>販売数量</th>
                <th scope="col" className={`${thClass} text-right`}>売上</th>
              </tr>
            </thead>
            <tbody>
              {vegetables.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={3} className={`${tdClass} text-muted`}>まだ販売確定した注文はありません。</td>
                </tr>
              ) : (
                vegetables.map((v) => (
                  <tr key={v.vegetable} className="border-t border-line">
                    {/* 食材名は利用者が入力したものなので、テキストとしてそのまま表示する */}
                    <th scope="row" className={`${tdClass} text-left font-normal`}>{v.vegetable}</th>
                    <td className={`${tdClass} text-right`}>{gramsToKgText(v.quantityG)}kg</td>
                    <td className={`${tdClass} text-right font-bold`}>{v.yen.toLocaleString()}円</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
