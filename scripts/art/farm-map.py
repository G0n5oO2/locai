# 実行：python3 scripts/art/farm-map.py （出てきた SVG を app/ui/farm-map.tsx の形に直して使う）
# アイソメトリックの農園の絵（SVG）を、計算で作る
import math, sys
S = 22.0                      # 1マスの大きさ
CX, CY = 400.0, 120.0         # 原点の位置
C30, S30 = math.cos(math.radians(30)), 0.5

def P(x, y, z=0.0):
    """地面の座標 (x, y) と高さ z を、画面の座標に変える"""
    return (CX + (x - y) * C30 * S, CY + (x + y) * S30 * S - z * S)

def poly(pts, fill, extra=""):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}"{extra} />'

out = []
def box(x, y, w, d, h, top, left, right, z=0.0):
    """直方体（上・左の面・右の面を、ちがう明るさで塗る）"""
    out.append(poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left))      # 手前左の面
    out.append(poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right))     # 手前右の面
    out.append(poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top))       # 上の面

def tile(x, y, w, d, fill, z=0.0, extra=""):
    out.append(poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill, extra))

def ellipse_at(x, y, z, rx, ry, fill, extra=""):
    px, py = P(x, y, z)
    out.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{rx}" ry="{ry}" fill="{fill}"{extra} />')

# --- 地面（島のように、厚みのある芝生） ---
box(0, 0, 16, 11, 0.6, "url(#fm-grass)", "#8fb86f", "#7aa45d", z=-0.6)
# 小道（農家さんの小屋から、お店へつながる）
tile(3.2, 4.6, 9.6, 1.0, "#f3e3c3")
tile(11.8, 4.6, 1.0, 4.0, "#f3e3c3")

# --- 畑（土の上に、作物の列） ---
fields = [
    (1.0, 6.5, 4.0, 3.5, "#7fb069", "#4c7a3a"),   # 葉もの
    (5.6, 6.5, 3.6, 3.5, "#8e5bb5", "#5d3a7a"),   # なす
    (1.0, 1.0, 3.6, 3.0, "#f08a3c", "#b25f1f"),   # にんじん
]
for fx, fy, fw, fd, crop, crop_dark in fields:
    box(fx, fy, fw, fd, 0.25, "#b98a5a", "#9a6f45", "#8a613b")
    row = fy + 0.5
    while row < fy + fd - 0.2:
        col = fx + 0.45
        while col < fx + fw - 0.2:
            ellipse_at(col, row, 0.45, 6.5, 4.5, crop_dark)
            ellipse_at(col - 0.05, row - 0.05, 0.6, 5.5, 4, crop)
            col += 0.7
        row += 0.8

# --- 農家さんの小屋（赤い屋根） ---
bx, by, bw, bd, bh = 5.4, 1.2, 2.6, 2.4, 1.6
box(bx, by, bw, bd, bh, "#f6ead6", "#e9d2b0", "#d8bd96")
# 屋根（三角の屋根：左右に分かれた面）
ridge_z = bh + 1.1
out.append(poly([P(bx - 0.2, by + bd + 0.2, bh), P(bx + bw + 0.2, by + bd + 0.2, bh), P(bx + bw + 0.2, by + bd / 2, ridge_z), P(bx - 0.2, by + bd / 2, ridge_z)], "#d9573f"))
out.append(poly([P(bx + bw + 0.2, by - 0.2, bh), P(bx + bw + 0.2, by + bd + 0.2, bh), P(bx + bw + 0.2, by + bd / 2, ridge_z)], "#b5402c"))
# 戸
dx = bx + 0.9
out.append(poly([P(dx, by + bd, 0), P(dx + 0.8, by + bd, 0), P(dx + 0.8, by + bd, 1.0), P(dx, by + bd, 1.0)], "#9a6f45"))

# --- 飲食店（しま模様のひさし） ---
rx, ry, rw, rd, rh = 10.6, 8.8, 3.0, 1.8, 1.7
box(rx, ry, rw, rd, rh, "#fffaf0", "#f1e4cc", "#e4d2b4")
box(rx, ry, rw, rd, 0.25, "#3b7d4a", "#2f6b3a", "#285c32", z=rh)   # 屋根のふち
# ひさし（緑と白のしま）
for i in range(6):
    x0 = rx + i * rw / 6
    color = "#4f9a5c" if i % 2 == 0 else "#ffffff"
    out.append(poly([P(x0, ry + rd, 1.25), P(x0 + rw / 6, ry + rd, 1.25), P(x0 + rw / 6, ry + rd + 0.5, 0.95), P(x0, ry + rd + 0.5, 0.95)], color))
# 窓と戸
out.append(poly([P(rx + 0.3, ry + rd, 0.35), P(rx + 1.3, ry + rd, 0.35), P(rx + 1.3, ry + rd, 0.95), P(rx + 0.3, ry + rd, 0.95)], "#bfe0f0"))
out.append(poly([P(rx + 1.8, ry + rd, 0), P(rx + 2.5, ry + rd, 0), P(rx + 2.5, ry + rd, 1.0), P(rx + 1.8, ry + rd, 1.0)], "#9a6f45"))

# --- 野菜を運ぶ軽トラ（小道の上） ---
box(9.0, 4.75, 1.4, 0.7, 0.45, "#f6f1e6", "#e6dccb", "#d6cab5")
box(9.9, 4.75, 0.5, 0.7, 0.75, "#ffffff", "#e6dccb", "#d6cab5")
for wx in (9.25, 10.1):
    ellipse_at(wx, 5.45, 0.05, 3.5, 3.5, "#3a3a3a")
ellipse_at(9.4, 5.1, 0.6, 5, 3.5, "#7fb069")
ellipse_at(9.7, 5.05, 0.65, 4.5, 3, "#f08a3c")

# --- 木（丸い葉と影） ---
for tx, ty in [(14.6, 1.2), (14.8, 3.2), (0.6, 4.6), (9.6, 1.0), (15.0, 6.2)]:
    ellipse_at(tx + 0.2, ty + 0.2, 0, 11, 5, "#000000", ' opacity="0.12"')
    px, py = P(tx, ty, 0)
    out.append(f'<rect x="{px - 2:.1f}" y="{py - 16:.1f}" width="4" height="16" fill="#8a613b" />')
    out.append(f'<circle cx="{px:.1f}" cy="{py - 24:.1f}" r="13" fill="url(#fm-tree)" />')

defs = '''<defs>
  <linearGradient id="fm-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#cfe8b4" /><stop offset="100%" stop-color="#a9d18a" /></linearGradient>
  <radialGradient id="fm-tree" cx="35%" cy="30%" r="75%"><stop offset="0%" stop-color="#9fd48a" /><stop offset="70%" stop-color="#5f9e4f" /><stop offset="100%" stop-color="#3f7536" /></radialGradient>
</defs>'''
svg = f'<svg viewBox="170 60 560 385" xmlns="http://www.w3.org/2000/svg">{defs}' + "".join(out) + "</svg>"
open(sys.argv[1], "w").write(svg)
print(len(out), "parts")
