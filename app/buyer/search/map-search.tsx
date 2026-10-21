"use client";
// 地図で探す（第2版）
// 地図には、出品がある市区町村の代表地点に「件数の丸」を出す（畑の場所は出さない：不変条件4）
// スマホは指でなぞって囲む、パソコンはマウスで円を描いて囲む。囲んだ中の出品だけを下に並べる
// 地図の絵は国土地理院の淡色地図を使う（端に出典を表示する）

import "leaflet/dist/leaflet.css";
import type { Circle, LatLng, Layer, Map as LeafletMap, Polygon, Polyline } from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { mapSearch } from "@/app/actions/map-search";
import { methodLabel } from "@/lib/burden";
import { formatDate, formatJstDateTime } from "@/lib/datetime";
import type { MapListing } from "@/lib/map-search";
import { gramsToKgText } from "@/lib/quantity";
import { PriceBox, QualityTags } from "@/app/ui/price-box";

// 囲んだ形（スマホは多角形、パソコンは円）
type Area = { kind: "lasso"; points: { lat: number; lng: number }[] } | { kind: "circle"; lat: number; lng: number; radiusM: number };

export function MapSearch({ home }: { home: { lat: number; lng: number; label: string } }) {
  const [vegetable, setVegetable] = useState("");
  const [listings, setListings] = useState<MapListing[] | null>(null);
  const [message, setMessage] = useState("");
  const [area, setArea] = useState<Area | null>(null);
  const [pending, startTransition] = useTransition();

  // 食材の名前で絞って、受付中の出品を読み直す
  const load = (text: string) =>
    startTransition(async () => {
      const r = await mapSearch(text);
      if ("message" in r) {
        setMessage(r.message);
        return;
      }
      setMessage("");
      setListings(r.listings);
    });

  // 最初に開いたときは、すべての食材を読む
  useEffect(() => {
    load("");
  }, []);

  // 囲んだ中にある出品だけ（並び順はサーバーが決めた順のまま）
  const inside = listings && area ? listings.filter((l) => isInside(area, l)) : [];

  return (
    <div className="flex flex-col gap-4">
      <form
        className="card flex flex-col gap-3 p-4 md:flex-row md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          load(vegetable);
        }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="map-vegetable" className="text-sm font-bold">
            食材（空なら種類を問わない）
          </label>
          <input
            id="map-vegetable"
            value={vegetable}
            maxLength={50}
            placeholder="例：賀茂茄子"
            onChange={(e) => setVegetable(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-3 text-base"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-leaf md:w-fit md:px-10">
          {pending ? "読み込み中…" : "地図に出す"}
        </button>
        {message && <p className="text-sm text-red-700 dark:text-red-400">{message}</p>}
      </form>

      <p className="text-xs text-muted">
        丸の中の数字は、その市区町村にある出品の数です。場所は市区町村の役所の位置で、畑の場所ではありません。地図で探すときは、お店からの距離では絞りません。
      </p>

      <LeafletArea listings={listings ?? []} home={home} area={area} onArea={setArea} />

      {listings && listings.length === 0 && <p className="text-sm text-muted">今、受付中の出品はありません。</p>}
      {listings && listings.length > 0 && !area && <p className="text-sm text-muted">地図で地域を囲むと、その中の出品が下に並びます。</p>}
      {area && (
        <section aria-label="囲んだ地域の出品" className="flex flex-col gap-3">
          <p className="font-bold">囲んだ地域の出品（{inside.length}件）</p>
          {inside.length === 0 ? (
            <p className="text-sm text-muted">囲んだ中に出品はありません。もう少し広く囲んでみてください。</p>
          ) : (
            <>
              <p className="text-xs text-muted">毎回ばらばらに並べ、同じ農家さんの出品は続けて並ばないようにしています。</p>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {inside.map((l) => (
                  <MapCard key={l.listingId} l={l} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

// 地図の部分。leaflet はブラウザでしか動かないので、画面に出たあとで読み込む
function LeafletArea({
  listings,
  home,
  area,
  onArea,
}: {
  listings: MapListing[];
  home: { lat: number; lng: number; label: string };
  area: Area | null;
  onArea: (a: Area | null) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const libRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Layer[]>([]);
  const shapeRef = useRef<Layer | null>(null);
  const [ready, setReady] = useState(false);
  // スマホ（指で操作する画面）かどうか。スマホは「なぞって囲む」、パソコンは「円で囲む」
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [drawing, setDrawing] = useState(false);

  // 地図を作る（最初の1回だけ）
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = mod.default;
      if (cancelled || !boxRef.current || mapRef.current) return;
      libRef.current = L;
      const map = L.map(boxRef.current, { center: [home.lat, home.lng], zoom: 9, minZoom: 7, maxZoom: 15 });
      L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
        attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院</a>',
        maxZoom: 18,
      }).addTo(map);
      // お店の地域（自分の地域なので出してよい）
      L.circleMarker([home.lat, home.lng], { radius: 7, color: "#b5651d", weight: 3, fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(textElement(`お店の地域（${home.label}）`))
        .addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [home.lat, home.lng, home.label]);

  // 出品の数の丸を、市区町村ごとに出し直す
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    for (const m of markersRef.current) m.remove();
    const groups = new Map<string, { lat: number; lng: number; area: string; count: number }>();
    for (const l of listings) {
      const g = groups.get(l.area) ?? { lat: l.lat, lng: l.lng, area: l.area, count: 0 };
      g.count += 1;
      groups.set(l.area, g);
    }
    markersRef.current = [...groups.values()].map((g) => {
      // 数字は textContent で入れる（文字をそのまま表示する）
      const badge = document.createElement("div");
      badge.className = "map-count";
      badge.textContent = String(g.count);
      return L.marker([g.lat, g.lng], { icon: L.divIcon({ html: badge, className: "", iconSize: [34, 34], iconAnchor: [17, 17] }), keyboard: false })
        .bindTooltip(textElement(`${g.area}：${g.count}件`))
        .addTo(map);
    });
  }, [listings, ready]);

  // 囲んだ形を地図に描き直す
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    shapeRef.current?.remove();
    shapeRef.current = null;
    if (!area) return;
    const style = { color: "#3b7d4a", weight: 3, fillColor: "#3b7d4a", fillOpacity: 0.12 };
    shapeRef.current = (
      area.kind === "lasso" ? L.polygon(area.points.map((p) => [p.lat, p.lng]), style) : L.circle([area.lat, area.lng], { ...style, radius: area.radiusM })
    ).addTo(map);
  }, [area, ready]);

  // 囲む操作。囲んでいる間は、地図が動かないようにする
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    const box = boxRef.current;
    if (!drawing || !L || !map || !box) return;
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    box.style.touchAction = "none";
    box.style.cursor = "crosshair";

    let line: Polyline | Circle | Polygon | null = null;
    let points: LatLng[] = [];
    let center: LatLng | null = null;
    const style = { color: "#3b7d4a", weight: 3, fillColor: "#3b7d4a", fillOpacity: 0.12 };
    const at = (e: PointerEvent) => map.mouseEventToLatLng(e);

    const down = (e: PointerEvent) => {
      e.preventDefault();
      box.setPointerCapture(e.pointerId);
      if (touch) {
        points = [at(e)];
        line = L.polyline(points, style).addTo(map);
      } else {
        center = at(e);
        line = L.circle(center, { ...style, radius: 1 }).addTo(map);
      }
    };
    const move = (e: PointerEvent) => {
      if (!line) return;
      if (touch) {
        points.push(at(e));
        (line as Polyline).setLatLngs(points);
      } else if (center) {
        (line as Circle).setRadius(map.distance(center, at(e)));
      }
    };
    const up = (e: PointerEvent) => {
      if (!line) return;
      line.remove();
      line = null;
      if (touch && points.length >= 3) {
        onArea({ kind: "lasso", points: points.map((p) => ({ lat: p.lat, lng: p.lng })) });
        setDrawing(false);
      } else if (!touch && center) {
        // 離した位置までの距離が、円の大きさ（小さすぎるときは、押しただけとみなして何もしない）
        const radiusM = map.distance(center, at(e));
        if (radiusM > 500) {
          onArea({ kind: "circle", lat: center.lat, lng: center.lng, radiusM });
          setDrawing(false);
        }
      }
      center = null;
    };

    box.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up);
    box.addEventListener("pointercancel", up);
    return () => {
      box.removeEventListener("pointerdown", down);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerup", up);
      box.removeEventListener("pointercancel", up);
      line?.remove();
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      box.style.touchAction = "";
      box.style.cursor = "";
    };
  }, [drawing, touch, onArea]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDrawing(!drawing)}
          aria-pressed={drawing}
          className={`btn btn-sm ${drawing ? "btn-leaf" : "btn-outline-leaf"}`}
        >
          {drawing ? "囲むのをやめる" : touch ? "指でなぞって囲む" : "円を描いて囲む"}
        </button>
        {area && (
          <button type="button" onClick={() => onArea(null)} className="btn btn-sm btn-plain">
            囲みを消す
          </button>
        )}
      </div>
      {drawing && (
        <p className="text-sm font-bold text-leaf">
          {touch ? "地図の上を、指で1周なぞってください。" : "円の真ん中でマウスを押し、そのまま外へ動かして、離してください。"}
        </p>
      )}
      {/* isolate：地図の部品が、ナビゲーションバーの上に重ならないようにする */}
      <div ref={boxRef} role="application" aria-label="出品がある地域の地図" className="map-box relative isolate z-0 h-[60vh] min-h-80 w-full overflow-hidden rounded-2xl border border-line md:h-[32rem]" />
    </div>
  );
}

// 出品のカード（金額は、数量を入れる次の画面でアプリが計算する）
// 値段をいちばん大きく、茶色の囲みで目立たせる。量・日付・受け取り方法は小さな枠に分けて、ひと目で読めるようにする
function MapCard({ l }: { l: MapListing }) {
  return (
    <article className="flex flex-col gap-3 card p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* 利用者が入力した文字は、テキストとしてそのまま表示する */}
          <p className="text-xl font-bold">{l.vegetable}</p>
          <QualityTags quality={l.quality} surplus={l.surplus} />
        </div>
        <p className="text-sm text-muted">
          {l.producerName}・{l.area}
          {l.distanceKm !== null && `（お店から 約${l.distanceKm}km）`}
        </p>
      </div>

      {/* 値段 */}
      <PriceBox unitG={l.unitG} unitPriceYen={l.unitPriceYen} />

      {/* 量・日付・受け取り方法 */}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-leaf-soft px-3 py-2">
          <dt className="text-xs font-bold text-leaf">申し込める量</dt>
          <dd className="text-base font-bold">
            {gramsToKgText(l.minOrderG)}〜{gramsToKgText(l.availableG)}kg
          </dd>
        </div>
        <div className="rounded-xl bg-leaf-soft px-3 py-2">
          <dt className="text-xs font-bold text-leaf">届けられる日</dt>
          <dd className="text-base font-bold">
            {formatDate(new Date(l.deliverFrom))}〜{formatDate(new Date(l.deliverTo))}
          </dd>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
          <dt className="text-xs font-bold text-muted">受け取り方法</dt>
          {l.methods.map((m) => (
            <dd key={m} className="rounded-full border border-leaf px-2 py-0.5 text-xs font-bold text-leaf">
              {methodLabel[m]}
            </dd>
          ))}
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
          <dt className="text-xs font-bold text-muted">受付期限</dt>
          <dd className="font-bold text-amber-800 dark:text-amber-300">{formatJstDateTime(new Date(l.acceptUntil))}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted">合計金額（送料込み）は、次の画面で数量と受け取り方法を入れると、アプリが計算して出します。</p>
      <Link href={`/buyer/listings/${l.listingId}`} className="btn btn-leaf mt-auto">
        この出品の購入希望へ進む
      </Link>
    </article>
  );
}

// 囲んだ中に、その出品の市区町村の代表地点が入っているか
function isInside(area: Area, p: { lat: number; lng: number }): boolean {
  if (area.kind === "circle") return distanceM(area, p) <= area.radiusM;
  // なぞった線で囲んだ形の中か（点から横に線を伸ばし、形のふちと何回交わるかで調べる）
  let inside = false;
  const pts = area.points;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.lat > p.lat !== b.lat > p.lat && p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng) inside = !inside;
  }
  return inside;
}

// 2地点のまっすぐな距離（m）
function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// 地図の吹き出しに出す文字（HTML としてではなく、文字として入れる）
function textElement(text: string): HTMLElement {
  const el = document.createElement("span");
  el.textContent = text;
  return el;
}
