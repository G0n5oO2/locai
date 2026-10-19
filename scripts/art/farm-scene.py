# 実行：python3 scripts/art/farm-scene.py public/images/farm-scene.svg
# ホームの背景の、1つの広い農園の風景（第2版 4-1）
# 斜め上から見下ろした（アイソメトリックの）広い農園が、絵いっぱいに広がる
# SKY = True にすると、上に空（太陽・雲）と遠くの丘を描く（今は使っていない）
import math, random, sys

SKY = False                   # 空と丘を描くか
W, H = 1600, 1250             # 絵の大きさ
HORIZON = 640 if SKY else -400  # 空と地面の境目（空がないときは、絵の上の外）
U = 62.0                      # 畑の1マスの大きさ（アップにする）
K = 1.8                       # 野菜の絵の大きさ（倍）
A, B = U * math.cos(math.radians(30)), U * 0.5
OX, OY = W / 2, (HORIZON - 40) if SKY else 80  # 地面の原点
random.seed(3)
out = []

def P(x, y, z=0.0):
    return (OX + (x - y) * A, OY + (x + y) * B - z * U)

def poly(pts, fill, extra=""):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}"{extra}/>'

def box(x, y, w, d, h, top, left, right, z=0.0):
    out.append(poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left))
    out.append(poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right))
    out.append(poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top))

if SKY:
    # ===== 空 =====
    out.append(f'<rect width="{W}" height="{HORIZON + 80}" fill="url(#sky)"/>')
    out.append('<circle cx="1260" cy="330" r="150" fill="url(#sunglow)"/>')
    out.append('<circle cx="1260" cy="330" r="58" fill="#fff6c9"/>')
    def cloud(cx, cy, s):
        for dx, dy, r in [(-40, 6, 26), (-12, -10, 34), (22, -4, 30), (48, 8, 22), (0, 12, 30)]:
            out.append(f'<circle cx="{cx + dx * s:.0f}" cy="{cy + dy * s:.0f}" r="{r * s:.0f}" fill="#ffffff" opacity="0.92"/>')
    for cx, cy, s in [(260, 300, 1.4), (620, 230, 1.1), (940, 360, 1.2), (1490, 460, 1.0), (130, 480, 0.9), (1060, 210, 0.8)]:
        cloud(cx, cy, s)

    # ===== 遠くの丘（重ねて奥行きを出す） =====
    out.append(f'<path d="M0 {HORIZON + 10} C 200 {HORIZON - 90} 420 {HORIZON - 60} 620 {HORIZON - 10} S 1000 {HORIZON - 110} 1240 {HORIZON - 40} S 1500 {HORIZON - 70} 1600 {HORIZON - 20} V {H} H 0 Z" fill="#b9dca0"/>')
    out.append(f'<path d="M0 {HORIZON + 40} C 260 {HORIZON - 20} 520 {HORIZON + 10} 780 {HORIZON + 30} S 1200 {HORIZON - 30} 1600 {HORIZON + 30} V {H} H 0 Z" fill="#a7d18a"/>')
    out.append(f'<rect y="{HORIZON + 30}" width="{W}" height="{H - HORIZON}" fill="#a9d18a"/>')
else:
    out.append(f'<rect width="{W}" height="{H}" fill="#b5dc98"/>')

# ===== 農園（畑を斜めのマス目に並べる） =====
crops = ["cabbage", "eggplant", "carrot", "tomato", "corn", "pumpkin"]

# 野菜の絵（cx, cy は株の根もと）。小さくても見分けられるように、形の特徴を描く
def plant(kind, cx, cy):
    o = []
    if kind == "cabbage":     # キャベツ：外側の葉と、丸い玉
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy - 4:.1f}" rx="9" ry="6.5" fill="#5f9e4f"/>')
        o.append(f'<circle cx="{cx:.1f}" cy="{cy - 6:.1f}" r="5.5" fill="#bfe39a"/>')
        o.append(f'<path d="M{cx - 3:.1f} {cy - 6:.1f} q3 -3 6 0" fill="none" stroke="#8cc26a" stroke-width="1.2"/>')
    elif kind == "eggplant":  # なす：緑の葉と、細長いむらさきの実（へたつき）
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy - 9:.1f}" rx="7" ry="4" fill="#4c7a3a"/>')
        o.append(f'<ellipse cx="{cx + 2:.1f}" cy="{cy - 3:.1f}" rx="2.8" ry="5.5" transform="rotate(-20 {cx + 2:.1f} {cy - 3:.1f})" fill="#6b3f8f"/>')
        o.append(f'<circle cx="{cx + 3:.1f}" cy="{cy - 8:.1f}" r="1.8" fill="#2f6b3a"/>')
    elif kind == "carrot":    # にんじん：土から出たオレンジの頭と、ふさふさの葉
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="3" ry="1.8" fill="#e67e22"/>')
        for dx in (-4, 0, 4):
            o.append(f'<path d="M{cx:.1f} {cy:.1f} L{cx + dx:.1f} {cy - 10:.1f}" stroke="#5fa35a" stroke-width="2" stroke-linecap="round"/>')
    elif kind == "tomato":    # トマト：支柱・緑の株・赤い実
        o.append(f'<path d="M{cx:.1f} {cy:.1f} V{cy - 16:.1f}" stroke="#a8814f" stroke-width="1.5"/>')
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy - 8:.1f}" rx="6" ry="7" fill="#4c8a3f"/>')
        for dx, dy in ((-3, -9), (2, -5), (3, -11)):
            o.append(f'<circle cx="{cx + dx:.1f}" cy="{cy + dy:.1f}" r="2.2" fill="#e04a35"/>')
    elif kind == "corn":      # とうもろこし：背の高い茎・葉・黄色い実
        o.append(f'<path d="M{cx:.1f} {cy:.1f} V{cy - 20:.1f}" stroke="#5f9e4f" stroke-width="2.5"/>')
        o.append(f'<path d="M{cx:.1f} {cy - 8:.1f} q-7 -2 -9 -8 M{cx:.1f} {cy - 12:.1f} q7 -2 9 -8" fill="none" stroke="#7fb069" stroke-width="2"/>')
        o.append(f'<ellipse cx="{cx + 2:.1f}" cy="{cy - 14:.1f}" rx="2" ry="4.5" fill="#f2cf4a"/>')
    elif kind == "pumpkin":   # かぼちゃ：すじの入ったオレンジの実と、つる・葉
        o.append(f'<ellipse cx="{cx - 6:.1f}" cy="{cy - 2:.1f}" rx="5" ry="3" fill="#5f9e4f"/>')
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy - 4:.1f}" rx="7" ry="5" fill="#ef8f2f"/>')
        o.append(f'<path d="M{cx - 2.5:.1f} {cy - 8.5:.1f} v9 M{cx + 2.5:.1f} {cy - 8.5:.1f} v9" stroke="#c96e1c" stroke-width="1"/>')
        o.append(f'<path d="M{cx:.1f} {cy - 9:.1f} v-3" stroke="#6b4a24" stroke-width="2"/>')
    elif kind == "sunflower": # ひまわり：茎と葉・黄色い花びら・茶色の真ん中
        o.append(f'<path d="M{cx:.1f} {cy:.1f} V{cy - 18:.1f}" stroke="#5f9e4f" stroke-width="2"/>')
        o.append(f'<ellipse cx="{cx - 4:.1f}" cy="{cy - 8:.1f}" rx="4" ry="2" fill="#7fb069"/>')
        o.append(f'<circle cx="{cx:.1f}" cy="{cy - 20:.1f}" r="6" fill="#f7c948"/>')
        o.append(f'<circle cx="{cx:.1f}" cy="{cy - 20:.1f}" r="2.6" fill="#8a5a2b"/>')
    return o
cells = []
for i in range(-30, 45):
    for j in range(-30, 45):
        x, y = P(i, j)
        if -2 * A < x < W + 2 * A and HORIZON + 10 < y < H + 3 * B:
            cells.append((i + j, i, j))
cells.sort()
FRONT = [(0, HORIZON + 70), (200, HORIZON + 55), (400, HORIZON + 74), (600, HORIZON + 52), (800, HORIZON + 72), (1000, HORIZON + 50), (1200, HORIZON + 70), (1400, HORIZON + 48), (1600, HORIZON + 62)]
# 手前の丘のふちの高さ（x の位置での y）。これより上にはみ出す野菜や木は描かない
def front_y(x):
    if not SKY:
        return -10_000
    for (x0, y0), (x1, y1) in zip(FRONT, FRONT[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return FRONT[-1][1] if x > FRONT[-1][0] else FRONT[0][1]
# 区画：4×4 マスを1つの区画にして、1つの区画には1種類の野菜を植える
# 区画と区画の間は、細い芝生のあぜ道（区画の土を、少し内側に小さく描くと、すき間が芝生になる）
PLOT = 4
GAP = 0.14                     # あぜ道の太さ（マスの何分の1か）
ROAD_I, ROAD_J = 8, 12         # 道は、区画の境目に沿って通す（たてとよこ、1本ずつ）
ROAD_W = 0.45                  # 道の太さの半分
# 小屋やビニールハウスを置く区画は、畑にせず芝生の庭にする（区画の番号）
YARDS = {(1, 0), (2, 1), (1, 3)}
BARN, HOUSE2, GREEN = (5.0, 1.0), (9.8, 5.2), (5.2, 13.0)

# 区画の種類（畑ばかりにならないよう、決まった並びで、草原・果樹園・池・花畑を混ぜる）
PONDS = set()                  # 池の区画（今は池なし。{(0, 2)} のように書くと池になる）
def plot_kind(pi, pj):
    if (pi, pj) in YARDS:
        return "yard"
    if (pi, pj) in PONDS:
        return "pond"
    if (pi + pj) % 4 == 0:
        return "meadow"
    if (pi - pj) % 5 == 0:
        return "orchard"
    # ひまわり畑（"flowers"）は使わない。畑には野菜だけを植える
    return "field"

def on_road(x, y, margin=0.0):
    return abs(x - ROAD_I) < ROAD_W + margin or abs(y - ROAD_J) < ROAD_W + margin

# 見える範囲の区画を、奥から手前の順に描く
plots = sorted({(i // PLOT, j // PLOT) for _, i, j in cells}, key=lambda q: q[0] + q[1])
for pi, pj in plots:
    kind = plot_kind(pi, pj)
    x0, y0 = pi * PLOT + GAP, pj * PLOT + GAP
    x1, y1 = (pi + 1) * PLOT - GAP, (pj + 1) * PLOT - GAP
    if kind in ("field", "flowers"):
        out.append(poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], "#b78a5a"))
        # 区画のふちを少し明るくして、盛り土のように見せる
        out.append(poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], "none", ' stroke="#c9a273" stroke-width="3"'))
    elif kind == "pond":
        # 池：ふちの草の上に、丸い水（明るいところ・はすの葉つき）
        cx, cy = P(pi * PLOT + 2, pj * PLOT + 2)
        out.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{A * 3.3:.1f}" ry="{B * 3.3:.1f}" fill="#9fcf8a"/>')
        out.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{A * 2.9:.1f}" ry="{B * 2.9:.1f}" fill="url(#water)"/>')
        out.append(f'<ellipse cx="{cx - A * 0.8:.1f}" cy="{cy - B * 0.8:.1f}" rx="{A * 1.1:.1f}" ry="{B * 0.5:.1f}" fill="#ffffff" opacity="0.35"/>')
        for dx, dy in ((0.9, 0.4), (1.3, 0.9), (-1.2, 0.8)):
            out.append(f'<ellipse cx="{cx + A * dx:.1f}" cy="{cy + B * dy:.1f}" rx="9" ry="5" fill="#6fae5c"/>')
        out.append(f'<circle cx="{cx + A * 1.3:.1f}" cy="{cy + B * 0.9 - 2:.1f}" r="3" fill="#f6a8c1"/>')
    elif kind in ("meadow", "yard"):
        # 草原・庭：少し明るい芝生
        out.append(poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], "#c3e6a8"))
# 道（区画の上に、まっすぐ描く）
out.append(poly([P(ROAD_I - ROAD_W, -40), P(ROAD_I + ROAD_W, -40), P(ROAD_I + ROAD_W, 60), P(ROAD_I - ROAD_W, 60)], "#f1e0bd"))
out.append(poly([P(-40, ROAD_J - ROAD_W), P(60, ROAD_J - ROAD_W), P(60, ROAD_J + ROAD_W), P(-40, ROAD_J + ROAD_W)], "#f1e0bd"))
# 野菜（区画の中に、きちんと列で並べる）。奥から手前の順に描く
for _, i, j in cells:
    pi, pj = i // PLOT, j // PLOT
    kind = plot_kind(pi, pj)
    if kind in ("yard", "pond", "orchard"):
        continue
    if kind == "meadow":
        # 草原：小さな花を、ところどころに
        random.seed(i * 131 + j * 17)
        for _ in range(2):
            x, y = i + random.uniform(0.2, 0.8), j + random.uniform(0.2, 0.8)
            if on_road(x, y, 0.15):
                continue
            fx, fy = P(x, y)
            col = random.choice(["#ffffff", "#ffe27a", "#f6a8c1"])
            out.append(f'<circle cx="{fx:.1f}" cy="{fy - 3:.1f}" r="3.2" fill="{col}"/><circle cx="{fx:.1f}" cy="{fy - 3:.1f}" r="1.2" fill="#f2b33d"/>')
        continue
    crop = "sunflower" if kind == "flowers" else crops[(pi * 7 + pj * 3) % len(crops)]
    for a, b in ((0.3, 0.3), (0.72, 0.72)):
        x, y = i + a, j + b
        # 道やあぜ道の上には植えない
        if on_road(x, y, 0.15) or min(x - pi * PLOT, (pi + 1) * PLOT - x, y - pj * PLOT, (pj + 1) * PLOT - y) < GAP + 0.1:
            continue
        cx, cy = P(x, y)
        # 野菜のてっぺん（いちばん背の高いとうもろこしで 22）が、丘のふちより下にあるときだけ描く
        if cy - 22 * K > front_y(cx) + 4:
            out.append(f'<g transform="translate({cx:.1f} {cy:.1f}) scale({K}) translate({-cx:.1f} {-cy:.1f})">' + "".join(plant(crop, cx, cy)) + "</g>")

# 木（小屋の庭と、道ばたに並べる。畑の中には立てない）
tree_spots = []
for (pi, pj) in YARDS:
    tree_spots += [(pi * PLOT + 0.6, pj * PLOT + 3.4), (pi * PLOT + 3.4, pj * PLOT + 0.6), (pi * PLOT + 3.4, pj * PLOT + 3.4)]
orchard_spots = []
for pi, pj in plots:
    if plot_kind(pi, pj) == "orchard":
        orchard_spots += [(pi * PLOT + a, pj * PLOT + b) for a in (1.0, 3.0) for b in (1.0, 3.0)]
tree_spots += [(ROAD_I + 0.75, k + 0.5) for k in range(-12, 30, 3)]
tree_spots += [(k + 0.5, ROAD_J - 0.75) for k in range(-12, 30, 3) if abs(k + 0.5 - ROAD_I) > 1.2]
spots = [(t, False) for t in tree_spots] + [(t, True) for t in orchard_spots]
for (tx, ty), fruit in sorted(spots, key=lambda t: t[0][0] + t[0][1]):
    x, y = P(tx, ty)
    if not (front_y(x) + 60 < y < H + 60 and -40 < x < W + 40):
        continue
    out.append(f'<ellipse cx="{x + 4:.1f}" cy="{y + 3:.1f}" rx="16" ry="7" fill="#000" opacity="0.10"/>')
    out.append(f'<rect x="{x - 2.5:.1f}" y="{y - 20:.1f}" width="5" height="20" fill="#8a613b"/>')
    out.append(f'<circle cx="{x:.1f}" cy="{y - 32:.1f}" r="17" fill="url(#tree)"/>')
    if fruit:
        # 果樹園の木には、赤い実（りんご・かき）をつける
        for dx, dy in ((-7, -34), (5, -38), (8, -27), (-3, -24)):
            out.append(f'<circle cx="{x + dx:.1f}" cy="{y + dy:.1f}" r="3" fill="#e2603d"/>')

if SKY:
    # 遠くの畑ほど、丘の色にかすませる（遠くの景色がうすく見える感じ。境目を自然にする）
    out.append(f'<rect y="{HORIZON + 30}" width="{W}" height="200" fill="url(#haze)"/>')
    # 畑の奥の端（ギザギザ）を、手前の丘でなめらかにかくす
    # 上の線は、2番目の丘と同じ形。下の線は、ゆるい波。その間を丘の色で塗る
    wave = list(reversed(FRONT))
    back = " ".join(f"L {x} {y}" for x, y in wave)
    out.append(f'<path d="M0 {HORIZON + 40} C 260 {HORIZON - 20} 520 {HORIZON + 10} 780 {HORIZON + 30} S 1200 {HORIZON - 30} 1600 {HORIZON + 30} {back} Z" fill="#a7d18a"/>')

    # 丘と畑の境目に、丸い草むらと木を並べる
    random.seed(21)
    for k in range(len(FRONT) - 1):
        (x0, y0), (x1, y1) = FRONT[k], FRONT[k + 1]
        for t in [0.1, 0.35, 0.6, 0.85]:
            x = x0 + (x1 - x0) * t + random.uniform(-20, 20)
            y = y0 + (y1 - y0) * t + random.uniform(2, 10)
            r = random.uniform(14, 24)
            out.append(f'<ellipse cx="{x:.1f}" cy="{y + r * 0.5:.1f}" rx="{r * 1.3:.1f}" ry="{r * 0.35:.1f}" fill="#000" opacity="0.08"/>')
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#bush)"/>')
            if random.random() < 0.35:
                out.append(f'<rect x="{x + 18:.1f}" y="{y - 30:.1f}" width="5" height="26" fill="#8a613b"/>')
                out.append(f'<circle cx="{x + 20.5:.1f}" cy="{y - 40:.1f}" r="17" fill="url(#tree)"/>')

# 小屋（赤い三角屋根）
def barn(i, j, wall="#f6ead6", roof="#d9573f"):
    w, d, h = 1.6, 1.5, 0.9
    box(i, j, w, d, h, wall, "#ead5b3", "#d8bd96")
    rz = h + 0.7
    out.append(poly([P(i - 0.1, j + d + 0.1, h), P(i + w + 0.1, j + d + 0.1, h), P(i + w + 0.1, j + d / 2, rz), P(i - 0.1, j + d / 2, rz)], roof))
    out.append(poly([P(i + w + 0.1, j - 0.1, h), P(i + w + 0.1, j + d + 0.1, h), P(i + w + 0.1, j + d / 2, rz)], roof, ' opacity="0.78"'))
    out.append(poly([P(i + 0.5, j + d, 0), P(i + 1.0, j + d, 0), P(i + 1.0, j + d, 0.55), P(i + 0.5, j + d, 0.55)], "#9a6f45"))
barn(*BARN)
barn(*HOUSE2, roof="#3b7d4a")

# ビニールハウス（半透明のかまぼこ形）
gi, gj = GREEN
for k in range(4):
    x0, y0 = P(gi + k * 0.6, gj + 1.2)
    x1, y1 = P(gi + k * 0.6, gj)
    out.append(f'<path d="M {x0:.1f} {y0:.1f} Q {(x0 + x1) / 2 - 6:.1f} {min(y0, y1) - 34:.1f} {x1:.1f} {y1:.1f}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>')
out.append(poly([P(gi, gj + 1.2), P(gi + 2.4, gj + 1.2), P(gi + 2.4, gj + 1.2, 0.7), P(gi, gj + 1.2, 0.7)], "#eaf6ff", ' opacity="0.75"'))
out.append(poly([P(gi, gj, 0.7), P(gi + 2.4, gj, 0.7), P(gi + 2.4, gj + 1.2, 0.7), P(gi, gj + 1.2, 0.7)], "#f5fbff", ' opacity="0.8"'))

# トラック（道の上。荷台に野菜）
ti, tj = ROAD_I - 0.35, 6.0
box(ti, tj, 0.7, 1.6, 0.35, "#f4efe4", "#e2d8c5", "#d1c4ad", z=0.15)
box(ti, tj + 1.6, 0.7, 0.6, 0.65, "#ffffff", "#e9e1d2", "#d7ccb8", z=0.15)
out.append(poly([P(ti + 0.05, tj + 2.2, 0.45), P(ti + 0.65, tj + 2.2, 0.45), P(ti + 0.65, tj + 2.2, 0.72), P(ti + 0.05, tj + 2.2, 0.72)], "#bfe0f0"))
for (a, b) in [(0.7, 0.4), (0.7, 1.9)]:
    cx, cy = P(ti + a, tj + b, 0.1)
    out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="#3a3a3a"/>')
for k, col in enumerate(["#7fb069", "#f08a3c", "#8e5bb5", "#d6402f"]):
    cx, cy = P(ti + 0.35, tj + 0.3 + k * 0.33, 0.6)
    out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="{col}"/>')

defs = '''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9fd3f0"/><stop offset="65%" stop-color="#d8eefa"/><stop offset="100%" stop-color="#fdf8ee"/></linearGradient>
<radialGradient id="sunglow"><stop offset="0%" stop-color="#fff3b0" stop-opacity="0.9"/><stop offset="100%" stop-color="#fff3b0" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a7d18a" stop-opacity="0.9"/><stop offset="100%" stop-color="#a7d18a" stop-opacity="0"/></linearGradient>
<radialGradient id="bush" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#b8e0a0"/><stop offset="70%" stop-color="#86bf6c"/><stop offset="100%" stop-color="#5f9e4f"/></radialGradient>
<linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bfe6f5"/><stop offset="100%" stop-color="#7cc3e3"/></linearGradient>
<radialGradient id="tree" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#9fd48a"/><stop offset="70%" stop-color="#5f9e4f"/><stop offset="100%" stop-color="#3f7536"/></radialGradient>
</defs>'''
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">{defs}' + "".join(out) + "</svg>"
open(sys.argv[1], "w").write(svg)
print(len(out), "parts")
