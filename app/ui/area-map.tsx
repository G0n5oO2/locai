"use client";
// 地図で囲む部品（第2版）：お店の「地図で探す」と、農家さんの「探しています」の地図で使い回す
// 丸は、市区町村の代表地点（役所の場所）に出し、件数を数字で入れる。くわしい場所は出さない（不変条件4）
// スマホは指でなぞって囲む、パソコンはマウスで円を描いて囲む
// 地図の絵は国土地理院の淡色地図を使う（端に出典を表示する）

import "leaflet/dist/leaflet.css";
import type { Circle, LatLng, Layer, Map as LeafletMap, Polygon, Polyline } from "leaflet";
import { useEffect, useRef, useState } from "react";

// 囲んだ形（スマホは多角形、パソコンは円）
export type Area = { kind: "lasso"; points: { lat: number; lng: number }[] } | { kind: "circle"; lat: number; lng: number; radiusM: number };
// 丸を出す地点（area は「府県 市区町村」。同じ area は1つの丸にまとめる）
export type MapPoint = { lat: number; lng: number; area: string };

// 地図の部分。leaflet はブラウザでしか動かないので、画面に出たあとで読み込む
// points：丸を出す地点（市区町村ごとにまとめて、件数を数字で出す）
// home：自分の地域（お店、または畑）。tone：線と丸の色（お店は緑、農家さんは茶色）
export function AreaMap({
  points,
  home,
  area,
  onArea,
  unit = "件",
  tone = "leaf",
}: {
  points: MapPoint[];
  home: { lat: number; lng: number; label: string };
  area: Area | null;
  onArea: (a: Area | null) => void;
  unit?: string;
  tone?: "leaf" | "earth";
}) {
  const color = tone === "leaf" ? "#3b7d4a" : "#9e5b27";
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
      L.circleMarker([home.lat, home.lng], { radius: 7, color: tone === "leaf" ? "#b5651d" : "#3b7d4a", weight: 3, fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(textElement(home.label))
        .addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [home.lat, home.lng, home.label, tone]);

  // 件数の丸を、市区町村ごとに出し直す
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    for (const m of markersRef.current) m.remove();
    const groups = new Map<string, { lat: number; lng: number; area: string; count: number }>();
    for (const l of points) {
      const g = groups.get(l.area) ?? { lat: l.lat, lng: l.lng, area: l.area, count: 0 };
      g.count += 1;
      groups.set(l.area, g);
    }
    markersRef.current = [...groups.values()].map((g) => {
      // 数字は textContent で入れる（文字をそのまま表示する）
      const badge = document.createElement("div");
      badge.className = tone === "leaf" ? "map-count" : "map-count map-count-earth";
      badge.textContent = String(g.count);
      return L.marker([g.lat, g.lng], { icon: L.divIcon({ html: badge, className: "", iconSize: [34, 34], iconAnchor: [17, 17] }), keyboard: false })
        .bindTooltip(textElement(`${g.area}：${g.count}${unit}`))
        .addTo(map);
    });
  }, [points, ready, tone, unit]);

  // 囲んだ形を地図に描き直す
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    shapeRef.current?.remove();
    shapeRef.current = null;
    if (!area) return;
    const style = { color, weight: 3, fillColor: color, fillOpacity: 0.12 };
    shapeRef.current = (
      area.kind === "lasso" ? L.polygon(area.points.map((p) => [p.lat, p.lng]), style) : L.circle([area.lat, area.lng], { ...style, radius: area.radiusM })
    ).addTo(map);
  }, [area, ready, color]);

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
    const style = { color, weight: 3, fillColor: color, fillOpacity: 0.12 };
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
  }, [drawing, touch, onArea, color]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDrawing(!drawing)}
          aria-pressed={drawing}
          className={`btn btn-sm ${drawing ? (tone === "leaf" ? "btn-leaf" : "btn-earth") : tone === "leaf" ? "btn-outline-leaf" : "btn-outline-earth"}`}
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
        <p className={`text-sm font-bold ${tone === "leaf" ? "text-leaf" : "text-earth"}`}>
          {touch ? "地図の上を、指で1周なぞってください。" : "円の真ん中でマウスを押し、そのまま外へ動かして、離してください。"}
        </p>
      )}
      {/* isolate：地図の部品が、ナビゲーションバーの上に重ならないようにする */}
      <div ref={boxRef} role="application" aria-label="件数がある地域の地図" className="map-box relative isolate z-0 h-[60vh] min-h-80 w-full overflow-hidden rounded-2xl border border-line md:h-[32rem]" />
    </div>
  );
}


// 囲んだ中に、その市区町村の代表地点が入っているか
export function isInside(area: Area, p: { lat: number; lng: number }): boolean {
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
